/**
 * API Route: /api/suppliers
 * Métodos: GET, POST
 * Spec: /specs/suppliers.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { getSuppliers, createSupplier, getSupplierByName } from '@/lib/services/supplierService';

// GET /api/suppliers - Listar proveedores
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const result = await getSuppliers(includeInactive);

    return NextResponse.json({ suppliers: result.suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Crear proveedor
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validaciones
    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es requerido' },
        { status: 400 }
      );
    }

    // Verificar nombre único
    const existing = await getSupplierByName(body.name);

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 409 }
      );
    }

    const supplier = await createSupplier({
      name: body.name,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address,
      notes: body.notes,
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}
