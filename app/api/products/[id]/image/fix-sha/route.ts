import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/products/[id]/image/fix-sha - Fix image SHA from GitHub
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Get current product
    const productRecord = await db
      .select({ imageUrl: product.imageUrl, imageCommit: product.imageCommit, imageBranch: product.imageBranch })
      .from(product)
      .where(eq(product.id, id))
      .limit(1);

    if (!productRecord.length) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    if (!productRecord[0].imageUrl) {
      return NextResponse.json(
        { error: 'Producto no tiene imagen' },
        { status: 400 }
      );
    }

    // Fetch current file SHA from GitHub
    const [owner, repo] = process.env.PRODUCT_IMAGES_REPO!.split('/');
    const path = `products/${id}.jpeg`;
    const branch = productRecord[0].imageBranch || 'main';

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
    if (currentSha !== productRecord[0].imageCommit) {
      await db
        .update(product)
        .set({
          imageCommit: currentSha,
        })
        .where(eq(product.id, id));

      return NextResponse.json({
        success: true,
        oldSha: productRecord[0].imageCommit,
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
