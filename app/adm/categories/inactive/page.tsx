import CategoriesClient from "../CategoriesClient";
import { getCategories } from "@/lib/services/categoryService";
import { requireAuth } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function InactiveCategoriesPage() {
  const session = await requireAuth();
  const userRole =
    ((session.user as { role?: string }).role as UserRole) || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error("Acceso denegado");
  }

  const data = await getCategories(true);
  const inactiveCategories = data.categories.filter((c) => !c.isActive);

  return <CategoriesClient initialCategories={inactiveCategories} inactiveMode />;
}
