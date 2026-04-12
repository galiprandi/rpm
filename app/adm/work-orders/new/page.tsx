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
import { Textarea } from "@/components/ui/textarea";
import { FuelLevelSlider } from "@/components/work-orders/FuelLevelSlider";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/adm/Header";
import { WorkOrderStepper } from "@/components/ui/stepper";
import { QuickServiceDialog } from "@/components/work-orders/QuickServiceDialog";
import { useUI } from "@/components/ui/UIProvider";
import { ProductServiceSelector } from "@/components/ui/ProductServiceSelector";
import { VehicleDialog } from "@/components/vehicles/VehicleDialog";
import { Save, Plus, Trash2, Search, Car, User, CheckCircle, Edit } from "lucide-react";

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
];

interface VehicleWithCustomer {
  id: string;
  identifier: string;
  category: string;
  make?: { name: string };
  model?: { name: string };
  year?: number;
  color?: string;
  equipmentName?: string;
  equipmentType?: string;
  description?: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

interface Service {
  id: string;
  name: string;
  baseCost: number;
}

interface Product {
  id: string;
  name: string;
  replacementCost: number;
  costPrice?: number;  // Fallback when replacementCost is 0
}

// Client-side helper to calculate effective product base cost
// Uses replacementCost if > 0, otherwise falls back to costPrice
function getProductBaseCost(
  replacementCost: number | null | undefined,
  costPrice: number | null | undefined
): number {
  if (replacementCost !== null && replacementCost !== undefined && replacementCost > 0) {
    return replacementCost;
  }
  if (costPrice !== null && costPrice !== undefined) {
    return costPrice;
  }
  return 0;
}

interface WorkOrderItem {
  type: "PRODUCT" | "SERVICE";
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  priceListId?: string;      // Lista usada como base
  isManualPrice?: boolean;   // true = precio editado manualmente
  originalPrice?: number;    // Precio calculado original (para comparar)
  replacementCost?: number;  // Costo de reposición (para calcular margen)
}

export default function NewWorkOrderPage() {
  const { alert } = useUI();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdFromUrl = searchParams.get("vehicleId");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1: Search by license plate
  const [plateSearch, setPlateSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<VehicleWithCustomer | null>(null);
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedCustomerForNewVehicle, setSelectedCustomerForNewVehicle] = useState<string | null>(null);

  // Step 1b: Create new vehicle (if not found)
  const [newVehicleData, setNewVehicleData] = useState({
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
  const [newCustomerSearch, setNewCustomerSearch] = useState("");
  const [foundCustomers, setFoundCustomers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Step 2: Items
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [selectedPriceList, setSelectedPriceList] = useState<string>("");
  const [priceLists, setPriceLists] = useState<Array<{ id: string; name: string; baseMarginPercentage: number }>>([]);
  const [minimumMargin, setMinimumMargin] = useState<number>(15); // Default 15%
  const [showQuickServiceDialog, setShowQuickServiceDialog] = useState(false);

  // Step 3: Checklist & Notes
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [odometerValue, setOdometerValue] = useState<string>("");
  const [fuelLevel, setFuelLevel] = useState<number>(50);
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Fetch price lists and settings on mount
  useEffect(() => {
    const fetchData = async () => {
      const [priceListsRes, settingsRes] = await Promise.all([
        fetch("/api/price-lists"),
        fetch("/api/settings"),
      ]);
      if (priceListsRes.ok) {
        const data = await priceListsRes.json();
        const lists = data.priceLists || [];
        setPriceLists(lists);
        // Auto-select first active price list if available
        const firstActive = lists.find((pl: { isActive: boolean }) => pl.isActive);
        if (firstActive) {
          setSelectedPriceList(firstActive.id);
        }
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const minMargin = data.settings?.find((s: { key: string }) => s.key === "MINIMUM_MARGIN_PERCENTAGE")?.value;
        if (minMargin) {
          setMinimumMargin(parseFloat(minMargin));
        }
      }
    };
    fetchData();
  }, []);

  // Auto-fetch vehicle if vehicleId is in URL
  useEffect(() => {
    const fetchVehicleById = async () => {
      if (!vehicleIdFromUrl) return;
      setSearching(true);
      try {
        const res = await fetch(`/api/vehicles/${vehicleIdFromUrl}`);
        if (res.ok) {
          const vehicle = await res.json();
          if (vehicle && vehicle.id) {
            setFoundVehicle(vehicle);
            setPlateSearch(vehicle.identifier);
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle by ID:", error);
      } finally {
        setSearching(false);
      }
    };
    fetchVehicleById();
  }, [vehicleIdFromUrl]);

  // Search vehicle by identifier
  const searchVehicle = async () => {
    if (!plateSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/vehicles/by-identifier/${encodeURIComponent(plateSearch)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.vehicles && data.vehicles.length > 0) {
          setFoundVehicle(data.vehicles[0]);
          setShowCreateVehicle(false);
        } else {
          setFoundVehicle(null);
          setShowCreateVehicle(true);
          setNewVehicleData(prev => ({ ...prev, identifier: plateSearch.toUpperCase() }));
          // Pre-select customer if we already have one from previous search
          if (selectedCustomerId) {
            setSelectedCustomerForNewVehicle(selectedCustomerId);
          }
        }
      }
    } catch (error) {
      console.error("Error searching vehicle:", error);
    } finally {
      setSearching(false);
    }
  };

  // Search customers for new vehicle
  const searchCustomersForNewVehicle = async () => {
    if (!newCustomerSearch.trim()) return;
    const res = await fetch(`/api/customers?search=${encodeURIComponent(newCustomerSearch)}`);
    if (res.ok) {
      const data = await res.json();
      setFoundCustomers(data.customers || []);
    }
  };

  // Create new customer inline
  const createCustomerInline = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) return;
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerData),
      });
      if (res.ok) {
        const customer = await res.json();
        setSelectedCustomerId(customer.id);
        setCreatingCustomer(false);
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const isMotorVehicle = (category: string) =>
    ["CAR", "TRUCK", "SUV", "PICKUP", "MOTORCYCLE", "TRAILER"].includes(category);

  const addItem = async (type: "PRODUCT" | "SERVICE", item: Service | Product) => {
    let unitPrice: number;
    let priceListId: string | undefined;

    if (type === "SERVICE") {
      unitPrice = (item as Service).baseCost;
    } else {
      // Calculate price from selected price list
      const product = item as Product;
      if (selectedPriceList) {
        try {
          const res = await fetch(`/api/price-lists/${selectedPriceList}/calculate-price?productId=${product.id}`);
          if (res.ok) {
            const data = await res.json();
            unitPrice = data.finalPrice;
            priceListId = selectedPriceList;
          } else {
            // Fallback to base cost with default margin if calculation fails
            const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
            unitPrice = baseCost * 1.4; // 40% default margin
          }
        } catch {
          const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
          unitPrice = baseCost * 1.4; // 40% default margin
        }
      } else {
        const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
        unitPrice = baseCost * 1.4; // 40% default margin
      }
    }

    setItems((prev) => [
      ...prev,
      {
        type,
        [type === "SERVICE" ? "serviceId" : "productId"]: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: Number(unitPrice),
        priceListId,
        isManualPrice: false,
        originalPrice: Number(unitPrice),
        replacementCost: type === "PRODUCT" 
          ? getProductBaseCost((item as Product).replacementCost, (item as Product).costPrice) 
          : undefined,
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

  const updateItemPrice = (index: number, newPrice: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, unitPrice: Math.max(0, newPrice), isManualPrice: true }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  // Calculate margin percentage for a product item
  const calculateMargin = (item: WorkOrderItem): number | null => {
    if (item.type !== "PRODUCT" || !item.replacementCost || item.replacementCost === 0) {
      return null;
    }
    return ((item.unitPrice - item.replacementCost) / item.replacementCost) * 100;
  };

  // Check if item is below minimum margin
  const isBelowMinimumMargin = (item: WorkOrderItem): boolean => {
    const margin = calculateMargin(item);
    if (margin === null) return false;
    return margin < minimumMargin;
  };

  const handleSubmit = async () => {
    if (!foundVehicle && !selectedCustomerId) return;
    setLoading(true);

    try {
      const customerId = foundVehicle?.customer.id || selectedCustomerId;

      if (!customerId) {
        throw new Error("Missing customer");
      }

      // Build payload with vehicleData for atomic creation
      const payload: Record<string, unknown> = {
        customerId,
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
        odometerValue: odometerValue ? parseInt(odometerValue) : undefined,
        fuelLevel: fuelLevel > 0 ? fuelLevel : undefined,
        notes,
        scheduledDate: scheduledDate || undefined,
        source: "IN_PERSON",
      };

      // Include vehicleData for new vehicles (atomic creation)
      if (!foundVehicle && selectedCustomerId) {
        payload.vehicleData = {
          ...newVehicleData,
          year: newVehicleData.year ? parseInt(newVehicleData.year) : undefined,
        };
      } else if (foundVehicle) {
        // Use existing vehicle ID
        payload.vehicleId = foundVehicle.id;
      }

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
      await alert({
        title: 'Error',
        description: 'Error al crear orden de trabajo. Por favor intente nuevamente.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setFoundVehicle(null);
    setShowCreateVehicle(false);
    setPlateSearch("");
    setSelectedCustomerId(null);
    setFoundCustomers([]);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <Header
        title="Nueva Orden de Trabajo"
        description="Crear una nueva orden de trabajo para un vehículo"
        showBackButton
        onBack={() => router.push("/adm/work-orders")}
      />

      <WorkOrderStepper currentStep={step} className="mb-8" />

      <div className="space-y-6">
          {/* Step 1: Search Vehicle by License Plate */}
          {step === 1 && (
            <div className="space-y-6">
              {!foundVehicle && !showCreateVehicle && (
                <>
                  <div className="text-center space-y-2">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium">Buscar vehículo por patente</h3>
                    <p className="text-sm text-muted-foreground">
                      Ingrese la patente para buscar el vehículo y su dueño
                    </p>
                  </div>

                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      placeholder="Ej: ABC123 o AB123CD"
                      value={plateSearch}
                      onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && searchVehicle()}
                      className="flex-1 text-center text-lg uppercase"
                    />
                    <Button onClick={searchVehicle} disabled={searching || !plateSearch.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      {searching ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>
                </>
              )}

              {/* Vehicle Found Card */}
              {foundVehicle && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-6 bg-green-50/50">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{foundVehicle.identifier}</h3>
                          <Badge variant="outline">{foundVehicle.category}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {foundVehicle.make?.name} {foundVehicle.model?.name} {foundVehicle.year && `(${foundVehicle.year})`}
                        </p>
                        
                        <div className="mt-4 p-3 bg-white rounded border">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4" />
                            Dueño: {foundVehicle.customer.name}
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">
                            {foundVehicle.customer.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => setStep(2)} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar y Continuar
                      </Button>
                      <Button variant="outline" onClick={resetSearch}>
                        <Edit className="h-4 w-4 mr-2" />
                        Buscar Otro
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Create New Vehicle - Use Modal */}
              {showCreateVehicle && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      No se encontró vehículo con patente <strong>{plateSearch}</strong>
                    </p>
                    <p className="text-sm">Haga clic para crear el vehículo y la orden</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetSearch} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        // Pre-fill the identifier and open modal
                        setNewVehicleData(prev => ({ ...prev, identifier: plateSearch.toUpperCase() }));
                        setIsVehicleModalOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Vehículo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Items */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {foundVehicle?.identifier || newVehicleData.identifier}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {foundVehicle?.customer.name || newCustomerData.name}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Cambiar
                </Button>
              </div>

              {/* Product and Service Selector */}
              <ProductServiceSelector
                showPriceListSelector
                showCategoryFilter
                showQuickCreate
                showSelectedTable={false}
                searchEndpoint="/api/products-services/search"
                categories={[]}
                priceLists={priceLists}
                defaultPriceListId={selectedPriceList}
                initialItems={items.map(item => ({
                  id: item.productId || item.serviceId || '',
                  type: item.type === 'PRODUCT' ? 'product' : 'service',
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  originalPrice: item.originalPrice || item.unitPrice,
                  isManualPrice: item.isManualPrice || false,
                  priceListId: item.priceListId,
                }))}
                onSelectionChange={(selectedItems) => {
                  // Convert component items to WorkOrderItem format
                  const workOrderItems: WorkOrderItem[] = selectedItems.map(item => ({
                    type: item.type === 'product' ? 'PRODUCT' : 'SERVICE',
                    ...(item.type === 'product'
                      ? { productId: item.id }
                      : { serviceId: item.id }
                    ),
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    priceListId: item.priceListId,
                    isManualPrice: item.isManualPrice,
                    originalPrice: item.originalPrice,
                    replacementCost: item.type === 'product' ? item.originalPrice : undefined,
                  }));
                  setItems(workOrderItems);
                }}
                onQuickCreate={() => setShowQuickServiceDialog(true)}
              />

              {items.length > 0 && (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-3">Precio Unit.</div>
                    <div className="col-span-1">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item, index) => {
                    const margin = calculateMargin(item);
                    const belowMin = isBelowMinimumMargin(item);
                    return (
                      <div key={index} className={`grid grid-cols-12 gap-2 p-3 border-t items-center ${belowMin ? 'bg-red-50/50' : ''}`}>
                        <div className="col-span-5">
                          <div className="font-medium flex items-center gap-2 flex-wrap">
                            {item.name}
                            {item.isManualPrice && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Manual
                              </Badge>
                            )}
                            {belowMin && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Margen Bajo
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.type}
                            {margin !== null && (
                              <span className={`ml-2 ${belowMin ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                (Margen: {margin.toFixed(1)}%)
                              </span>
                            )}
                          </div>
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
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItemPrice(index, parseFloat(e.target.value) || 0)
                            }
                            className={`h-8 ${item.isManualPrice ? 'border-yellow-400 bg-yellow-50/30' : ''} ${belowMin ? 'border-red-400' : ''}`}
                          />
                        </div>
                        <div className="col-span-1 text-sm">
                          ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-3 border-t bg-muted">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${calculateTotal().toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Anterior
                </Button>
                <Button onClick={() => setStep(3)} disabled={items.length === 0}>
                  Siguiente
                </Button>
              </div>

              {/* Quick Service Dialog */}
              <QuickServiceDialog
                isOpen={showQuickServiceDialog}
                onClose={() => setShowQuickServiceDialog(false)}
                onServiceCreated={(service) => {
                  addItem("SERVICE", service);
                  setShowQuickServiceDialog(false);
                }}
              />
            </div>
          )}

          {/* Step 3: Checklist & Finalize */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {foundVehicle?.identifier || newVehicleData.identifier}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {foundVehicle?.customer.name || newCustomerData.name} • {items.length} items
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Cambiar
                </Button>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Odómetro (km)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 45320"
                    value={odometerValue}
                    onChange={(e) => setOdometerValue(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <FuelLevelSlider
                    value={fuelLevel}
                    onChange={setFuelLevel}
                    label={`Nivel de Combustible: ${fuelLevel}%`}
                  />
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
                <Button variant="outline" onClick={() => setStep(2)}>
                  Anterior
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Creando..." : "Crear Orden de Trabajo"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Dialog Modal */}
        <VehicleDialog
          open={isVehicleModalOpen}
          onOpenChange={(open) => {
            setIsVehicleModalOpen(open);
            if (!open) setSelectedCustomerForNewVehicle(null);
          }}
          customerId={selectedCustomerForNewVehicle || undefined}
          preselectedIdentifier={plateSearch || undefined}
          onSuccess={(vehicle) => {
            setFoundVehicle(vehicle as VehicleWithCustomer);
            setShowCreateVehicle(false);
          }}
        />
      </div>
    </div>
  );
}
