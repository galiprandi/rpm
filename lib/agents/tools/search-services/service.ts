import { db } from "@/lib/db";
import { service } from "@/db/schema";
import { eq, and, or, ilike, asc } from "drizzle-orm";

export interface ServiceWithDetails {
  id: string;
  name: string;
  description: string | null;
  baseCost: number;
  timeMinutes: number;
}

export async function searchServicesService(
  search: string,
  limit: number = 10,
): Promise<ServiceWithDetails[]> {
  const services = await db.query.service.findMany({
    where: and(
      eq(service.isActive, true),
      or(
        ilike(service.name, `%${search}%`),
        ilike(service.description, `%${search}%`),
      ),
    ),
    orderBy: asc(service.name),
    limit,
  });

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    baseCost: Number(s.baseCost),
    timeMinutes: s.timeMinutes,
  }));
}
