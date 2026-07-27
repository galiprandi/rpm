import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { hasPermission } from "@/lib/permissions/check";
import PermissionsClient from "./PermissionsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PermissionsPage() {
  const session = await getSession();

  if (!hasPermission(session, "can_manage_settings")) {
    redirect("/adm");
  }

  return <PermissionsClient />;
}
