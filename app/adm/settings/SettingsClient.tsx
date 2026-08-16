"use client";

import { useState, useRef } from "react";
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
  Wifi,
  KeyRound,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

type CertHealthState =
  | "ready"
  | "missing"
  | "no-master-key"
  | "expired"
  | "invalid";

interface CertHealth {
  state: CertHealthState;
  uploadedAt: string | null;
  expiresAt: string | null;
  detail: string;
}

interface SettingsClientProps {
  initialMinimumMargin: number;
  initialAfipSettings: {
    cuit: string;
    puntoVenta: string;
    responsable: string;
    production: boolean;
  };
  initialCertHealth: CertHealth;
}

export default function SettingsClient({
  initialMinimumMargin,
  initialAfipSettings,
  initialCertHealth,
}: SettingsClientProps) {
  const [minimumMargin, setMinimumMargin] = useState<string>(
    initialMinimumMargin.toString(),
  );
  const [afipSettings, setAfipSettings] = useState(initialAfipSettings);
  const [saving, setSaving] = useState(false);
  const [savingAfip, setSavingAfip] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Certificate state
  const [certHealth, setCertHealth] = useState<CertHealth>(initialCertHealth);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [removingCert, setRemovingCert] = useState(false);
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [certPassword, setCertPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".p12") && !file.name.endsWith(".pfx")) {
        toast.error("El archivo debe ser un certificado .p12 o .pfx");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadCert = async () => {
    if (!selectedFile) {
      toast.error("Seleccione un archivo .p12");
      return;
    }
    if (!certPassword) {
      toast.error("Ingrese el password del certificado");
      return;
    }

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("password", certPassword);

      const response = await fetch("/api/afip/certificate", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh health from API to get accurate state
        await refreshCertHealth();
        setShowCertUpload(false);
        setSelectedFile(null);
        setCertPassword("");
        if (data.expiresAt) {
          toast.success(
            `Certificado subido correctamente. Vence el ${format(new Date(data.expiresAt), "dd/MM/yyyy", { locale: es })}`,
          );
        } else {
          toast.success("Certificado subido correctamente");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al subir el certificado");
      }
    } catch {
      toast.error("Error de red al subir el certificado");
    } finally {
      setUploadingCert(false);
    }
  };

  const handleRemoveCert = async () => {
    setRemovingCert(true);
    try {
      const response = await fetch("/api/afip/certificate", {
        method: "DELETE",
      });

      if (response.ok) {
        setCertHealth({
          state: "missing",
          uploadedAt: null,
          expiresAt: null,
          detail: "No hay certificado subido. El sistema opera en modo simulación.",
        });
        toast.success("Certificado eliminado. Sistema en modo simulación.");
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al eliminar el certificado");
      }
    } catch {
      toast.error("Error de red al eliminar el certificado");
    } finally {
      setRemovingCert(false);
    }
  };

  const refreshCertHealth = async () => {
    try {
      const response = await fetch("/api/afip/certificate");
      if (response.ok) {
        const data = await response.json();
        setCertHealth({
          state: data.state,
          uploadedAt: data.uploadedAt,
          expiresAt: data.expiresAt,
          detail: data.detail,
        });
      }
    } catch {
      // Silently fail — UI keeps last known state
    }
  };

  // Compute days until expiry for countdown display
  const daysUntilExpiry = certHealth.expiresAt
    ? differenceInDays(new Date(certHealth.expiresAt), new Date())
    : null;

  const expiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  // Render certificate status banner based on health state
  const renderCertStatus = () => {
    switch (certHealth.state) {
      case "ready":
        return (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg border flex items-center justify-center",
                expiryWarning
                  ? "bg-amber-100 border-amber-200"
                  : "bg-emerald-100 border-emerald-200",
              )}>
                {expiryWarning ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {expiryWarning
                    ? `Certificado vence en ${daysUntilExpiry} días`
                    : "Certificado configurado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {certHealth.uploadedAt
                    ? `Subido el ${format(new Date(certHealth.uploadedAt), "dd/MM/yyyy", { locale: es })}`
                    : "Sin fecha de subida"}
                  {certHealth.expiresAt
                    ? ` · Vence el ${format(new Date(certHealth.expiresAt), "dd/MM/yyyy", { locale: es })}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCertUpload(true)}
                disabled={uploadingCert || removingCert}
              >
                <Upload className="h-4 w-4 mr-1" />
                Reemplazar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveCert}
                loading={removingCert}
                disabled={uploadingCert}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">
                  Certificado vencido
                </p>
                <p className="text-xs text-muted-foreground">
                  {certHealth.detail} El sistema opera en modo simulación.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCertUpload(true)}
              disabled={uploadingCert || removingCert}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Upload className="h-4 w-4 mr-1" />
              Renovar certificado
            </Button>
          </div>
        );

      case "invalid":
        return (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">
                  Certificado inválido o corrupto
                </p>
                <p className="text-xs text-muted-foreground">
                  {certHealth.detail} Suba el certificado nuevamente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCertUpload(true)}
                disabled={uploadingCert || removingCert}
              >
                <Upload className="h-4 w-4 mr-1" />
                Reemplazar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveCert}
                loading={removingCert}
                disabled={uploadingCert}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        );

      case "no-master-key":
        return (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Modo simulación (sin master key)
                </p>
                <p className="text-xs text-muted-foreground">
                  Falta la variable de entorno <code className="font-mono text-xs">AFIP_CERT_MASTER_KEY</code>.
                  El admin debe configurarla para habilitar certificados reales.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Requiere configurar AFIP_CERT_MASTER_KEY en el servidor"
            >
              <Upload className="h-4 w-4 mr-1" />
              Subir certificado
            </Button>
          </div>
        );

      case "missing":
      default:
        return (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Sin certificado
                </p>
                <p className="text-xs text-muted-foreground">
                  Modo simulación (mock). Suba un certificado para habilitar AFIP real.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCertUpload(true)}
              disabled={uploadingCert || removingCert}
            >
              <Upload className="h-4 w-4 mr-1" />
              Subir certificado
            </Button>
          </div>
        );
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
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
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
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
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
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
            <CardTitle className="text-lg">
              Configuración Fiscal (AFIP)
            </CardTitle>
            <CardDescription>
              Datos del emisor y certificado para facturación electrónica.
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
                description="Activar para emitir comprobantes reales (requiere certificado válido)"
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

              {/* Certificate section with granular health states */}
              <div className="pt-4 border-t">
                {renderCertStatus()}

                {/* Upload form (collapsible) */}
                {showCertUpload && (
                  <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileKey className="h-4 w-4" />
                      Subir certificado .p12
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Archivo del certificado (.p12 / .pfx)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".p12,.pfx"
                        onChange={handleFileSelect}
                        className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground">
                          Seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Password del certificado
                      </label>
                      <Input
                        type="password"
                        value={certPassword}
                        onChange={(e) => setCertPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-9 text-sm"
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCertUpload(false);
                          setSelectedFile(null);
                          setCertPassword("");
                        }}
                        disabled={uploadingCert}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUploadCert}
                        loading={uploadingCert}
                        disabled={!selectedFile || !certPassword}
                      >
                        {uploadingCert ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Confirmar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

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
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
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

        {/* Permisos por Rol */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/20 border-b">
            <CardTitle className="text-lg">Seguridad</CardTitle>
            <CardDescription>
              Gestión de accesos y permisos del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              href="/adm/settings/permissions"
              className="group block hover:bg-muted/30 transition-colors"
            >
              <div className="px-6">
                <SettingItem
                  title="Permisos por Rol"
                  description="Configura qué permisos tienen los roles Staff y Vendedor"
                  icon={KeyRound}
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
