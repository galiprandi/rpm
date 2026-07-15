"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { Streamdown } from "streamdown";
import {
  MessageSquare,
  X,
  Send,
  Plus,
  FileImage,
  Camera as CameraIcon,
  Maximize2,
  Minimize2,
  Loader2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth-client";

export function ChatFloating({
  isOpen: controlledIsOpen,
  onOpenChange,
}: { isOpen?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const isMobile = useIsMobile();
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform?.toUpperCase().includes("MAC");
  const shortcutLabel = isMac ? "⌘Shift+M" : "Ctrl+Shift+M";
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState("");

  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id || "anon";
  const userRole =
    (session?.user as { role?: string } | undefined)?.role || "ADMIN";
  const chatId = useMemo(() => `nitro-chat-${userId}`, [userId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/bot/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            messages,
            context: {
              ...(body as Record<string, unknown>),
              role: userRole,
              userId,
              pathname,
            },
          },
        }),
      }),
    [userId, pathname, userRole],
  );

  const onFinish = useCallback(() => {
    router.refresh();
  }, [router]);

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chatId,
    transport,
    onFinish,
  });

  const isSubmitting = status === "submitted" || status === "streaming";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = localInput?.trim();
    if (!messageText && !attachedFile) return;
    setLocalInput("");

    if (attachedFile) {
      const arrayBuffer = await attachedFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${attachedFile.type || "application/octet-stream"};base64,${base64}`;
      const filePart: FileUIPart = {
        type: "file",
        mediaType: attachedFile.type || "application/octet-stream",
        url: dataUrl,
      };
      await sendMessage({
        text: messageText,
        files: [filePart],
      });
    } else {
      await sendMessage({ text: messageText });
    }
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (global - works even when chat is closed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+M (Mac) / Ctrl+Shift+M (Win/Linux) to toggle chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "M") {
        e.preventDefault();
        setIsOpen(!isOpen);
        return;
      }

      if (!isOpen) return;

      // Escape to close chat
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {!isMobile && (
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`${
            isMobile
              ? "fixed inset-0 w-full h-full rounded-none"
              : `fixed bottom-24 right-6 bg-background border rounded-lg shadow-xl z-50 flex flex-col transition-all duration-300 ${
                  isExpanded ? "w-[600px] h-[700px]" : "w-[500px] h-[600px]"
                }`
          } bg-background z-50 flex flex-col`}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Nitro</h3>
              <p className="text-sm text-muted-foreground">
                Asistente de operaciones
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Reducir" : "Expandir"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>¡Hola! Soy Nitro, tu asistente virtual.</p>
                  <p className="text-sm mt-2">¿En qué puedo ayudarte hoy?</p>
                </div>
              )}
              {messages.map((message) => {
                const hasContent =
                  message.role === "user" ||
                  message.parts.some(
                    (p) =>
                      (p.type === "text" && p.text.trim()) ||
                      p.type.startsWith("tool-"),
                  );
                if (!hasContent) return null;
                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm space-y-2">
                          {message.parts.map((part, i) => {
                            if (part.type === "text") {
                              return (
                                <Streamdown key={i}>{part.text}</Streamdown>
                              );
                            }
                            if (part.type.startsWith("tool-")) {
                              const toolName = part.type.replace("tool-", "");
                              const toolLabels: Record<string, string> = {
                                searchProducts: "Buscando productos...",
                                searchCustomers: "Buscando clientes...",
                                searchWorkOrders:
                                  "Buscando órdenes de trabajo...",
                                createDirectSale: "Registrando venta...",
                                createCustomer: "Creando cliente...",
                                createProduct: "Creando producto...",
                                createWorkOrder: "Creando orden de trabajo...",
                                getCashStatus: "Consultando caja...",
                                getTodaySummary: "Generando resumen...",
                                getWorkOrderDetail: "Obteniendo detalle...",
                                updateWorkOrderStatus: "Actualizando estado...",
                                composeWhatsAppMessage: "Redactando mensaje...",
                                closeCashRegister: "Cerrando caja...",
                                registerCustomerWithVehicle:
                                  "Registrando cliente y vehículo...",
                                processPurchaseInvoice:
                                  "Procesando factura de compra...",
                              };
                              const label =
                                toolLabels[toolName] ||
                                `Ejecutando ${toolName}...`;
                              const partState = (part as { state?: string })
                                .state;
                              const isRunning =
                                partState === "input-streaming" ||
                                partState === "input-available";
                              if (partState === "output-available") return null;
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1"
                                >
                                  <Wrench
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {isRunning && (
                                    <Loader2
                                      className="h-3 w-3 animate-spin"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>{label}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        <div className="text-sm space-y-2">
                          {message.parts.map((part, i) => {
                            if (part.type === "text") {
                              return <span key={i}>{part.text}</span>;
                            }
                            if (
                              part.type === "file" &&
                              part.mediaType?.startsWith("image/")
                            ) {
                              return (
                                <img
                                  key={i}
                                  src={part.url}
                                  alt="Attached"
                                  className="rounded-md max-h-32 object-cover"
                                />
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Loading indicator */}
              {isSubmitting && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Nitro está pensando...
                    </span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      {error.message || "Ocurrió un error. Intenta nuevamente."}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} className="p-4 border-t">
            {attachedFile && (
              <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
                <span className="text-sm truncate flex-1">
                  {attachedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top">
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    Adjuntar archivo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Tomar foto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                ref={inputRef}
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                placeholder={`Escribe tu mensaje... (${shortcutLabel} para cerrar)`}
                className="flex-1"
                disabled={isSubmitting}
              />
              {isSubmitting ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => stop()}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!localInput?.trim() && !attachedFile}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
