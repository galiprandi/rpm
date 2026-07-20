"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Trash2,
  X,
  ShoppingCart,
  User,
  CreditCard,
  Phone,
  Mail,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatARS } from "@/lib/utils/format";
import {
  ProductServiceSelector,
  type SelectedItem,
} from "@/components/ui/ProductServiceSelector";
import { Stepper } from "@/components/ui/stepper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useCallback } from "react";

interface CartItem extends SelectedItem {
  totalPrice: number;
}

interface Payment {
  paymentMethodId: string;
  amount: number;
}

interface PriceList {
  id: string;
  name: string;
  baseMarginPercentage: number;
}

interface Category {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
}

interface QuickSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUICK_SALE_STEPS = [
  { value: 1, label: "Productos", icon: ShoppingCart },
  { value: 2, label: "Cliente", icon: User },
  { value: 3, label: "Pago", icon: CreditCard },
];

export function QuickSaleModal({
  open,
  onOpenChange,
  onSuccess,
}: QuickSaleModalProps) {
  const [step, setStep] = useState<"search" | "customer" | "payment">("search");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("Consumidor final");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [foundCustomers, setFoundCustomers] = useState<
    Array<{ id: string; name: string; phone: string; balance?: number }>
  >([]);
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [sellOnCredit, setSellOnCredit] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = total - totalPaid;
  const newBalanceIfCredit = customerBalance + remaining;

  const currentStepNumber = useMemo(() => {
    switch (step) {
      case "search":
        return 1;
      case "customer":
        return 2;
      case "payment":
        return 3;
      default:
        return 1;
    }
  }, [step]);

  // Fetch payment methods, price lists and categories on mount
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [paymentMethodsRes, priceListsRes, categoriesRes] =
          await Promise.all([
            fetch("/api/payment-methods"),
            fetch("/api/price-lists"),
            fetch("/api/categories"),
          ]);

        if (paymentMethodsRes.ok) {
          const data = await paymentMethodsRes.json();
          const methods = Array.isArray(data)
            ? data
            : data.paymentMethods || [];
          setPaymentMethods(methods);
          if (methods.length > 0) {
            setPaymentMethodId(methods[0].id);
          }
        }

        if (priceListsRes.ok) {
          const data = await priceListsRes.json();
          setPriceLists(data.priceLists || []);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }
      };
      fetchData();
    }
  }, [open]);

  // Handle selection changes from ProductServiceSelector - memoized to prevent loops
  const handleSelectionChange = useCallback((items: SelectedItem[]) => {
    console.log("[QuickSaleModal] Received items from selector:", items.length);
    // Calculate totalPrice for each item
    const cartItems: CartItem[] = items.map((item) => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity,
    }));
    setCart(cartItems);
  }, []);

  // Memoize props for ProductServiceSelector to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, [categories]);
  const memoizedPriceLists = useMemo(() => priceLists, [priceLists]);

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    const res = await fetch(
      `/api/customers?search=${encodeURIComponent(customerSearch)}`,
    );
    if (res.ok) {
      const data = await res.json();
      setFoundCustomers(data.customers || []);
    }
  };

  const createCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) return;
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerData),
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomerId(customer.id);
        setCustomerName(customer.name);
        setCreatingCustomer(false);
        setNewCustomerData({ name: "", phone: "", email: "" });
        setFoundCustomers([]);
        setCustomerSearch("");
      }
    } catch (err) {
      console.error("Error creating customer:", err);
    }
  };

  const addPayment = () => {
    if (!paymentMethodId || paymentAmount <= 0) return;
    const newPayments = [
      ...payments,
      { paymentMethodId, amount: paymentAmount },
    ];
    setPayments(newPayments);
    const newTotalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const newRemaining = total - newTotalPaid;
    // Auto-fill with remaining after adding a payment
    if (newRemaining > 0) {
      setPaymentAmount(newRemaining);
    }
  };

  // Auto-fill payment amount with remaining when payment method changes
  useEffect(() => {
    if (paymentMethodId && remaining > 0) {
      setPaymentAmount(remaining);
    }
  }, [paymentMethodId, remaining]);

  // Auto-fill payment amount when entering payment step
  useEffect(() => {
    if (step === "payment" && remaining > 0) {
      setPaymentAmount(remaining);
    }
  }, [step, remaining]);

  const removePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
    const newTotalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const newRemaining = total - newTotalPaid;
    // Auto-fill with remaining after removing a payment
    if (newRemaining > 0) {
      setPaymentAmount(newRemaining);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    // For cash sales (not credit), require full payment
    if (!sellOnCredit && totalPaid < total) {
      setError(
        'El monto pagado es insuficiente. Active "Venta a cuenta corriente" si desea dejar saldo pendiente.',
      );
      return;
    }

    // For credit sales, require customer selection
    if (sellOnCredit && !customerId) {
      setError("Debe seleccionar un cliente para venta a cuenta corriente");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/direct-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || null,
          customerName: customerName,
          items: cart.map((item) => ({
            productId: item.type === "product" ? item.id : null,
            serviceId: item.type === "service" ? item.id : null,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          payments: payments,
          sellOnCredit,
          remainingAmount: sellOnCredit ? remaining : 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la venta");
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCart([]);
      setCustomerId("");
      setCustomerName("Consumidor final");
      setCustomerBalance(0);
      setPayments([]);
      setPaymentAmount(0);
      setSellOnCredit(false);
      setStep("search");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Venta Rápida</DialogTitle>
        </DialogHeader>

        <div className="py-4 border-b mb-4">
          <Stepper
            currentStep={currentStepNumber}
            steps={QUICK_SALE_STEPS}
            onStepClick={(s) => {
              if (s === 1) setStep("search");
              if (s === 2 && cart.length > 0) setStep("customer");
              if (s === 3 && cart.length > 0) setStep("payment");
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Step 1: Search and Add Items */}
        {step === "search" && (
          <div className="space-y-4">
            {/* ProductServiceSelector - Search and Cart */}
            <ProductServiceSelector
              showPriceListSelector={true}
              showCategoryFilter={true}
              showQuickCreate={false}
              onSelectionChange={handleSelectionChange}
              categories={memoizedCategories}
              priceLists={memoizedPriceLists}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setStep("customer")}
                disabled={cart.length === 0 || loading}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Customer */}
        {step === "customer" && (
          <div className="space-y-4">
            {/* Customer Search/Create */}
            <div>
              <Label htmlFor="customer-search-input">Cliente (opcional)</Label>
              {!customerId && !creatingCustomer && (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="customer-search-input"
                        placeholder="Buscar cliente por nombre o teléfono..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && searchCustomers()
                        }
                        className={cn("pr-10")}
                      />
                      {customerSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerSearch("");
                            setFoundCustomers([]);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Limpiar búsqueda"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={searchCustomers}
                          size="icon"
                          aria-label="Buscar cliente"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Buscar cliente</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setCreatingCustomer(true)}
                          aria-label="Nuevo cliente"
                        >
                          Nuevo
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Crear nuevo cliente</TooltipContent>
                    </Tooltip>
                  </div>

                  {foundCustomers.length > 0 && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {foundCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setCustomerId(customer.id);
                            setCustomerName(customer.name);
                            setCustomerBalance(customer.balance || 0);
                            setFoundCustomers([]);
                            setCustomerSearch("");
                          }}
                          className="w-full p-3 text-left hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.phone}
                          </div>
                          {customer.balance && customer.balance > 0 && (
                            <div className="text-xs text-red-700 mt-1">
                              Saldo pendiente: {formatARS(customer.balance)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {creatingCustomer && (
                <div className="space-y-3 mt-2 border p-4 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="cust-name" required>
                      Nombre
                    </Label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                        aria-hidden="true"
                      />
                      <Input
                        id="cust-name"
                        value={newCustomerData.name}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nombre del cliente"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cust-phone" required>
                      Teléfono
                    </Label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                        aria-hidden="true"
                      />
                      <Input
                        id="cust-phone"
                        value={newCustomerData.phone}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Teléfono"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cust-email">Email</Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                        aria-hidden="true"
                      />
                      <Input
                        id="cust-email"
                        value={newCustomerData.email}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="Email (opcional)"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createCustomer} className="flex-1">
                      Crear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreatingCustomer(false);
                        setNewCustomerData({ name: "", phone: "", email: "" });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {customerId && (
                <div className="mt-2 flex items-center justify-between p-3 border rounded-md bg-muted">
                  <div>
                    <div className="font-medium">{customerName}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomerId("");
                      setCustomerName("Consumidor final");
                    }}
                    aria-label="Cambiar cliente"
                  >
                    Cambiar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("search")}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button onClick={() => setStep("payment")} disabled={loading}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && (
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-slate-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">{formatARS(total)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Pagado</span>
                <span className="text-lg font-semibold">
                  {formatARS(totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Restante</span>
                <span
                  className={`text-lg font-semibold ${remaining > 0 ? "text-red-700" : "text-emerald-700"}`}
                >
                  {formatARS(remaining)}
                </span>
              </div>

              {/* Customer Balance Info */}
              {customerId && customerBalance > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Saldo actual cliente:
                    </span>
                    <span className="text-red-700 font-medium">
                      {formatARS(customerBalance)}
                    </span>
                  </div>
                  {sellOnCredit && remaining > 0 && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">
                        Nuevo saldo sería:
                      </span>
                      <span className="text-red-700 font-bold">
                        {formatARS(newBalanceIfCredit)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Credit Sale Option */}
            {customerId && remaining > 0 && (
              <div className="p-3 border rounded-md bg-amber-50 border-amber-200">
                <Checkbox
                  id="sellOnCredit"
                  checked={sellOnCredit}
                  onCheckedChange={(checked) => setSellOnCredit(!!checked)}
                  label="Venta a cuenta corriente (dejar saldo pendiente)"
                  labelClassName="text-amber-900 font-medium"
                  className="border-amber-300"
                />
              </div>
            )}

            {/* Add Payment Form */}
            <div className="space-y-3 p-4 border rounded-md bg-slate-50/50">
              <span className="text-sm font-semibold text-muted-foreground block">
                Agregar pago
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5 space-y-1.5">
                  <Label htmlFor="payment-method-select" className="text-xs">
                    Medio de pago
                  </Label>
                  <Select
                    value={paymentMethodId}
                    onValueChange={setPaymentMethodId}
                  >
                    <SelectTrigger
                      id="payment-method-select"
                      className="w-full bg-background"
                      aria-label="Seleccionar medio de pago"
                    >
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                  <Label htmlFor="payment-amount" className="text-xs">
                    Monto a pagar
                  </Label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                      aria-hidden="true"
                    />
                    <Input
                      id="payment-amount"
                      type="number"
                      placeholder="0"
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          paymentMethodId &&
                          paymentAmount > 0
                        ) {
                          e.preventDefault();
                          addPayment();
                        }
                      }}
                      className="pl-9 bg-background"
                    />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <Button
                    onClick={addPayment}
                    disabled={!paymentMethodId || paymentAmount <= 0}
                    className="w-full"
                    aria-label="Registrar pago ingresado"
                  >
                    Registrar pago
                  </Button>
                </div>
              </div>
            </div>

            {/* Payments List */}
            {payments.length > 0 && (
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted font-medium">Pagos</div>
                <div className="divide-y">
                  {payments.map((payment, index) => {
                    const method = paymentMethods.find(
                      (m) => m.id === payment.paymentMethodId,
                    );
                    return (
                      <div
                        key={index}
                        className="p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">
                            {method?.name || "Desconocido"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {formatARS(payment.amount)}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePayment(index)}
                                disabled={loading}
                                aria-label="Eliminar pago"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar pago</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("customer")}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={
                  loading ||
                  (!sellOnCredit &&
                    (payments.length === 0 || totalPaid < total))
                }
                className={
                  sellOnCredit ? "bg-amber-600 hover:bg-amber-700" : ""
                }
              >
                {sellOnCredit
                  ? "Confirmar Venta a Cuenta Corriente"
                  : "Confirmar Venta"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
