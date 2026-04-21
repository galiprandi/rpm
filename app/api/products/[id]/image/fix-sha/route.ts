import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/products/[id]/image/fix-sha - Fix image SHA from GitHub
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Get current product
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

    if (!product.imageUrl) {
      return NextResponse.json(
        { error: 'Producto no tiene imagen' },
        { status: 400 }
      );
    }

    // Fetch current file SHA from GitHub
    const [owner, repo] = process.env.PRODUCT_IMAGES_REPO!.split('/');
    const path = `products/${id}.jpeg`;
    const branch = product.imageBranch || 'main';

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.PRODUCT_IMAGES_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error fetching file from GitHub', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    const currentSha = data.sha;

    // Update product if SHA is different
    if (currentSha !== product.imageCommit) {
      await prisma.product.update({
        where: { id },
        data: {
          imageCommit: currentSha,
        },
      });

      return NextResponse.json({
        success: true,
        oldSha: product.imageCommit,
        newSha: currentSha,
        message: 'SHA actualizado correctamente',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SHA ya está actualizado',
      currentSha,
    });
  } catch (error) {
    console.error('Error fixing SHA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al corregir SHA' },
      { status: 500 }
    );
  }
}
