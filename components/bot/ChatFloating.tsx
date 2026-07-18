"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { BotMessageContent } from "./BotMessageContent";
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
  Check,
  Trash2,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatFloating({
  isOpen: controlledIsOpen,
  onOpenChange,
  serverUser,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  serverUser?: { id: string; name: string; email: string; role?: string };
} = {}) {
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState("");

  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = serverUser?.id || session?.user?.id || "anon";
  const userName = serverUser?.name || session?.user?.name || undefined;
  const userRole =
    serverUser?.role ||
    (session?.user as { role?: string } | undefined)?.role ||
    "ADMIN";
  const chatId = useMemo(() => `nitro-chat-${userId}`, [userId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/bot/chat",
        prepareSendMessagesRequest: ({ messages, body }) => {
          const main = document.querySelector("main");
          const rawContent =
            main?.innerText
              ?.replace(/\t+/g, " ")
              .replace(/[ \t]+/g, " ")
              .replace(/\n{3,}/g, "\n\n")
              .trim() || "";
          const MAX_CONTENT = 1200;
          const pageContent =
            rawContent.length > 50
              ? rawContent.length > MAX_CONTENT
                ? rawContent.slice(0, MAX_CONTENT) + "\n...(contenido truncado)"
                : rawContent
              : undefined;

          const modal = document.querySelector<HTMLElement>(
            '[role="dialog"]:not([hidden])',
          );
          const rawModal =
            modal?.innerText
              ?.replace(/\t+/g, " ")
              .replace(/[ \t]+/g, " ")
              .replace(/\n{3,}/g, "\n\n")
              .trim() || "";
          const MAX_MODAL = 500;
          const modalContent =
            rawModal.length > 20
              ? rawModal.length > MAX_MODAL
                ? rawModal.slice(0, MAX_MODAL) + "\n...(truncado)"
                : rawModal
              : undefined;

          return {
            body: {
              messages,
              context: {
                ...(body as Record<string, unknown>),
                role: userRole,
                userId,
                userName,
                pathname,
                pageContent,
                modalContent,
              },
            },
          };
        },
      }),
    [userId, userName, pathname, userRole],
  );

  const onFinish = useCallback(() => {
    router.refresh();
  }, [router]);

  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({
    id: chatId,
    transport,
    onFinish,
  });

  const isSubmitting = status === "submitted" || status === "streaming";

  const quickSuggestions = [
    { label: "📦 Consultar Stock", text: "¿Hay stock de luces LED?" },
    { label: "🔧 Ver OTs de hoy", text: "Ver órdenes de trabajo de hoy" },
    { label: "💰 Ver Caja de hoy", text: "Ver estado de caja de hoy" },
    {
      label: "📝 Registrar Venta",
      text: "Quiero registrar una venta directa de mostrador",
    },
  ];

  const handleSuggestionClick = async (text: string) => {
    if (isSubmitting) return;
    setLocalInput("");
    await sendMessage({ text });
  };

  const handleActionClick = async (action: string) => {
    if (isSubmitting) return;
    await sendMessage({ text: action });
  };

  const handleClearConversation = () => {
    stop();
    setMessages([]);
    setAttachedFile(null);
    setLocalInput("");
    clearError();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

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

  // Smart auto-scroll to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Check if the scroll position is within 150px of the bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    const isLastMessageFromUser =
      messages[messages.length - 1]?.role === "user";

    if (isNearBottom || isLastMessageFromUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  // Auto-focus input when chat opens (desktop only to prevent keyboard hijacking on mobile)
  useEffect(() => {
    if (isOpen && !isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMobile]);

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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 active:scale-95 transition-transform duration-200"
              size="icon"
              aria-label={
                isOpen ? "Cerrar asistente virtual" : "Abrir asistente virtual"
              }
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MessageSquare className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="bg-slate-900 text-white border-slate-800"
          >
            {isOpen ? "Cerrar chat (Esc)" : `Abrir chat (${shortcutLabel})`}
          </TooltipContent>
        </Tooltip>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearConversation}
                    disabled={messages.length === 0}
                    aria-label="Limpiar conversación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  Limpiar conversación
                </TooltipContent>
              </Tooltip>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded(!isExpanded)}
                      aria-label={
                        isExpanded
                          ? "Reducir tamaño del chat"
                          : "Expandir tamaño del chat"
                      }
                    >
                      {isExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-slate-900 text-white border-slate-800"
                  >
                    {isExpanded ? "Reducir" : "Expandir"}
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    aria-label="Cerrar chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  Cerrar chat
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-4 overflow-y-auto"
          >
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-6 px-2">
                  <MessageSquare
                    className="h-12 w-12 mx-auto mb-2 opacity-30 text-primary"
                    aria-hidden="true"
                  />
                  <p className="font-semibold text-foreground text-base">
                    ¡Hola! Soy Nitro, tu asistente virtual.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-6">
                    Seleccioná un atajo o escribí tu consulta abajo:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    {quickSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionClick(s.text)}
                        className="text-left text-xs bg-muted/50 hover:bg-primary/5 hover:text-primary border hover:border-primary/20 rounded-lg p-3 transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between h-20 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <span className="font-semibold text-foreground/90">
                          {s.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                          {s.text}
                        </span>
                      </button>
                    ))}
                  </div>
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
                                <BotMessageContent
                                  key={i}
                                  text={part.text}
                                  onAction={handleActionClick}
                                  disabled={isSubmitting}
                                />
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
                                registerVehicle: "Registrando vehículo...",
                                registerCustomerWithVehicle:
                                  "Registrando cliente y vehículo...",
                                processPurchaseInvoice:
                                  "Procesando factura de compra...",
                              };
                              const completedLabels: Record<string, string> = {
                                searchProducts:
                                  "Búsqueda de productos completada",
                                searchCustomers:
                                  "Búsqueda de clientes completada",
                                searchWorkOrders:
                                  "Búsqueda de órdenes completada",
                                createDirectSale:
                                  "Venta registrada exitosamente",
                                createCustomer: "Cliente creado exitosamente",
                                createProduct: "Producto creado exitosamente",
                                registerVehicle: "Vehículo registrado exitosamente",
                                createWorkOrder:
                                  "Orden de trabajo creada exitosamente",
                                getCashStatus: "Consulta de caja completada",
                                getTodaySummary:
                                  "Resumen generado exitosamente",
                                getWorkOrderDetail:
                                  "Detalle de orden de trabajo obtenido",
                                updateWorkOrderStatus:
                                  "Estado de orden de trabajo actualizado",
                                composeWhatsAppMessage:
                                  "Mensaje de WhatsApp redactado",
                                registerCustomerWithVehicle:
                                  "Cliente y vehículo registrados exitosamente",
                                processPurchaseInvoice:
                                  "Factura de compra procesada exitosamente",
                              };
                              const partState = (part as { state?: string })
                                .state;
                              const isRunning =
                                partState === "input-streaming" ||
                                partState === "input-available";
                              const isCompleted =
                                partState === "output-available";
                              const label = isCompleted
                                ? completedLabels[toolName] ||
                                  `Ejecución de ${toolName} completada`
                                : toolLabels[toolName] ||
                                  `Ejecutando ${toolName}...`;

                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1"
                                >
                                  {isCompleted ? (
                                    <Check
                                      className="h-3 w-3 text-emerald-700"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Wrench
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                  )}
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <X className="h-4 w-4 text-red-700" aria-hidden="true" />
                    <span className="text-sm text-red-700 font-medium">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={handleRemoveFile}
                      aria-label="Quitar archivo adjunto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 text-white border-slate-800"
                  >
                    Quitar archivo adjunto
                  </TooltipContent>
                </Tooltip>
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
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Adjuntar archivos"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
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
                <TooltipContent
                  side="top"
                  className="bg-slate-900 text-white border-slate-800"
                >
                  Adjuntar archivos
                </TooltipContent>
              </Tooltip>
              <Input
                ref={inputRef}
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                placeholder={`Escribe tu mensaje... (${shortcutLabel} para cerrar)`}
                className="flex-1"
                disabled={isSubmitting}
              />
              {isSubmitting ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => stop()}
                      aria-label="Detener respuesta de Nitro"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 text-white border-slate-800"
                  >
                    Detener respuesta
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!localInput?.trim() && !attachedFile}
                      aria-label="Enviar mensaje"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 text-white border-slate-800"
                  >
                    Enviar mensaje
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
