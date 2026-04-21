/**
 * API Route: /api/categories
 * Methods: GET, POST
 * Spec: /specs/inventory-sales.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { getCategories, createCategory, getCategoryByName } from '@/lib/services/categoryService';

// GET /api/categories - List categories (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (request: NextRequest, _session) => {
  try {
    const { searchParams } = request.nextUrl;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const result = await getCategories(includeInactive);

    return NextResponse.json({ categories: result.categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error fetching categories' },
      { status: 500 }
    );
  }
});

// POST /api/categories - Create category (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (request: NextRequest, _session) => {
  try {
    const body = await request.json();

    // Validations
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check unique name
    const existing = await getCategoryByName(body.name);

    if (existing) {
      return NextResponse.json(
        { error: 'A category with that name already exists' },
        { status: 409 }
      );
    }

    const category = await createCategory({
      name: body.name,
      description: body.description,
      color: body.color,
      defaultMarginPercent: body.defaultMarginPercent,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Error creating category' },
      { status: 500 }
    );
  }
});
