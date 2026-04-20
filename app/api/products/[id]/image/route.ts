/**
 * API Route: /api/products/[id]/image
 * Métodos: POST, DELETE, GET
 * Spec: /specs/spec-product-images.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface Params {
  params: Promise<{ id: string }>;
}

// Helper function to validate environment variables
function validateEnv() {
  const required = [
    'PRODUCT_IMAGES_REPO',
    'GITHUB_TOKEN',
    'PRODUCT_IMAGE_MAX_WIDTH',
    'PRODUCT_IMAGE_MAX_HEIGHT',
    'PRODUCT_IMAGE_QUALITY',
    'PRODUCT_IMAGE_FORMAT',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    repo: process.env.PRODUCT_IMAGES_REPO!,
    token: process.env.GITHUB_TOKEN!,
    maxWidth: parseInt(process.env.PRODUCT_IMAGE_MAX_WIDTH!, 10),
    maxHeight: parseInt(process.env.PRODUCT_IMAGE_MAX_HEIGHT!, 10),
    quality: parseInt(process.env.PRODUCT_IMAGE_QUALITY!, 10),
    format: process.env.PRODUCT_IMAGE_FORMAT!,
    branch: process.env.PRODUCT_IMAGES_BRANCH || 'main',
  };
}

// Helper function to build jsDelivr URL
function buildJsDelivrUrl(owner: string, repo: string, branch: string, productId: string, format: string) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/products/${productId}.${format}`;
}

// Helper function to upload image to GitHub
async function uploadToGitHub(
  file: Buffer,
  productId: string,
  config: ReturnType<typeof validateEnv>
): Promise<{ imageUrl: string; commitSha: string }> {
  const [owner, repo] = config.repo.split('/');
  const path = `products/${productId}.${config.format}`;
  const message = `Upload product image: ${productId}`;

  // GitHub API: Create or update file
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const content = file.toString('base64');

  // First, check if file exists to get its SHA
  let sha: string | undefined;
  try {
    const existingResponse = await fetch(url, {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      sha = existing.sha;
    }
  } catch {
    // File doesn't exist, that's okay
  }

  const body = {
    message,
    content,
    branch: config.branch,
    ...(sha && { sha }),
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub API error: ${error.message}`);
  }

  const result = await response.json();
  const imageUrl = buildJsDelivrUrl(owner, repo, config.branch, productId, config.format);

  return {
    imageUrl,
    commitSha: result.commit.sha,
  };
}

// Helper function to delete image from GitHub
async function deleteFromGitHub(
  productId: string,
  config: ReturnType<typeof validateEnv>
): Promise<{ deletedCommit: string }> {
  const [owner, repo] = config.repo.split('/');
  const path = `products/${productId}.${config.format}`;
  const message = `Delete product image: ${productId}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get current file SHA
  const existingResponse = await fetch(url, {
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!existingResponse.ok) {
    throw new Error('File not found in GitHub');
  }

  const existing = await existingResponse.json();
  const sha = existing.sha;

  const body = {
    message,
    sha,
    branch: config.branch,
  };

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub API error: ${error.message}`);
  }

  const result = await response.json();
  return { deletedCommit: result.commit.sha };
}

// POST /api/products/[id]/image - Upload image
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Validate environment variables
    const config = validateEnv();

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'UNSUPPORTED_FORMAT',
          message: 'Formato no soportado. Use JPEG, PNG o WebP.',
          supportedFormats: ['jpeg', 'png', 'webp']
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // TODO: Add image resizing with Sharp here
    // For now, upload as-is (will add Sharp in next step)

    // Upload to GitHub
    const { imageUrl, commitSha } = await uploadToGitHub(buffer, id, config);

    // Update product in database
    await prisma.product.update({
      where: { id },
      data: {
        imageUrl,
        imageCommit: commitSha,
        imageBranch: config.branch,
      },
    });

    // Revalidate cache
    revalidatePath('/adm/products');
    revalidatePath('/adm/dashboard');

    return NextResponse.json({
      imageUrl,
      imageCommit: commitSha,
      width: config.maxWidth,
      height: config.maxHeight,
      size: buffer.length,
      format: config.format,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir imagen' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/image - Delete image
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Validate environment variables
    const config = validateEnv();

    // Get product to check if it has an image
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, imageCommit: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    if (!product.imageUrl || !product.imageCommit) {
      return NextResponse.json(
        { error: 'Producto no tiene imagen' },
        { status: 400 }
      );
    }

    // Delete from GitHub
    const { deletedCommit } = await deleteFromGitHub(id, config);

    // Update product in database
    await prisma.product.update({
      where: { id },
      data: {
        imageUrl: null,
        imageCommit: null,
        imageBranch: null,
      },
    });

    // Revalidate cache
    revalidatePath('/adm/products');
    revalidatePath('/adm/dashboard');

    return NextResponse.json({
      success: true,
      deletedCommit,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar imagen' },
      { status: 500 }
    );
  }
}

// GET /api/products/[id]/image - Get image with fallback
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Get product
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // If product has image, redirect to jsDelivr
    if (product.imageUrl) {
      return NextResponse.redirect(product.imageUrl, 307);
    }

    // Fallback: Generate SVG placeholder
    const svg = `
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="500" fill="#e5e7eb"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">
          Sin imagen
        </text>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error getting image:', error);
    return NextResponse.json(
      { error: 'Error al obtener imagen' },
      { status: 500 }
    );
  }
}
