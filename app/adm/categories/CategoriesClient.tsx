"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/components/ui/UIProvider";
import { toast } from "sonner";
import { CategoryDialog } from "@/components/categories/CategoryDialog";
import { type CategoryFormData } from "@/components/categories/CategoryForm";
import { Header, CrudAdmin, CrudStats, type StatItem } from "@/components/adm";
import {
  Folder,
  Pencil,
  Trash2,
  Package,
  Layers,
  Plus,
  CheckCircle2,
  Power,
  ArrowLeft,
  EyeOff,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Category {
  id: string;
  name: string;
  description: string | null;
  defaultMarginPercent: number;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

interface CategoriesClientProps {
  initialCategories: Category[];
  inactiveMode?: boolean;
}

export default function CategoriesClient({
  initialCategories,
  inactiveMode = false,
}: CategoriesClientProps) {
  const { alert } = useUI();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    defaultMarginPercent: 40,
    color: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    defaultMarginPercent: 40,
    color: "",
  });

  const fetchCategories = async () => {
    try {
      const includeInactive = inactiveMode ? "true" : "false";
      const response = await fetch(
        `/api/categories?includeInactive=${includeInactive}`,
      );
      const data = await response.json();
      if (data.categories) {
        setCategories(
          inactiveMode
            ? data.categories.filter((c: Category) => !c.isActive)
            : data.categories,
        );
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!createForm.name.trim() || saving) return;

    setSaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setCreateForm({
          name: "",
          description: "",
          defaultMarginPercent: 40,
          color: "",
        });
        setIsCreateDialogOpen(false);
        fetchCategories();
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al crear categoría",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error creating category:", error);
      await alert({
        title: "Error",
        description: "Error al crear categoría",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
        toast.success(`Categoría "${category.name}" desactivada`, {
          action: {
            label: "Deshacer",
            onClick: async () => {
              try {
                await fetch(`/api/categories/${category.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isActive: true }),
                });
                fetchCategories();
                toast.success("Categoría reactivada");
              } catch {
                toast.error("Error al reactivar categoría");
              }
            },
          },
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleReactivateCategory = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (response.ok) {
        fetchCategories();
        toast.success(`Categoría "${category.name}" reactivada`);
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al reactivar categoría",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error reactivating category:", error);
      await alert({
        title: "Error",
        description: "Error al reactivar categoría",
        variant: "error",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description || "",
      defaultMarginPercent: category.defaultMarginPercent,
      color: category.color || "",
    });
    setIsDialogOpen(true);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingCategory || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        const error = await response.json();
        await alert({
          title: "Error",
          description: error.error || "Error al actualizar categoría",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      await alert({
        title: "Error",
        description: "Error al actualizar categoría",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const stats: StatItem[] = inactiveMode
    ? [
        {
          label: "Inactivas",
          value: categories.length,
          icon: EyeOff,
        },
        {
          label: "Productos",
          value: categories.reduce((acc, c) => acc + c.productCount, 0),
          icon: Package,
        },
      ]
    : [
        {
          label: "Total",
          value: categories.length,
          icon: Layers,
        },
        {
          label: "Activas",
          value: categories.filter((c) => c.isActive).length,
          icon: CheckCircle2,
          iconColor: "#047857", // emerald-700
        },
        {
          label: "Productos",
          value: categories.reduce((acc, c) => acc + c.productCount, 0),
          icon: Package,
        },
      ];

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg shadow-sm border border-primary/20 flex items-center justify-center shrink-0"
              style={{
                backgroundColor: row.original.color || "var(--primary)",
              }}
            >
              <Folder
                className="h-4 w-4 text-white drop-shadow-sm pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <span className="font-semibold tracking-tight">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm line-clamp-1">
            {row.original.description || "-"}
          </span>
        ),
      },
      {
        accessorKey: "productCount",
        header: "Productos",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.productCount}</span>
        ),
      },
      {
        accessorKey: "defaultMarginPercent",
        header: "Margen",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono">
            {row.original.defaultMarginPercent}%
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Header
        title={inactiveMode ? "Categorías Inactivas" : "Categorías"}
        description={
          inactiveMode
            ? "Categorías desactivadas del catálogo"
            : "Gestiona las categorías de productos"
        }
        primaryAction={
          inactiveMode
            ? undefined
            : {
                label: "Nueva Categoría",
                onClick: () => setIsCreateDialogOpen(true),
                icon: Plus,
                ariaLabel: "Crear nueva categoría",
              }
        }
        secondaryActions={
          inactiveMode
            ? [
                {
                  label: "Volver a categorías",
                  href: "/adm/categories",
                  variant: "outline" as const,
                  icon: ArrowLeft,
                  ariaLabel: "Volver al listado de categorías",
                },
              ]
            : [
                {
                  label: "Ver inactivos",
                  href: "/adm/categories/inactive",
                  variant: "ghost" as const,
                  icon: EyeOff,
                  iconOnly: true,
                  title: "Ver categorías inactivas",
                  ariaLabel: "Ver categorías inactivas",
                },
              ]
        }
      />

      <div className="mt-4">
        <CrudStats stats={stats} />
      </div>

      <CrudAdmin
        items={categories}
        loading={loading}
        onCreate={() => setIsCreateDialogOpen(true)}
        hideCreateAction
        columns={columns}
        emptyIcon={
          <Package
            className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4"
            aria-hidden="true"
          />
        }
        emptyMessage={
          inactiveMode
            ? "No hay categorías inactivas."
            : "No hay categorías creadas. Haz clic en 'Nueva Categoría' para crear la primera."
        }
        createButtonText="Categoría"
        tableTitle={
          inactiveMode ? "Categorías Inactivas" : "Listado de Categorías"
        }
        searchPlaceholder="Buscar categorías..."
        rowActions={(category) => (
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                  aria-label="Editar categoría"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar categoría</TooltipContent>
            </Tooltip>

            {category.isActive ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteCategory(category)}
                    disabled={category.productCount > 0}
                    aria-label={`Desactivar categoría ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {category.productCount > 0
                    ? "No se puede desactivar una categoría con productos"
                    : "Desactivar categoría"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                    onClick={() => handleReactivateCategory(category)}
                    aria-label={`Reactivar categoría ${category.name}`}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reactivar categoría</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      />

      {/* Edit Category Dialog */}
      <CategoryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingCategory={editingCategory}
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleEditSubmit}
        isLoading={saving}
      />

      {/* Create Category Dialog - only in active mode */}
      {!inactiveMode && (
        <CategoryDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          editingCategory={null}
          formData={createForm}
          setFormData={setCreateForm}
          onSubmit={(e) => {
            e?.preventDefault();
            handleCreateCategory();
          }}
          isLoading={saving}
        />
      )}
    </div>
  );
}
