'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/components/ui/UIProvider';
import { CrudAdmin, StatItem } from '@/components/adm';
import { Wrench, Edit2, Trash2, Clock, List } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/price-display';
import { type ColumnDef } from '@tanstack/react-table';
import { ServiceDialog } from '@/components/services/ServiceDialog';

interface Service {
  id: string;
  name: string;
  description: string | null;
  baseCost: number;
  timeMinutes: number;
  vehicleFactor: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  baseCost: string;
  timeMinutes: string;
  vehicleFactor: string;
}

export default function ServicesPage() {
  const { alert, confirm } = useUI();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    baseCost: '',
    timeMinutes: '60',
    vehicleFactor: '1.0',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      baseCost: '',
      timeMinutes: '60',
      vehicleFactor: '1.0',
    });
    setEditingService(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      baseCost: service.baseCost.toString(),
      timeMinutes: service.timeMinutes.toString(),
      vehicleFactor: service.vehicleFactor.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate before submitting
    const missingFields: string[] = [];
    if (!formData.name.trim()) missingFields.push('Nombre');
    if (!formData.baseCost.trim()) missingFields.push('Costo base');
    if (!formData.timeMinutes.trim()) missingFields.push('Tiempo estimado');

    if (missingFields.length > 0) {
      await alert({
        title: 'Error',
        description: `Campos obligatorios faltantes: ${missingFields.join(', ')}`,
        variant: 'error',
      });
      return;
    }

    const payload = {
      ...formData,
      baseCost: parseFloat(formData.baseCost) || 0,
      timeMinutes: parseInt(formData.timeMinutes) || 60,
      vehicleFactor: parseFloat(formData.vehicleFactor) || 1.0,
    };

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchServices();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al guardar servicio',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving service:', error);
      await alert({
        title: 'Error',
        description: 'Error al guardar servicio',
        variant: 'error',
      });
    }
  };

  // Validation: CTA disabled until required fields are filled
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.baseCost.trim() !== '' &&
      formData.timeMinutes.trim() !== ''
    );
  };

  const formValid = isFormValid();

  const handleDelete = useCallback(async (service: Service) => {
    const confirmed = await confirm({
      title: 'Desactivar Servicio',
      description: `¿Estás seguro de desactivar "${service.name}"?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchServices();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al desactivar servicio',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      await alert({
        title: 'Error',
        description: 'Error al desactivar servicio',
        variant: 'error',
      });
    }
  }, [alert, confirm]);

  const activeServices = services.filter((s) => s.isActive).length;
  const totalServices = services.length;
  const avgTime = services.length > 0
    ? Math.round(services.reduce((acc, s) => acc + s.timeMinutes, 0) / services.length)
    : 0;

  const stats: StatItem[] = [
    {
      label: 'Total',
      value: totalServices,
      icon: List,
    },
    {
      label: 'Activos',
      value: activeServices,
      icon: Wrench,
    },
    {
      label: 'Tiempo promedio',
      value: `${avgTime} min`,
      icon: Clock,
    },
  ];

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Servicio',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'baseCost',
        header: 'Costo Base',
        cell: ({ row }) => (
          <span className="font-medium">
            <PriceDisplay value={row.original.baseCost} />
          </span>
        ),
      },
      {
        accessorKey: 'timeMinutes',
        header: 'Tiempo',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {row.original.timeMinutes} min
          </div>
        ),
      },
      {
        accessorKey: 'vehicleFactor',
        header: 'Factor Vehículo',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.vehicleFactor}x
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="default">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          ),
      },
    ],
    [handleDelete]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <>
      <CrudAdmin
        title="Servicios"
        description="Gestiona el catálogo de servicios del taller"
        items={services}
        loading={loading}
        onCreate={openCreateDialog}
        columns={columns}
        stats={stats}
        emptyIcon={<Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay servicios creados. Haz clic en 'Nuevo Servicio' para crear el primero."
        createButtonText="Nuevo Servicio"
        tableTitle="Listado de Servicios"
        searchPlaceholder="Buscar por nombre..."
        rowActions={(service) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(service)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleDelete(service)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ServiceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingService={editingService}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isValid={formValid}
      />
    </>
  );
}
