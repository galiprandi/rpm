import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
  getCustomers,
  createCustomer,
  type CreateCustomerInput,
} from "@/lib/services/customerService";

// GET /api/customers - List customers with optional search (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (request: NextRequest, _session) => {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getCustomers({
      search: search || undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
});

// POST /api/customers - Create customer (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (request: NextRequest, _session) => {
  try {
    const body = await request.json();
    const input: CreateCustomerInput = {
      name: body.name,
      phone: body.phone,
      phoneAlt: body.phoneAlt,
      email: body.email,
      address: body.address,
      notes: body.notes,
      billingData: body.billingData,
    };

    const customer = await createCustomer(input);

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create customer";
    return NextResponse.json(
      { error: errorMessage },
      {
        status:
          errorMessage.includes("Missing") || errorMessage.includes("Invalid")
            ? 400
            : 500,
      },
    );
  }
});
