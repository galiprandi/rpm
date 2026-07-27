"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Header } from "@/components/adm/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  PERMISSION_CATALOG,
  CONFIGURABLE_ROLES,
  type ConfigurableRole,
} from "@/lib/permissions/catalog";

/** State shape: role -> list of enabled permission IDs */
type PermissionsState = Record<ConfigurableRole, string[]>;

const EMPTY_STATE: PermissionsState = {
  STAFF: [],
  VENDEDOR: [],
};

export default function PermissionsClient() {
  const [state, setState] = useState<PermissionsState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current permissions on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/permissions");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled) {
          setState({
            STAFF: data.STAFF ?? [],
            VENDEDOR: data.VENDEDOR ?? [],
          });
        }
      } catch {
        if (!cancelled) toast.error("No se pudieron cargar los permisos");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Toggle a permission for a role */
  const togglePermission = useCallback(
    (role: ConfigurableRole, permId: string, enabled: boolean) => {
      setState((prev) => {
        const current = prev[role] ?? [];
        const next = enabled
          ? current.includes(permId)
            ? current
            : [...current, permId]
          : current.filter((p) => p !== permId);
        return { ...prev, [role]: next };
      });
    },
    [],
  );

  /** Save all permissions to the API */
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      toast.success("Permisos actualizados correctamente");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudieron guardar los permisos",
      );
    } finally {
      setIsSaving(false);
    }
  }, [state, isSaving]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header
          title="Permisos por Rol"
          description="Configura los permisos de cada rol"
          showBackButton
        />
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
            <CardTitle className="text-lg">Matriz de Permisos</CardTitle>
            <CardDescription>Cargando permisos…</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header
        title="Permisos por Rol"
        description="Configura los permisos de cada rol"
        showBackButton
      />

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
          <CardTitle className="text-lg">Matriz de Permisos</CardTitle>
          <CardDescription>
            Activa o desactiva los permisos para cada rol. El administrador
            siempre tiene acceso completo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Re-login banner */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-6">
            <p className="text-sm text-amber-800">
              Los cambios requieren que los usuarios afectados vuelvan a iniciar
              sesión.
            </p>
          </div>

          {/* Column headers for roles */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Permiso
            </span>
            <div className="flex gap-6">
              {CONFIGURABLE_ROLES.map((role) => (
                <span
                  key={role.id}
                  className="text-xs font-medium text-muted-foreground w-11 text-center"
                >
                  {role.label}
                </span>
              ))}
            </div>
          </div>

          {/* Permission categories */}
          {PERMISSION_CATALOG.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <section key={category.category} className="mb-6">
                <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold">
                  <CategoryIcon
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {category.category}
                </h3>
                <div className="rounded-lg border divide-y">
                  {category.permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="pr-4">
                        <p className="font-medium text-sm">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      </div>
                      <div className="flex gap-6 shrink-0">
                        {CONFIGURABLE_ROLES.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-center w-11"
                          >
                            <Switch
                              checked={state[role.id]?.includes(perm.id)}
                              onCheckedChange={(checked) =>
                                togglePermission(role.id, perm.id, checked)
                              }
                              aria-label={`${perm.label} — ${role.label}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
