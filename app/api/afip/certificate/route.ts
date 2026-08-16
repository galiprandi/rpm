import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import {
  storeCertificate,
  removeCertificate,
  getCertHealth,
} from "@/lib/services/certService";

export const dynamic = "force-dynamic";

/**
 * GET /api/afip/certificate
 * Returns the certificate health state (never exposes the content).
 * The health state drives the UI display and the factory's mock/real selection.
 */
export const GET = withPermission(
  "can_manage_settings",
  async (_request: NextRequest) => {
    try {
      const health = await getCertHealth();

      return NextResponse.json({
        state: health.state,
        uploadedAt: health.uploadedAt,
        expiresAt: health.expiresAt,
        detail: health.detail,
      });
    } catch (error) {
      console.error("Error fetching cert health:", error);
      return NextResponse.json(
        { error: "Error al obtener el estado del certificado" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/afip/certificate
 * Uploads a .p12 certificate file with its password.
 * Expects FormData with fields: file (Blob), password (string).
 * Extracts and stores the certificate expiry date for health checks.
 */
export const POST = withPermission(
  "can_manage_settings",
  async (request: NextRequest) => {
    try {
      const health = await getCertHealth();

      if (health.state === "no-master-key") {
        return NextResponse.json(
          {
            error:
              "AFIP_CERT_MASTER_KEY no configurada. Contacte al administrador para setear la variable de entorno antes de subir el certificado.",
          },
          { status: 500 },
        );
      }

      const formData = await request.formData();
      const file = formData.get("file");
      const password = formData.get("password");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "Se requiere un archivo .p12" },
          { status: 400 },
        );
      }

      if (!password || typeof password !== "string") {
        return NextResponse.json(
          { error: "Se requiere el password del certificado" },
          { status: 400 },
        );
      }

      // Validate file size (max 100KB for a .p12)
      if (file.size > 100 * 1024) {
        return NextResponse.json(
          { error: "El archivo excede el tamaño máximo de 100KB" },
          { status: 400 },
        );
      }

      const p12Buffer = Buffer.from(await file.arrayBuffer());

      const { uploadedAt, expiresAt } = await storeCertificate(
        p12Buffer,
        password,
      );

      return NextResponse.json({
        success: true,
        uploadedAt,
        expiresAt,
      });
    } catch (error) {
      console.error("Error uploading certificate:", error);
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      return NextResponse.json(
        { error: message },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/afip/certificate
 * Removes the stored certificate and password from the database.
 * System will degrade to mock mode after deletion.
 */
export const DELETE = withPermission(
  "can_manage_settings",
  async (_request: NextRequest) => {
    try {
      await removeCertificate();
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error removing certificate:", error);
      return NextResponse.json(
        { error: "Error al eliminar el certificado" },
        { status: 500 },
      );
    }
  },
);
