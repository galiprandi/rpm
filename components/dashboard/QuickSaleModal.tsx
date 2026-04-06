'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { formatARS } from '@/lib/utils/format';

function getProductBaseCost(replacementCost: unknown, costPrice: unknown): number {
  const replacement = replacementCost !== null && replacementCost !== undefined
    ? Number(replacementCost)
    : 0;
  
  if (replacement > 0) {
    return replacement;
  }
  
  return costPrice !== null && costPrice !== undefined
    ? Number(costPrice)
    : 0;
}

interface CartItem {
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'product' | 'service';
}

interface Payment {
  paymentMethodId: string;
  amount: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
  barcode?: string;
  type: 'product';
  replacementCost: number;
  costPrice: number;
}

interface Service {
  id: string;
  name: string;
  baseCost: number;
  type: 'service';
  price: number;
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

export function QuickSaleModal({ open, onOpenChange, onSuccess }: QuickSaleModalProps) {
  const [step, setStep] = useState<'search' | 'customer' | 'payment' | 'confirm'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchResults, setSearchResults] = useState<(Product | Service)[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Consumidor final');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [priceLists, setPriceLists] = useState<Array<{ id: string; name: string; baseMarginPercentage: number }>>([]);
  const [selectedPriceList, setSelectedPriceList] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomers, setFoundCustomers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = total - totalPaid;

  // Fetch payment methods on mount
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const [paymentMethodsRes, priceListsRes] = await Promise.all([
          fetch('/api/payment-methods'),
          fetch('/api/price-lists'),
        ]);
        
        if (paymentMethodsRes.ok) {
          const data = await paymentMethodsRes.json();
          const methods = Array.isArray(data) ? data : (data.paymentMethods || []);
          setPaymentMethods(methods);
          if (methods.length > 0) {
            setPaymentMethodId(methods[0].id);
          }
        }

        if (priceListsRes.ok) {
          const data = await priceListsRes.json();
          const lists = data.priceLists || [];
          setPriceLists(lists);
          const firstActive = lists.find((pl: { isActive: boolean }) => pl.isActive);
          if (firstActive) {
            setSelectedPriceList(firstActive.id);
          }
        }
      };
      fetchData();
    }
  }, [open, total]);

  // Update search results prices when price list changes
  useEffect(() => {
    if (searchResults.length > 0 && selectedPriceList && !isUpdatingPrices) {
      setIsUpdatingPrices(true);
      const updatePrices = async () => {
        const productIds = searchResults
          .filter((item) => item.type === 'product')
          .map((item) => item.id);

        if (productIds.length === 0) {
          setIsUpdatingPrices(false);
          return;
        }

        try {
          const res = await fetch(`/api/price-lists/${selectedPriceList}/calculate-prices-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds }),
          });

          if (res.ok) {
            const priceMap = await res.json();
            const updatedResults = searchResults.map((item) => {
              if (item.type === 'product') {
                const priceData = priceMap[item.id];
                if (priceData) {
                  return { ...item, price: priceData.price };
                }
              }
              return item;
            });
            setSearchResults(updatedResults);
          }
        } catch {
          // Keep current prices if batch calculation fails
        } finally {
          setIsUpdatingPrices(false);
        }
      };
      updatePrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPriceList]);

  // Search products and services
  const searchProductsAndServices = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const productResponse = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
      const productData = await productResponse.json();
      
      const serviceResponse = await fetch(`/api/services?search=${encodeURIComponent(searchQuery)}`);
      const serviceData = await serviceResponse.json();

      const products = (productData?.products || []).map((p: unknown) => {
        const product = p as { replacementCost: string | number; costPrice: string | number };
        const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
        const price = baseCost * 1.4;
        return {
          ...(p as Product),
          type: 'product' as const,
          price,
        };
      });
      const services = (serviceData?.services || []).map((s: unknown) => ({ ...(s as Service), type: 'service' as const, price: Number((s as Service).baseCost) }));

      setSearchResults([...products, ...services]);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  const addToCart = async (item: Product | Service) => {
    let unitPrice: number;

    if (item.type === 'service') {
      unitPrice = item.price;
    } else {
      const product = item as Product;
      if (selectedPriceList) {
        try {
          const res = await fetch(`/api/price-lists/${selectedPriceList}/calculate-price?productId=${product.id}`);
          if (res.ok) {
            const data = await res.json();
            unitPrice = data.finalPrice;
          } else {
            const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
            unitPrice = baseCost * 1.4;
          }
        } catch {
          const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
          unitPrice = baseCost * 1.4;
        }
      } else {
        const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
        unitPrice = baseCost * 1.4;
      }
    }

    const existingIndex = cart.findIndex(c => 
      (item.type === 'product' && c.productId === item.id) ||
      (item.type === 'service' && c.serviceId === item.id)
    );

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      updatedCart[existingIndex].totalPrice = updatedCart[existingIndex].quantity * updatedCart[existingIndex].unitPrice;
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        productId: item.type === 'product' ? item.id : undefined,
        serviceId: item.type === 'service' ? item.id : undefined,
        name: item.name,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        type: item.type,
      };
      setCart([...cart, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
    if (res.ok) {
      const data = await res.json();
      setFoundCustomers(data.customers || []);
    }
  };

  const createCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData),
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomerId(customer.id);
        setCustomerName(customer.name);
        setCreatingCustomer(false);
        setNewCustomerData({ name: '', phone: '', email: '' });
        setFoundCustomers([]);
        setCustomerSearch('');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
    }
  };

  const addPayment = () => {
    if (!paymentMethodId || paymentAmount <= 0) return;
    const newPayments = [...payments, { paymentMethodId, amount: paymentAmount }];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethodId]);

  // Auto-fill payment amount when entering payment step
  useEffect(() => {
    if (step === 'payment' && remaining > 0) {
      setPaymentAmount(remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    const updatedCart = [...cart];
    const newQuantity = updatedCart[index].quantity + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    // Check stock for products
    if (updatedCart[index].type === 'product' && delta > 0) {
      const product = searchResults.find(r => r.id === updatedCart[index].productId) as Product;
      if (product && newQuantity > product.stock) {
        setError(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }
    }

    updatedCart[index].quantity = newQuantity;
    updatedCart[index].totalPrice = updatedCart[index].unitPrice * newQuantity;
    setCart(updatedCart);
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (payments.length === 0) {
      setError('Debe agregar al menos un pago');
      return;
    }
    if (totalPaid < total) {
      setError('El monto pagado es insuficiente');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/direct-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          customerName: customerName,
          items: cart.map((item) => ({
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          payments: payments,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear la venta');
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCart([]);
      setCustomerId('');
      setCustomerName('Consumidor final');
      setPayments([]);
      setPaymentAmount(0);
      setStep('search');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Venta Rápida</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Step 1: Search and Add Items */}
        {step === 'search' && (
          <div className="space-y-4">
            {/* Price List Selector */}
            {priceLists.length > 0 && (
              <div>
                <Label>Lista de Precios</Label>
                <Select value={selectedPriceList} onValueChange={setSelectedPriceList}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecciona una lista de precios" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceLists.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name} (Margen: {pl.baseMarginPercentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Buscar productos o servicios</Label>
              <div className="relative mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre, SKU o código de barras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchProductsAndServices()}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <Button onClick={searchProductsAndServices} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-100 border-b last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.type === 'product' && `Stock: ${(item as Product).stock}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatARS(item.price)}</div>
                      <Plus className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cart */}
            {cart.length > 0 && (
              <div className="border rounded-md p-4">
                <h3 className="font-semibold mb-3">Carrito</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatARS(item.unitPrice)} x {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(index, -1)}
                          disabled={loading}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(index, 1)}
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromCart(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="w-24 text-right font-semibold">
                        {formatARS(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">{formatARS(total)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={() => setStep('customer')}
                disabled={cart.length === 0 || loading}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Customer */}
        {step === 'customer' && (
          <div className="space-y-4">
            {/* Customer Search/Create */}
            <div>
              <Label>Cliente (opcional)</Label>
              {!customerId && !creatingCustomer && (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar cliente por nombre o teléfono..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
                      className="flex-1"
                    />
                    <Button onClick={searchCustomers} size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCreatingCustomer(true)}
                    >
                      Nuevo
                    </Button>
                  </div>

                  {foundCustomers.length > 0 && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {foundCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setCustomerId(customer.id);
                            setCustomerName(customer.name);
                            setFoundCustomers([]);
                            setCustomerSearch('');
                          }}
                          className="w-full p-3 text-left hover:bg-muted transition-colors"
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {creatingCustomer && (
                <div className="space-y-3 mt-2 border p-4 rounded-md">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label>Teléfono *</Label>
                    <Input
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                      placeholder="Teléfono"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                      placeholder="Email (opcional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createCustomer} className="flex-1">
                      Crear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreatingCustomer(false);
                        setNewCustomerData({ name: '', phone: '', email: '' });
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
                      setCustomerId('');
                      setCustomerName('Consumidor final');
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('search')} disabled={loading}>
                Atrás
              </Button>
              <Button
                onClick={() => setStep('payment')}
                disabled={loading}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-slate-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">{formatARS(total)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Pagado</span>
                <span className="text-lg font-semibold">{formatARS(totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Restante</span>
                <span className={`text-lg font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatARS(remaining)}
                </span>
              </div>
            </div>

            {/* Add Payment Form */}
            <div>
              <Label>Agregar pago</Label>
              <div className="flex gap-2 mt-2">
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Medio de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Monto"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-32"
                />
                <Button onClick={addPayment} disabled={!paymentMethodId || paymentAmount <= 0}>
                  Agregar
                </Button>
              </div>
            </div>

            {/* Payments List */}
            {payments.length > 0 && (
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted font-medium">Pagos</div>
                <div className="divide-y">
                  {payments.map((payment, index) => {
                    const method = paymentMethods.find(m => m.id === payment.paymentMethodId);
                    return (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{method?.name || 'Desconocido'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatARS(payment.amount)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePayment(index)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('customer')} disabled={loading}>
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={payments.length === 0 || totalPaid < total || loading}
              >
                Confirmar Venta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
