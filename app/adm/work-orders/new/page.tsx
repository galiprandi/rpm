"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Wrench, Plus, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const VEHICLE_CATEGORIES = [
  { value: "CAR", label: "Auto/Camioneta", icon: "🚗" },
  { value: "SUV", label: "SUV/4x4", icon: "🚙" },
  { value: "PICKUP", label: "Pickup", icon: "🛻" },
  { value: "TRUCK", label: "Camión", icon: "🚚" },
  { value: "MOTORCYCLE", label: "Moto", icon: "🏍️" },
  { value: "TRAILER", label: "Trailer/Acoplado", icon: "🚛" },
  { value: "AUDIO_EQUIPMENT", label: "Equipo de Audio", icon: "🔊" },
  { value: "ELECTRIC_SCOOTER", label: "Monopatín Eléctrico", icon: "🛴" },
  { value: "OTHER", label: "Otro Equipo", icon: "📦" },
];

const ENTRY_CHECKLIST = [
  { id: "keys", label: "Llaves/Control recibido", required: true },
  { id: "visual", label: "Estado visual general documentado", required: true },
  { id: "accessories", label: "Accesorios guardados", required: false },
  { id: "odometer", label: "Odómetro registrado", required: false },
  { id: "fuel", label: "Nivel de combustible", required: false },
];

interface Customer {
  id: string;
  fullName: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  baseCost: number;
}

interface Product {
  id: string;
  name: string;
  salePrice: number;
}

interface WorkOrderItem {
  type: "PRODUCT" | "SERVICE";
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(preselectedCustomerId ? 2 : 1);

  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Step 2: Vehicle
  const [vehicleData, setVehicleData] = useState({
    identifier: "",
    category: "CAR",
    makeName: "",
    modelName: "",
    year: "",
    color: "",
    equipmentName: "",
    equipmentType: "",
    description: "",
  });

  // Step 3: Items
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<WorkOrderItem[]>([]);

  // Step 4: Checklist & Notes
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Fetch services and products on mount
  useEffect(() => {
    const fetchData = async () => {
      const [servicesRes, productsRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/products"),
      ]);
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    };
    fetchData();
  }, []);

  // Fetch preselected customer
  useEffect(() => {
    if (preselectedCustomerId) {
      fetch(`/api/customers/${preselectedCustomerId}`)
        .then((res) => res.json())
        .then((data) => setSelectedCustomer(data));
    }
  }, [preselectedCustomerId]);

  // Search customers
  const searchCustomers = async () => {
    if (!customerSearch) return;
    const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers);
    }
  };

  const isVehicle = ["CAR", "TRUCK", "SUV", "PICKUP", "MOTORCYCLE", "TRAILER"].includes(
    vehicleData.category
  );

  const addItem = (type: "PRODUCT" | "SERVICE", item: Service | Product) => {
    const unitPrice = type === "SERVICE" ? (item as Service).baseCost : (item as Product).salePrice;
    setItems((prev) => [
      ...prev,
      {
        type,
        [type === "SERVICE" ? "serviceId" : "productId"]: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: Number(unitPrice),
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;
    setLoading(true);

    try {
      const payload = {
        customerId: selectedCustomer.id,
        vehicleData: {
          ...vehicleData,
          year: vehicleData.year ? parseInt(vehicleData.year) : undefined,
        },
        items: items.map((item) => ({
          type: item.type,
          productId: item.productId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        entryChecklist: {
          items: Object.entries(checklist).map(([id, checked]) => ({
            id,
            checked,
            label: ENTRY_CHECKLIST.find((i) => i.id === id)?.label || id,
          })),
          completedAt: new Date().toISOString(),
        },
        notes,
        scheduledDate: scheduledDate || undefined,
      };

      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create work order");

      const workOrder = await response.json();
      router.push(`/adm/work-orders/${workOrder.id}`);
    } catch (error) {
      console.error("Error creating work order:", error);
      alert("Error al crear orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-4">
        <Link href="/adm/work-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a OTs
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Nueva Orden de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="flex mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 py-2 text-center text-sm font-medium",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                    ? "bg-muted"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {s === 1 && "Cliente"}
                {s === 2 && "Vehículo"}
                {s === 3 && "Servicios/Productos"}
                {s === 4 && "Checklist & Finalizar"}
              </div>
            ))}
          </div>

          {/* Step 1: Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar cliente por nombre, teléfono o documento..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCustomers()}
                  className="flex-1"
                />
                <Button onClick={searchCustomers}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>

              {customers.length > 0 && (
                <div className="border rounded-md divide-y">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setStep(2);
                      }}
                      className="w-full p-4 text-left hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{customer.fullName}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-center">
                <Link href="/adm/customers/new">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Nuevo Cliente
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && selectedCustomer && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{selectedCustomer.fullName}</div>
                <div className="text-sm text-muted-foreground">{selectedCustomer.phone}</div>
              </div>

              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={vehicleData.category}
                  onValueChange={(value) =>
                    setVehicleData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isVehicle ? "Patente" : "Código/N° Serie"} *</Label>
                <Input
                  value={vehicleData.identifier}
                  onChange={(e) =>
                    setVehicleData((prev) => ({
                      ...prev,
                      identifier: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder={isVehicle ? "AB123CD" : "SN-12345"}
                />
              </div>

              {isVehicle ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marca</Label>
                      <Input
                        value={vehicleData.makeName}
                        onChange={(e) =>
                          setVehicleData((prev) => ({ ...prev, makeName: e.target.value }))
                        }
                        placeholder="Toyota"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input
                        value={vehicleData.modelName}
                        onChange={(e) =>
                          setVehicleData((prev) => ({ ...prev, modelName: e.target.value }))
                        }
                        placeholder="Hilux"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Año</Label>
                      <Input
                        value={vehicleData.year}
                        onChange={(e) =>
                          setVehicleData((prev) => ({ ...prev, year: e.target.value }))
                        }
                        placeholder="2024"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        value={vehicleData.color}
                        onChange={(e) =>
                          setVehicleData((prev) => ({ ...prev, color: e.target.value }))
                        }
                        placeholder="Blanco"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Nombre del Equipo *</Label>
                    <Input
                      value={vehicleData.equipmentName}
                      onChange={(e) =>
                        setVehicleData((prev) => ({ ...prev, equipmentName: e.target.value }))
                      }
                      placeholder="Parlante Sony GTK-XB90"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Equipo *</Label>
                    <Input
                      value={vehicleData.equipmentType}
                      onChange={(e) =>
                        setVehicleData((prev) => ({ ...prev, equipmentType: e.target.value }))
                      }
                      placeholder="Equipo de audio portátil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={vehicleData.description}
                      onChange={(e) =>
                        setVehicleData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Detalles adicionales del equipo..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Anterior
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!vehicleData.identifier}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Items */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Services */}
              <div className="space-y-2">
                <Label>Agregar Servicio</Label>
                <Select
                  onValueChange={(value) => {
                    const service = services.find((s) => s.id === value);
                    if (service) addItem("SERVICE", service);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${Number(service.baseCost).toLocaleString("es-AR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Products */}
              <div className="space-y-2">
                <Label>Agregar Producto</Label>
                <Select
                  onValueChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    if (product) addItem("PRODUCT", product);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${Number(product.salePrice).toLocaleString("es-AR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-3">Precio</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 border-t items-center">
                      <div className="col-span-6">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.type}</div>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(index, parseInt(e.target.value) || 1)
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 border-t bg-muted">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${calculateTotal().toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Anterior
                </Button>
                <Button onClick={() => setStep(4)}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Step 4: Checklist & Finalize */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Checklist de Ingreso</Label>
                <div className="space-y-2 border rounded-md p-4">
                  {ENTRY_CHECKLIST.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist[item.id] || false}
                        onChange={(e) =>
                          setChecklist((prev) => ({ ...prev, [item.id]: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <span className={item.required ? "font-medium" : ""}>
                        {item.label}
                        {item.required && <span className="text-destructive ml-1">*</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha Agendada (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas / Observaciones</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales de la orden de trabajo..."
                  rows={3}
                />
              </div>

              <div className="p-4 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Estimado:</span>
                  <span className="text-xl font-bold">
                    ${calculateTotal().toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Anterior
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Creando..." : "Crear Orden de Trabajo"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
