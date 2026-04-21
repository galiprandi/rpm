/**
 * API Route: /api/products/[id]/image
 * Métodos: POST, DELETE, GET
 * Spec: /specs/spec-product-images.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promisify } from 'util';
import { exec } from 'child_process';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

const execAsync = promisify(exec);

interface Params {
  params: Promise<{ id: string }>;
}

// Helper function to validate environment variables
function validateEnv() {
  const required = [
    'PRODUCT_IMAGES_REPO',
    'PRODUCT_IMAGES_TOKEN',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const config = {
    repo: process.env.PRODUCT_IMAGES_REPO!,
    token: process.env.PRODUCT_IMAGES_TOKEN!,
    maxWidth: parseInt(process.env.PRODUCT_IMAGE_MAX_WIDTH || '500', 10),
    maxHeight: parseInt(process.env.PRODUCT_IMAGE_MAX_HEIGHT || '500', 10),
    quality: parseInt(process.env.PRODUCT_IMAGE_QUALITY || '85', 10),
    format: process.env.PRODUCT_IMAGE_FORMAT || 'jpeg',
    branch: process.env.PRODUCT_IMAGES_BRANCH || 'main',
  };

  return config;
}

// Helper function to build jsDelivr URL
function buildJsDelivrUrl(owner: string, repo: string, branch: string, productId: string, format: string) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/products/${productId}.${format}`;
}

// Helper function to upload image to GitHub using curl (only method that works in Next.js)
async function uploadToGitHub(
  file: Buffer,
  productId: string,
  config: ReturnType<typeof validateEnv>,
  branch?: string
): Promise<{ imageUrl: string; commitSha: string }> {
  const [owner, repo] = config.repo.split('/');
  const path = `products/${productId}.${config.format}`;
  const message = `Upload product image: ${productId}`;
  const targetBranch = branch || config.branch;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const content = file.toString('base64');

  // Check if file exists using curl GET
  let sha: string | undefined;
  try {
    const checkCmd = `curl -s -w "\\nHTTP_CODE:%{http_code}" \
      "${url}" \
      -H "Authorization: Bearer ${config.token}" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "User-Agent: RPM-Image-Upload/1.0"`;

    const { stdout: checkStdout, stderr: checkStderr } = await execAsync(checkCmd);
    if (checkStderr) {
      console.error('Curl check stderr:', checkStderr);
    }

    const httpCodeMatch = checkStdout.match(/HTTP_CODE:(\d+)$/);
    const httpCode = httpCodeMatch ? parseInt(httpCodeMatch[1], 10) : 0;
    const responseBody = checkStdout.replace(/\nHTTP_CODE:\d+$/, '');

    if (httpCode === 200) {
      const fileData = JSON.parse(responseBody);
      sha = fileData.sha;
    } else if (httpCode === 404) {
      // File does not exist, will create new
    } else {
      console.error('Unexpected status checking file:', httpCode, responseBody.substring(0, 200));
    }
  } catch (e) {
    console.error('Error checking file existence:', e);
  }

  // Build request body
  const body: Record<string, string> = {
    message,
    content,
    branch: targetBranch,
  };
  if (sha) {
    body.sha = sha;
  }

  // Use curl for PUT request (only reliable method in Next.js)
  const curlCmd = `curl -s -X PUT "${url}" \
    -H "Authorization: Bearer ${config.token}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: RPM-Image-Upload/1.0" \
    -d '${JSON.stringify(body).replace(/'/g, "'\"'\"'")}'`;

  const { stdout, stderr } = await execAsync(curlCmd);

  if (stderr) {
    console.error('Curl stderr:', stderr);
  }

  if (!stdout) {
    throw new Error('Curl request failed: no output');
  }

  const result = JSON.parse(stdout);

  // Handle GitHub API errors
  if (result.message || result.status === '404') {
    console.error('GitHub API error:', result);
    throw new Error(`GitHub API: ${result.message || 'Repository or path not found. Check token permissions.'}`);
  }

  // Handle both response structures (create vs update)
  const commitSha = result.commit?.sha || result.content?.sha;

  if (!commitSha) {
    console.error('Unexpected response structure:', Object.keys(result));
    throw new Error('GitHub API response missing commit SHA');
  }

  const imageUrl = buildJsDelivrUrl(owner, repo, targetBranch, productId, config.format);

  return {
    imageUrl,
    commitSha,
  };
}

// Helper function to delete image from GitHub using curl
async function deleteFromGitHub(
  productId: string,
  config: ReturnType<typeof validateEnv>,
  branch: string
): Promise<{ deletedCommit: string }> {
  const [owner, repo] = config.repo.split('/');
  const path = `products/${productId}.${config.format}`;
  const message = `Delete product image: ${productId}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Get current file SHA using curl (specify branch)
  const getCmd = `curl -s "${url}?ref=${branch}" \
    -H "Authorization: Bearer ${config.token}" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: RPM-Image-Upload/1.0"`;

  const { stdout: getStdout, stderr: getStderr } = await execAsync(getCmd);

  if (getStderr) {
    console.error('Curl get stderr:', getStderr);
  }

  if (!getStdout) {
    throw new Error('File not found in GitHub');
  }

  let existing;
  try {
    existing = JSON.parse(getStdout);
  } catch {
    console.error('Failed to parse GET response:', getStdout);
    throw new Error('File not found in GitHub');
  }

  const sha = existing.sha;
  console.log('File SHA from GitHub (branch:', branch + '):', sha);

  const body = {
    message,
    sha,
    branch,
  };

  // Delete using curl
  const deleteCmd = `curl -s -X DELETE "${url}" \
    -H "Authorization: Bearer ${config.token}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: RPM-Image-Upload/1.0" \
    -d '${JSON.stringify(body).replace(/'/g, "'\"'\"'")}'`;

  const { stdout: deleteStdout, stderr } = await execAsync(deleteCmd);

  if (stderr) {
    console.error('Curl delete stderr:', stderr);
  }

  if (!deleteStdout) {
    throw new Error('Delete request failed: no output');
  }

  const result = JSON.parse(deleteStdout);

  // Handle GitHub API errors
  if (result.message) {
    console.error('GitHub API delete error:', result);
    throw new Error(`GitHub API: ${result.message}`);
  }

  // Handle both response structures
  const deletedCommit = result.commit?.sha;

  if (!deletedCommit) {
    console.error('GitHub delete unexpected response:', Object.keys(result));
    throw new Error('GitHub API: Missing commit SHA in delete response');
  }

  return { deletedCommit };
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

    // Resize and compress image with Sharp (optional)
    let processedBuffer = buffer;
    try {
      // Dynamic import to avoid webpack resolution issues
      const sharp = (await import('sharp')).default;
      const sharpBuffer = await sharp(buffer)
        .resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: config.quality })
        .toBuffer();

      processedBuffer = Buffer.from(sharpBuffer);
    } catch (error) {
      console.error('Error processing image with Sharp:', error);
      // Fallback to original buffer if Sharp fails
      processedBuffer = buffer;
    }

    // Upload to GitHub
    const { imageUrl, commitSha } = await uploadToGitHub(processedBuffer, id, config, config.branch);
    console.log('Image uploaded to GitHub:', { imageUrl, commitSha });

    // Update product in database
    await prisma.product.update({
      where: { id },
      data: {
        imageUrl,
        imageCommit: commitSha,
        imageBranch: config.branch,
      },
    });
    console.log('Product updated in database:', { id, imageUrl, imageCommit: commitSha });

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
      select: { imageUrl: true, imageCommit: true, imageBranch: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    if (!product.imageUrl || !product.imageCommit || !product.imageBranch) {
      return NextResponse.json(
        { error: 'Producto no tiene imagen' },
        { status: 400 }
      );
    }

    // Delete from GitHub (use the branch from database)
    const { deletedCommit } = await deleteFromGitHub(id, config, product.imageBranch);

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
