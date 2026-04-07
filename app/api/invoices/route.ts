import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasRole, UserRole } from '@/lib/auth/roles';
import { getInvoices, createInvoice, getNextInvoiceNumber } from '@/lib/services/invoiceService';

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const invoices = await getInvoices({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type: type || undefined,
      status: status || undefined,
      customerId: customerId || undefined,
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await hasRole(session.user.id, UserRole.ADMIN);
    if (!userRole) {
      return NextResponse.json(
        { error: "Only ADMIN can create invoices" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      referenceId,
      referenceType,
      customerId,
      customerName,
      subtotal,
      tax,
      total,
      afipData,
      status,
    } = body;

    if (!type || !referenceId || !referenceType || !customerName || !subtotal || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const number = await getNextInvoiceNumber(type);

    const invoice = await createInvoice({
      number,
      type,
      referenceId,
      referenceType,
      customerId,
      customerName,
      subtotal,
      tax,
      total,
      afipData,
      status: status || 'DRAFT',
      createdBy: session.user.id,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
