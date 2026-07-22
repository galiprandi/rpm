import MaintenanceClient from "./MaintenanceClient";
import { requireAuth } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const session = await requireAuth();
  const userRole =
    ((session.user as { role?: string }).role as UserRole) || UserRole.USER;

  if (userRole !== UserRole.ADMIN) {
    throw new Error("Acceso denegado");
  }

  return <MaintenanceClient />;
}
