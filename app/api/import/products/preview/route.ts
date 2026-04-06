import { NextRequest, NextResponse } from "next/server";

// POST /api/import/products/preview - Preview product import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Products array is required" },
        { status: 400 }
      );
    }

    // Process preview (simplified version)
    const preview = {
      total: products.length,
      valid: products.length,
      invalid: 0,
      duplicates: 0,
      items: products.map((product, index) => ({
        row: index + 1,
        name: product.name || 'Unknown',
        sku: product.sku || `SKU-${index + 1}`,
        status: 'valid',
        issues: []
      }))
    };

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Error previewing import:", error);
    return NextResponse.json(
      { error: "Failed to preview import" },
      { status: 500 }
    );
  }
}

// GET /api/import/products/preview - Get import status
export async function GET() {
  try {
    return NextResponse.json({
      status: "ready",
      message: "Product import preview endpoint is available"
    });
  } catch (error) {
    console.error("Error getting import status:", error);
    return NextResponse.json(
      { error: "Failed to get import status" },
      { status: 500 }
    );
  }
}
