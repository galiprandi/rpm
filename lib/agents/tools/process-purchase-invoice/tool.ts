import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createDraftVoucher,
  addItemToVoucher,
} from "@/lib/services/purchaseVoucherService";
import { Decimal } from "@prisma/client/runtime/library";
import { extractDocumentData } from "@/lib/agents/utils/extract-document";

const invoiceSchema = z.object({
  supplierName: z
    .string()
    .describe("Nombre del proveedor/emisor de la factura"),
  supplierCuit: z
    .string()
    .nullable()
    .describe("CUIT del proveedor si está visible"),
  invoiceType: z
    .enum(["A", "B", "C"])
    .describe("Tipo de factura (letra A, B o C)"),
  invoiceNumber: z
    .string()
    .describe("Número de factura (punto de venta + número, ej: 0001-12345678)"),
  invoiceDate: z
    .string()
    .describe("Fecha de la factura en formato ISO (YYYY-MM-DD)"),
  totalAmount: z.number().describe("Monto total de la factura"),
  items: z
    .array(
      z.object({
        productName: z.string().describe("Nombre/descripción del producto"),
        quantity: z.number().describe("Cantidad del producto"),
        unitCost: z.number().describe("Precio unitario de costo del producto"),
      }),
    )
    .describe("Lista de items/productos de la factura"),
  paymentMethod: z
    .string()
    .nullable()
    .describe(
      "Método de pago si está visible (ej: efectivo, transferencia, tarjeta)",
    ),
});

export const processPurchaseInvoiceTool = tool({
  description:
    "Procesa una imagen o PDF de una factura de compra del proveedor. Extrae automáticamente proveedor, tipo, número, fecha, total e items usando vision AI. Busca el proveedor en la base de datos, hace match de productos y crea un borrador del comprobante para revisión. Requiere la URL del archivo subido por el usuario.",
  inputSchema: z.object({
    fileUrl: z
      .string()
      .describe("URL de la imagen o PDF de la factura (data URL o URL pública)"),
    createdBy: z
      .string()
      .describe("ID del usuario que está creando el comprobante"),
  }),
  execute: async ({ fileUrl, createdBy }) => {
    try {
      const extractionPrompt = `Extraé todos los datos de esta factura de compra del proveedor.
Identificá con precisión:
- Proveedor: nombre completo y CUIT si está visible
- Tipo de factura: letra A, B o C
- Número de factura: punto de venta y número completo
- Fecha: en formato ISO (YYYY-MM-DD)
- Monto total: número sin símbolos
- Método de pago: si está visible (efectivo, transferencia, tarjeta, etc.)
- Items: cada producto con nombre/descripción, cantidad y precio unitario de costo

Si un campo no está visible o no se puede leer, dejalo como null.
Para los items, extraé TODOS los que veas en la factura.`;

      const extracted = await extractDocumentData(
        fileUrl,
        extractionPrompt,
        invoiceSchema,
      );

      // Search for supplier by name (fuzzy match)
      const supplier = await prisma.supplier.findFirst({
        where: {
          name: { contains: extracted.supplierName, mode: "insensitive" },
          isActive: true,
        },
      });

      if (!supplier) {
        const allSuppliers = await prisma.supplier.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        return `No se encontró un proveedor con el nombre "${extracted.supplierName}".\n\nProveedores disponibles:\n${allSuppliers.map((s) => `- ${s.name}`).join("\n")}\n\nDecile al usuario cuál es el proveedor correcto y volvé a intentarlo.`;
      }

      // Resolve payment method if provided
      let paymentMethodId: string | null = null;
      if (extracted.paymentMethod) {
        const pm = await prisma.payment_method.findFirst({
          where: {
            name: { contains: extracted.paymentMethod, mode: "insensitive" },
            isActive: true,
          },
        });
        if (pm) paymentMethodId = pm.id;
      }

      // Create draft voucher
      const voucher = await createDraftVoucher({
        supplierId: supplier.id,
        letter: extracted.invoiceType,
        number: extracted.invoiceNumber,
        date: new Date(extracted.invoiceDate),
        totalAmount: new Decimal(extracted.totalAmount),
        paymentMethodId,
        createdBy,
      });

      // Add items - try to match each product by name
      const itemsResults: string[] = [];
      for (const item of extracted.items) {
        // Try to find product by name (fuzzy)
        const product = await prisma.product.findFirst({
          where: {
            name: { contains: item.productName, mode: "insensitive" },
            isActive: true,
          },
          select: { id: true, name: true },
        });

        if (product) {
          await addItemToVoucher({
            voucherId: voucher.id,
            productId: product.id,
            quantity: item.quantity,
            unitCost: new Decimal(item.unitCost),
          });
          itemsResults.push(
            `✅ ${item.productName} → match: "${product.name}" (x${item.quantity} @ $${item.unitCost})`,
          );
        } else {
          itemsResults.push(
            `⚠️ ${item.productName} (x${item.quantity} @ $${item.unitCost}) — NO se encontró el producto. El usuario debe agregarlo manualmente.`,
          );
        }
      }

      // Build summary for user
      const summary = `📋 **Borrador de comprobante creado** (ID: ${voucher.id.slice(0, 8)})

**Proveedor:** ${supplier.name}
**Factura:** ${extracted.invoiceType} ${extracted.invoiceNumber}
**Fecha:** ${extracted.invoiceDate}
**Total:** $${extracted.totalAmount.toLocaleString("es-AR")}
**Pago:** ${extracted.paymentMethod || "No especificado"}

**Items:**
${itemsResults.map((r) => `- ${r}`).join("\n")}

${itemsResults.some((r) => r.startsWith("⚠️")) ? "⚠️ Algunos productos no se encontraron. El usuario debe revisar y agregarlos manualmente.\n" : ""}El borrador está listo para revisión. El usuario puede finalizarlo desde la sección "Carga de Comprobantes" o pedite que lo finalice.`;

      return summary;
    } catch (error) {
      console.error("❌ Error processing purchase invoice:", error);
      return `Error al procesar la factura: ${error instanceof Error ? error.message : "Error desconocido"}. Verificá que la imagen/PDF sea legible y volvé a intentarlo.`;
    }
  },
});
