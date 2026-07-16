"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Header } from "@/components/adm/Header";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingItem } from "@/components/settings/SettingItem";
import {
  CreditCard,
  ChevronRight,
  Palette,
  Percent,
  TrendingUp,
  Building2,
  ShieldCheck,
  Globe,
  FileKey,
  Hash,
  Fingerprint,
  MapPin,
  UserCheck,
  FolderOpen,
  Wifi,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsClientProps {
  initialMinimumMargin: number;
  initialAfipSettings: {
    cuit: string;
    puntoVenta: string;
    responsable: string;
    production: boolean;
    certPath: string;
  };
}

export default function SettingsClient({
  initialMinimumMargin,
  initialAfipSettings,
}: SettingsClientProps) {
  const [minimumMargin, setMinimumMargin] = useState<string>(
    initialMinimumMargin.toString(),
  );
  const [afipSettings, setAfipSettings] = useState(initialAfipSettings);
  const [saving, setSaving] = useState(false);
  const [savingAfip, setSavingAfip] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = parseFloat(minimumMargin);
      if (isNaN(value) || value < 0 || value > 100) {
        toast.error("El margen debe estar entre 0 y 100");
        return;
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minimumMarginPercentage: value }),
      });

      if (response.ok) {
        toast.success("Configuración actualizada correctamente");
      } else {
        throw new Error("Error al guardar");
      }
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch("/api/afip/test-connection", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Conexión con AFIP establecida correctamente");
      } else {
        const error = await response.json();
        toast.error(error.error || "No se pudo conectar con AFIP");
      }
    } catch {
      toast.error("Error de red al intentar conectar con AFIP");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveAfip = async () => {
    setSavingAfip(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afipCuit: afipSettings.cuit,
          afipPuntoVenta: afipSettings.puntoVenta,
          afipResponsable: afipSettings.responsable,
          afipProduction: afipSettings.production,
          afipCertPath: afipSettings.certPath,
        }),
      });

      if (response.ok) {
        toast.success("Configuración fiscal actualizada");
      } else {
        throw new Error("Error al guardar");
      }
    } catch {
      toast.error("No se pudo guardar la configuración fiscal");
    } finally {
      setSavingAfip(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header
        title="Configuración"
        description="Personaliza la apariencia y comportamiento de la aplicación."
      />

      <div className="space-y-6">
        {/* Apariencia */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/40 border-b">
            <CardTitle className="text-lg">Apariencia</CardTitle>
            <CardDescription>
              Personaliza el tema visual de la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <SettingItem
                title="Tema del Sistema"
                description="Selecciona entre tema claro, oscuro o sincronizado con el sistema"
                icon={Palette}
                htmlFor="theme-selector"
              >
                <ThemeSelector id="theme-selector" />
              </SettingItem>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Precios */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/40 border-b">
            <CardTitle className="text-lg">Listas de Precios</CardTitle>
            <CardDescription>
              Configuración global para el cálculo y alertas de precios.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6">
              <SettingItem
                title="Margen Mínimo Global"
                description="Alerta cuando una lista o excepción quede por debajo de este valor"
                icon={Percent}
                htmlFor="minimum-margin"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <TrendingUp
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      id="minimum-margin"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={minimumMargin}
                      onChange={(e) => setMinimumMargin(e.target.value)}
                      className="w-32 h-9 text-sm pl-9 pr-7 font-mono"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      %
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 px-4"
                    onClick={handleSave}
                    loading={saving}
                    aria-label="Guardar margen mínimo"
                  >
                    Guardar
                  </Button>
                </div>
              </SettingItem>
            </div>
          </CardContent>
        </Card>

        {/* Configuración Fiscal */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/40 border-b">
            <CardTitle className="text-lg">
              Configuración Fiscal (AFIP)
            </CardTitle>
            <CardDescription>
              Datos del emisor y credenciales para facturación electrónica.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 space-y-2">
              <SettingItem
                title="CUIT del Emisor"
                description="Número de CUIT sin guiones (11 dígitos)"
                icon={Building2}
                htmlFor="afip-cuit"
              >
                <div className="relative">
                  <Fingerprint
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="afip-cuit"
                    type="text"
                    maxLength={11}
                    value={afipSettings.cuit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      setAfipSettings({ ...afipSettings, cuit: val });
                    }}
                    className={cn(
                      "w-48 h-9 text-sm pl-10 font-mono",
                      afipSettings.cuit.length > 0 &&
                        afipSettings.cuit.length !== 11 &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                    placeholder="30123456789"
                  />
                </div>
              </SettingItem>

              <SettingItem
                title="Punto de Venta"
                description="Número de punto de venta habilitado en AFIP"
                icon={MapPin}
                htmlFor="afip-pv"
              >
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="afip-pv"
                    type="text"
                    value={afipSettings.puntoVenta}
                    onChange={(e) =>
                      setAfipSettings({
                        ...afipSettings,
                        puntoVenta: e.target.value,
                      })
                    }
                    className="w-32 h-9 text-sm pl-10 font-mono"
                    placeholder="1"
                  />
                </div>
              </SettingItem>

              <SettingItem
                title="Tipo de Responsable"
                description="Categoría impositiva ante AFIP"
                icon={UserCheck}
                htmlFor="afip-responsable"
              >
                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Select
                    value={afipSettings.responsable}
                    onValueChange={(val) =>
                      setAfipSettings({ ...afipSettings, responsable: val })
                    }
                  >
                    <SelectTrigger
                      id="afip-responsable"
                      className="w-48 h-9 text-sm pl-10"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RI">Responsable Inscripto</SelectItem>
                      <SelectItem value="MONOTRIBUTO">
                        Monotributista
                      </SelectItem>
                      <SelectItem value="EXENTO">Exento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SettingItem>

              <SettingItem
                title="Modo Producción"
                description="Activar para emitir comprobantes reales (requiere certificados reales)"
                icon={Globe}
                htmlFor="afip-production"
              >
                <Switch
                  id="afip-production"
                  checked={afipSettings.production}
                  onCheckedChange={(checked) =>
                    setAfipSettings({ ...afipSettings, production: checked })
                  }
                />
              </SettingItem>

              <SettingItem
                title="Ruta del Certificado"
                description="Ruta local al archivo .p12 del certificado"
                icon={FolderOpen}
                htmlFor="afip-cert"
              >
                <div className="relative">
                  <FileKey
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="afip-cert"
                    type="text"
                    value={afipSettings.certPath}
                    onChange={(e) =>
                      setAfipSettings({
                        ...afipSettings,
                        certPath: e.target.value,
                      })
                    }
                    className="w-80 h-9 text-sm pl-10 font-mono"
                    placeholder="/path/to/cert.p12"
                  />
                </div>
              </SettingItem>

              <div className="flex justify-end gap-3 py-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  loading={testingConnection}
                  disabled={savingAfip}
                  aria-label="Probar conexión con AFIP"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Probar Conexión
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAfip}
                  loading={savingAfip}
                  disabled={testingConnection}
                  aria-label="Guardar configuración fiscal"
                >
                  Guardar Configuración Fiscal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finanzas */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/40 border-b">
            <CardTitle className="text-lg">Finanzas</CardTitle>
            <CardDescription>
              Configuración de métodos de pago y opciones de cobro.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              href="/adm/payment-methods"
              className="group block hover:bg-muted/30 transition-colors"
            >
              <div className="px-6">
                <SettingItem
                  title="Métodos de Pago"
                  description="Administra las formas de pago disponibles (Efectivo, Transferencia, QR, etc.)"
                  icon={CreditCard}
                >
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </SettingItem>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
