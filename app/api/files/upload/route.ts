/**
 * API Route: /api/files/upload
 * Universal file upload endpoint with GitHub CDN storage
 * Supports: direct files, image URLs, with optional compression
 * Categories: products, vehicles, receipts, documents, general
 */
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, FileCategory } from '@/lib/services/githubCdnService';
import sharp from 'sharp';

 
const ALLOWED_CATEGORIES: FileCategory[] = ['products', 'vehicles', 'receipts', 'documents', 'general'];

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/json',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Image processing config per category
const IMAGE_CONFIG: Record<string, { width?: number; height?: number; quality: number; format: 'png' | 'jpeg' | 'webp' }> = {
  products: { width: 800, height: 800, quality: 85, format: 'png' },
  vehicles: { width: 1200, height: 800, quality: 80, format: 'jpeg' },
  receipts: { width: 1200, quality: 90, format: 'jpeg' },
  documents: { quality: 95, format: 'png' },
  general: { quality: 85, format: 'webp' },
};

/**
 * Process image with Sharp based on category settings
 */
async function processImage(buffer: Buffer, category: FileCategory, originalMime: string): Promise<{ buffer: Buffer; mimeType: string }> {
  // Skip processing for non-images
  if (!originalMime.startsWith('image/')) {
    return { buffer, mimeType: originalMime };
  }

  const config = IMAGE_CONFIG[category] || IMAGE_CONFIG.general;
  
  let pipeline = sharp(buffer);
  
  // Resize if dimensions specified
  if (config.width || config.height) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to target format
  switch (config.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: config.quality, progressive: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: config.quality });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: config.quality });
      break;
  }

  const processed = await pipeline.toBuffer();
  
  return {
    buffer: processed,
    mimeType: `image/${config.format}`,
  };
}

/**
 * Download file from URL
 */
async function downloadFromUrl(url: string): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RPM-CDN-Download/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get('content-type') || 'application/octet-stream';

  return { buffer, mimeType, size: buffer.length };
}

// POST /api/files/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Required params
    const category = formData.get('category') as FileCategory;
    const id = formData.get('id') as string;
    
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid or missing category', allowed: ALLOWED_CATEGORIES },
        { status: 400 }
      );
    }
    
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid or missing id. Use alphanumeric, hyphen, underscore only.' },
        { status: 400 }
      );
    }

    // Get file from upload or URL
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('url') as string | null;
    
    let buffer: Buffer;
    let mimeType: string;
    let originalSize: number;
    let source: string;

    if (file) {
      // Direct file upload
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Unsupported file type', allowed: ALLOWED_MIME_TYPES },
          { status: 400 }
        );
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large', maxSize: MAX_FILE_SIZE },
          { status: 400 }
        );
      }

      buffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type;
      originalSize = file.size;
      source = 'upload';
      
    } else if (imageUrl) {
      // Download from URL
      try {
        const downloaded = await downloadFromUrl(imageUrl);
        buffer = downloaded.buffer;
        mimeType = downloaded.mimeType;
        originalSize = downloaded.size;
        source = 'url';
        
        if (buffer.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: 'Downloaded file too large', maxSize: MAX_FILE_SIZE },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to download from URL', details: e instanceof Error ? e.message : 'Unknown error' },
          { status: 400 }
        );
      }
      
    } else {
      return NextResponse.json(
        { error: 'No file or URL provided' },
        { status: 400 }
      );
    }

    // Process image (compress/resize if applicable)
    const shouldProcess = formData.get('process') !== 'false'; // Default true
    
    let finalBuffer = buffer;
    let finalMimeType = mimeType;
    
    if (shouldProcess && mimeType.startsWith('image/')) {
      const processed = await processImage(buffer, category, mimeType);
      finalBuffer = processed.buffer;
      finalMimeType = processed.mimeType;
    }

    // Upload to GitHub CDN
    const result = await uploadFile({
      category,
      id,
      content: finalBuffer,
      mimeType: finalMimeType,
      message: `Upload ${category}: ${id} (from ${source})`,
    });

    return NextResponse.json({
      success: true,
      id,
      category,
      source,
      urls: {
        cdn: result.cdnUrl,
        github: result.githubUrl,
      },
      path: result.path,
      commitSha: result.commitSha,
      sizes: {
        original: originalSize,
        processed: finalBuffer.length,
        saved: originalSize - finalBuffer.length,
        compressionRatio: ((originalSize - finalBuffer.length) / originalSize * 100).toFixed(1) + '%',
      },
      mimeType: finalMimeType,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

// GET /api/files/upload?category=x&id=y&ext=z - Get CDN URL without uploading
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as FileCategory;
    const id = searchParams.get('id');
    const ext = searchParams.get('ext');

    if (!category || !id || !ext) {
      return NextResponse.json(
        { error: 'Missing category, id, or ext parameter' },
        { status: 400 }
      );
    }

    // Import getCdnUrl dynamically to avoid issues
    const { getCdnUrl } = await import('@/lib/services/githubCdnService');
    const cdnUrl = getCdnUrl(category, id, ext);

    return NextResponse.json({ cdnUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate URL' },
      { status: 500 }
    );
  }
}
