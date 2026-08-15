"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { toast } from "sonner";
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
  Mic,
  MicOff,
  RotateCw,
  Copy,
  ArrowDown,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null);
  const [detectedBarcode, setDetectedBarcode] = useState<{ value: string; format: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [localInput, setLocalInput] = useState("");
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem("nitro-sound-notifications");
      return stored ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nitro-sound-notifications", String(next));
      } catch (e) {
        console.error("Error saving sound preference", e);
      }
      return next;
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playChime = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Synthesize a double-chime notification sound: E5 (659.25Hz) & B5 (987.77Hz)
      playChime(659.25, 0, 0.15);
      playChime(987.77, 0.12, 0.25);
    } catch (e) {
      console.error("Failed to play notification sound", e);
    }
  }, []);

  // Check if speech synthesis is supported in the current environment/browser
  const isSpeechSynthesisSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!window.speechSynthesis;
  }, []);

  // Dynamically auto-resize the input textarea height based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [localInput]);
  const confirmClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Compute file extension for non-image file uploads fallback badge
  const fileExtension = useMemo(() => {
    if (!attachedFile) return "";
    const parts = attachedFile.name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  }, [attachedFile]);

  // Handle attached image preview & memory cleanup (object URL)
  useEffect(() => {
    if (!attachedFile || !attachedFile.type.startsWith("image/")) {
      setAttachedPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(attachedFile);
    setAttachedPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [attachedFile]);

  // Clean up attached file, barcode, and input fields when chat closes
  useEffect(() => {
    if (!isOpen) {
      setAttachedFile(null);
      setDetectedBarcode(null);
      setIsDragging(false);
      dragCounterRef.current = 0;
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (confirmClearTimerRef.current) {
        clearTimeout(confirmClearTimerRef.current);
      }
    };
  }, []);

  // Stop active speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Check if speech recognition is supported in the current environment/browser
  const isSpeechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  const toggleListening = useCallback(() => {
    if (!isSpeechSupported) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop automatically when user finishes speaking
      recognition.lang = "es-AR"; // Spanish Argentina
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setLocalInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
      setIsListening(false);
    }
  }, [isListening, isSpeechSupported]);

  // Clean up speech recognition on unmount or close
  useEffect(() => {
    if (!isOpen && isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  }, [isOpen, isListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

  const chatHelpers = useChat({
    id: chatId,
    transport,
    onFinish,
  });
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = chatHelpers;

  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current === "streaming" && status === "ready" && soundEnabled) {
      playNotificationSound();
    }
    prevStatusRef.current = status;
  }, [status, soundEnabled, playNotificationSound]);

  const handleToggleSpeak = useCallback((messageId: string, parts?: any[]) => {
    if (!isSpeechSynthesisSupported) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Resolve parts if not passed directly (e.g., from Alt+S keyboard listener)
    const activeParts = parts || messages.find(m => m.id === messageId)?.parts;
    if (!activeParts) return;

    const textToSpeak = activeParts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");

    if (!textToSpeak.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "es-AR";

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(messageId);
  }, [speakingMessageId, messages, isSpeechSynthesisSupported]);

  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Client-side Session Persistence for chat messages (safe from state leaks/race conditions)
  useEffect(() => {
    if (lastLoadedUserIdRef.current !== userId) {
      try {
        const stored = sessionStorage.getItem(`nitro-messages-${userId}`);
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error("Error reading stored messages", e);
      }
      lastLoadedUserIdRef.current = userId;
      return;
    }

    try {
      if (messages.length > 0) {
        sessionStorage.setItem(`nitro-messages-${userId}`, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(`nitro-messages-${userId}`);
      }
    } catch (e) {
      console.error("Error saving messages", e);
    }
  }, [messages, userId, setMessages]);

  const isSubmitting = status === "submitted" || status === "streaming";

  const friendlyErrorMessage = useMemo(() => {
    if (!error) return null;
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
      return "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.";
    }
    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("session")) {
      return "Tu sesión ha expirado o no tienes permisos. Por favor, recarga la página.";
    }
    if (msg.includes("429") || msg.includes("rate_limit") || msg.includes("rate limit")) {
      return "Se alcanzó el límite de solicitudes. Por favor, espera un momento antes de volver a intentar.";
    }
    if (
      msg.includes("syntaxerror") ||
      msg.includes("unexpected token") ||
      msg.includes("internal server error") ||
      msg.includes("500") ||
      msg.includes("groq_model") ||
      msg.includes("env var") ||
      msg.includes("api_key") ||
      msg.includes("database") ||
      msg.includes("drizzle") ||
      msg.startsWith("{") // JSON block
    ) {
      return "El asistente virtual no está disponible o no está configurado correctamente en este momento. Por favor, intenta de nuevo más tarde o contacta al administrador.";
    }
    return error.message;
  }, [error]);

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  const quickSuggestions = useMemo(() => {
    const base = [
      { label: "📦 Consultar Stock", text: "¿Hay stock de luces LED?" },
      { label: "🔧 Ver OTs de hoy", text: "Ver órdenes de trabajo de hoy" },
      { label: "💰 Ver Caja de hoy", text: "Ver estado de caja de hoy" },
      {
        label: "📝 Registrar Venta",
        text: "Quiero registrar una venta directa de mostrador",
      },
    ];

    if (pathname.includes("/work-orders")) {
      base[1] = { label: "🔧 Crear OT rápida", text: "Quiero crear una nueva orden de trabajo" };
    } else if (pathname.includes("/customers")) {
      base[1] = { label: "👥 Buscar Clientes", text: "Buscar clientes por teléfono o patente" };
    } else if (pathname.includes("/vehicles")) {
      base[1] = { label: "🚗 Registrar Vehículo", text: "Quiero registrar un vehículo para un cliente" };
    } else if (pathname.includes("/products")) {
      base[0] = { label: "📦 Crear Producto", text: "Quiero crear un nuevo producto en catálogo" };
    } else if (pathname.includes("/invoices")) {
      base[3] = { label: "🧾 Facturas del día", text: "Ver estado de las facturas de hoy" };
    } else if (pathname.includes("/cash")) {
      base[3] = { label: "💸 Movimiento Caja", text: "Quiero registrar un movimiento de caja" };
    } else if (pathname.includes("/purchase-vouchers")) {
      base[1] = { label: "🧾 Procesar Factura", text: "Quiero procesar una factura de compra" };
    } else if (pathname.includes("/suppliers")) {
      base[1] = { label: "👥 Buscar Proveedores", text: "Buscar proveedores" };
    } else if (pathname.includes("/settings")) {
      base[1] = { label: "⚙️ Roles y Permisos", text: "Ver los roles y permisos de los usuarios" };
    } else if (pathname.includes("/reports")) {
      base[1] = { label: "📊 Resumen diario", text: "Ver resumen del día" };
    } else if (pathname.includes("/services")) {
      base[0] = { label: "🛠️ Buscar Servicios", text: "Buscar servicios del taller" };
    } else if (pathname.includes("/direct-sales")) {
      base[1] = { label: "📝 Nueva Venta Directa", text: "Quiero registrar una venta directa de mostrador" };
    } else if (pathname.includes("/categories")) {
      base[0] = { label: "📦 Buscar Productos", text: "Buscar productos en el catálogo" };
    } else if (pathname.includes("/users")) {
      base[1] = { label: "👥 Buscar Técnicos", text: "Buscar usuarios o técnicos" };
    }

    return base;
  }, [pathname]);

  const followUpSuggestions = useMemo(() => {
    const base = [
      { label: "📦 Stock", text: "¿Hay stock de luces LED?" },
      { label: "🔧 OTs hoy", text: "Ver órdenes de trabajo de hoy" },
      { label: "💰 Caja hoy", text: "Ver estado de caja de hoy" },
      { label: "❓ Ayuda", text: "ayuda" },
    ];

    if (pathname.includes("/work-orders")) {
      base[1] = { label: "🔧 Nueva OT", text: "Quiero crear una nueva orden de trabajo" };
    } else if (pathname.includes("/customers")) {
      base[1] = { label: "👥 Clientes", text: "Buscar clientes por teléfono o patente" };
    } else if (pathname.includes("/vehicles")) {
      base[1] = { label: "🚗 Vehículo", text: "Quiero registrar un vehículo para un cliente" };
    } else if (pathname.includes("/products")) {
      base[0] = { label: "📦 Nuevo Prod.", text: "Quiero crear un nuevo producto en catálogo" };
    } else if (pathname.includes("/invoices")) {
      base[2] = { label: "🧾 Facturas", text: "Ver estado de las facturas de hoy" };
    } else if (pathname.includes("/cash")) {
      base[2] = { label: "💸 Mov. Caja", text: "Quiero registrar un movimiento de caja" };
    } else if (pathname.includes("/purchase-vouchers")) {
      base[1] = { label: "🧾 Factura Compra", text: "Quiero procesar una factura de compra" };
    } else if (pathname.includes("/suppliers")) {
      base[1] = { label: "👥 Proveedores", text: "Buscar proveedores" };
    } else if (pathname.includes("/settings")) {
      base[1] = { label: "⚙️ Roles", text: "Ver los roles y permisos de los usuarios" };
    } else if (pathname.includes("/reports")) {
      base[1] = { label: "📊 Resumen", text: "Ver resumen del día" };
    } else if (pathname.includes("/services")) {
      base[0] = { label: "🛠️ Servicios", text: "Buscar servicios del taller" };
    } else if (pathname.includes("/direct-sales")) {
      base[1] = { label: "📝 Venta Directa", text: "Quiero registrar una venta directa de mostrador" };
    } else if (pathname.includes("/categories")) {
      base[0] = { label: "📦 Productos", text: "Buscar productos" };
    } else if (pathname.includes("/users")) {
      base[1] = { label: "👥 Técnicos", text: "Buscar usuarios o técnicos" };
    }

    return base;
  }, [pathname]);

  const retryLastMessage = useCallback(async () => {
    clearError();
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) return;
    const text = lastUserMessage.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    if (!text) return;
    await sendMessage({ text });
  }, [clearError, messages, sendMessage]);

  const handleSuggestionClick = useCallback(async (text: string) => {
    if (isSubmitting) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setLocalInput("");
    await sendMessage({ text });
  }, [isSubmitting, sendMessage]);

  // Listen for "nitro:ask" events from the AskNitroCard dashboard widget
  useEffect(() => {
    const handleNitroAsk = (event: Event) => {
      const query = (event as CustomEvent<{ query: string }>).detail?.query;
      if (!query) return;
      setIsOpen(true);
      handleSuggestionClick(query);
    };
    window.addEventListener("nitro:ask", handleNitroAsk);
    return () => window.removeEventListener("nitro:ask", handleNitroAsk);
  }, [handleSuggestionClick, setIsOpen]);

  const handleActionClick = async (action: string) => {
    if (isSubmitting) return;
    await sendMessage({ text: action });
  };

  const handleClearConversation = useCallback(() => {
    if (messages.length === 0) return;

    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      if (confirmClearTimerRef.current) {
        clearTimeout(confirmClearTimerRef.current);
      }
      confirmClearTimerRef.current = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 3000);
      return;
    }

    if (confirmClearTimerRef.current) {
      clearTimeout(confirmClearTimerRef.current);
    }
    setIsConfirmingClear(false);
    stop();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setMessages([]);
    setAttachedFile(null);
    setDetectedBarcode(null);
    setLocalInput("");
    clearError();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  }, [messages.length, isConfirmingClear, stop, setMessages, clearError]);

  // Automatically run native BarcodeDetector on image files
  useEffect(() => {
    if (!attachedFile || !attachedFile.type.startsWith("image/")) {
      setDetectedBarcode(null);
      return;
    }

    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      setDetectedBarcode(null);
      return;
    }

    let active = true;

    const detectBarcode = async () => {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        const detector = new BarcodeDetectorClass({
          formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
        });

        const url = URL.createObjectURL(attachedFile);
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }

        const results = await detector.detect(img);
        URL.revokeObjectURL(url);

        if (!active) return;

        if (results && results.length > 0) {
          const first = results[0];
          setDetectedBarcode({
            value: first.rawValue,
            format: first.format,
          });
        } else {
          setDetectedBarcode(null);
        }
      } catch (e) {
        console.error("Barcode detection failed:", e);
        if (active) {
          setDetectedBarcode(null);
        }
      }
    };

    detectBarcode();

    return () => {
      active = false;
    };
  }, [attachedFile]);

  const handleProcessInvoiceShortcut = async () => {
    if (!attachedFile || isSubmitting) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setLocalInput("");

    try {
      const arrayBuffer = await attachedFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${attachedFile.type || "application/octet-stream"};base64,${base64}`;
      const filePart: FileUIPart = {
        type: "file",
        mediaType: attachedFile.type || "application/octet-stream",
        url: dataUrl,
      };
      await sendMessage({
        text: "Procesar factura de compra",
        files: [filePart],
      });
    } catch (e) {
      console.error("Error processing attachment shortcut:", e);
    }

    setAttachedFile(null);
    setDetectedBarcode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBarcodeSearchShortcut = async () => {
    if (!detectedBarcode || isSubmitting) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setLocalInput("");

    await sendMessage({
      text: `Buscar ${detectedBarcode.value}`,
    });

    setAttachedFile(null);
    setDetectedBarcode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = localInput?.trim();
    if (!messageText && !attachedFile) return;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setLocalInput("");

    if (attachedFile) {
      const arrayBuffer = await attachedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
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

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollToBottom(isFarFromBottom);

    if (!isFarFromBottom) {
      setLastSeenMessageCount(messages.length);
    }
  }, [messages.length]);

  // Keep track of read/unread message counts
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      setLastSeenMessageCount(messages.length);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

    if (isNearBottom) {
      setLastSeenMessageCount(messages.length);
    }
  }, [messages.length]);

  useEffect(() => {
    handleScroll();
  }, [messages.length, isOpen, handleScroll]);

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

      // Escape to close chat or stop stream if active
      if (e.key === "Escape") {
        if (isSubmitting) {
          e.preventDefault();
          stop();
        } else {
          setIsOpen(false);
        }
        return;
      }

      // Alt+1 to Alt+4 to trigger quick suggestions when conversation is empty
      if (e.altKey && messages.length === 0) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          const suggestion = quickSuggestions[num - 1];
          if (suggestion) {
            handleSuggestionClick(suggestion.text);
          }
          return;
        }
      }

      // Alt+V to toggle voice dictation/listening
      if (e.altKey && e.key?.toLowerCase() === "v") {
        if (isSpeechSupported && !isSubmitting) {
          e.preventDefault();
          toggleListening();
        }
        return;
      }

      // Alt+C to clear conversation
      if (e.altKey && e.key?.toLowerCase() === "c") {
        if (messages.length > 0) {
          e.preventDefault();
          handleClearConversation();
        }
        return;
      }

      // Alt+S to toggle speaking of the last assistant message
      if (e.altKey && e.key?.toLowerCase() === "s") {
        if (isSpeechSynthesisSupported && lastAssistantMessageId) {
          e.preventDefault();
          handleToggleSpeak(lastAssistantMessageId);
        }
        return;
      }

      // Alt+N to toggle sound notifications
      if (e.altKey && e.key?.toLowerCase() === "n") {
        e.preventDefault();
        toggleSoundEnabled();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    setIsOpen,
    messages.length,
    quickSuggestions,
    handleSuggestionClick,
    isSpeechSupported,
    isSubmitting,
    toggleListening,
    handleClearConversation,
    isSpeechSynthesisSupported,
    lastAssistantMessageId,
    handleToggleSpeak,
  ]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateAndSetFile = (file: File | null) => {
    if (!file) {
      setAttachedFile(null);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("El archivo supera el límite de 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      return false;
    }
    setAttachedFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setDetectedBarcode(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types?.includes("Files")) {
      dragCounterRef.current++;
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSetFile(file);
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
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 active:scale-95 transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2"
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
            className="bg-foreground text-background"
          >
            {isOpen ? "Cerrar chat (Esc)" : `Abrir chat (${shortcutLabel})`}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`${
            isMobile
              ? "fixed inset-0 w-full h-[100dvh] rounded-none"
              : `fixed bottom-20 right-6 bg-background border rounded-lg shadow-xl z-50 flex flex-col transition-all duration-300 ${
                  isExpanded ? "w-[600px] h-[700px]" : "w-[500px] h-[600px]"
                }`
          } bg-background z-50 flex flex-col`}
        >
          {isDragging && (
            <div
              data-testid="drag-overlay"
              className="absolute inset-0 bg-background/90 backdrop-blur-xs border-2 border-dashed border-primary rounded-lg z-[60] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200"
            >
              <Plus className="h-12 w-12 text-primary animate-bounce mb-2" />
              <p className="font-semibold text-foreground text-base">
                Soltá el archivo aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Se adjuntará a tu próximo mensaje automáticamente
              </p>
            </div>
          )}

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
                    onClick={toggleSoundEnabled}
                    aria-label={
                      soundEnabled
                        ? "Notificaciones de sonido activadas (Alt+N)"
                        : "Notificaciones de sonido desactivadas (Alt+N)"
                    }
                    className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-full p-0.5 text-muted-foreground"
                  >
                    {soundEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground/60" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-foreground text-background">
                  {soundEnabled ? "Sonido activado (Alt+N)" : "Sonido desactivado (Alt+N)"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearConversation}
                    disabled={messages.length === 0}
                    aria-label={
                      isConfirmingClear
                        ? "Haz clic de nuevo o presiona Alt+C para confirmar"
                        : "Limpiar conversación (Alt+C)"
                    }
                    className={`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-full p-0.5 ${
                      isConfirmingClear
                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                        : ""
                    }`}
                  >
                    {isConfirmingClear ? (
                      <Check className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-foreground text-background"
                >
                  {isConfirmingClear
                    ? "Presiona Alt+C para confirmar"
                    : "Limpiar conversación (Alt+C)"}
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
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-full p-0.5"
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
                    className="bg-foreground text-background"
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
                    className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-full p-0.5"
                    onClick={() => setIsOpen(false)}
                    aria-label="Cerrar chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-foreground text-background"
                >
                  Cerrar chat
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Messages Wrapper */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
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
                        className="relative text-left text-xs bg-muted/50 hover:bg-primary/5 hover:text-primary border hover:border-primary/20 rounded-lg p-3 transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between h-20 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <span className="font-semibold text-foreground/90 pr-10">
                          {s.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                          {s.text}
                        </span>
                        <kbd className="absolute top-2 right-2 px-1 text-[9px] font-mono rounded bg-background border border-muted-foreground/20 text-muted-foreground select-none">
                          Alt+{idx + 1}
                        </kbd>
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
                          : "bg-muted text-foreground"
                      } relative group`}
                    >
                      {message.role === "assistant" ? (
                        <>
                          <div className="text-sm space-y-2 pr-14">
                          {message.parts.map((part, i) => {
                            if (part.type === "text") {
                              return (
                                <BotMessageContent
                                  key={i}
                                  text={part.text}
                                  onAction={handleActionClick}
                                  disabled={isSubmitting || message.id !== lastAssistantMessageId}
                                />
                              );
                            }
                            if (part.type.startsWith("tool-")) {
                              const toolName = part.type.replace("tool-", "");
                              const toolLabels: Record<string, string> = {
                                searchProducts: "Buscando productos...",
                                searchCustomers: "Buscando clientes...",
                                searchVehicles: "Buscando vehículos...",
                                searchWorkOrders:
                                  "Buscando órdenes de trabajo...",
                                searchServices: "Buscando servicios...",
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
                                registerWorkOrderPayment: "Registrando pago...",
                                attachPhotoToChecklistItem: "Asociando foto al checklist...",
                                assignWorkOrderTechnician: "Asignando técnico a la OT...",
                              };
                              const completedLabels: Record<string, string> = {
                                searchProducts:
                                  "Búsqueda de productos completada",
                                searchCustomers:
                                  "Búsqueda de clientes completada",
                                searchVehicles:
                                  "Búsqueda de vehículos completada",
                                searchWorkOrders:
                                  "Búsqueda de órdenes completada",
                                searchServices:
                                  "Búsqueda de servicios completada",
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
                                registerWorkOrderPayment:
                                  "Pago registrado exitosamente",
                                attachPhotoToChecklistItem:
                                  "Foto asociada al checklist exitosamente",
                                assignWorkOrderTechnician:
                                  "Técnico asignado exitosamente",
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
                        {message.parts.some((p) => p.type === "text" && p.text?.trim()) && (
                          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                            {isSpeechSynthesisSupported && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleSpeak(message.id, message.parts)}
                                    className="h-6 w-6 rounded-full hover:bg-background/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 text-muted-foreground"
                                    aria-label={
                                      speakingMessageId === message.id
                                        ? "Detener lectura en voz alta"
                                        : "Escuchar mensaje en voz alta"
                                    }
                                  >
                                    {speakingMessageId === message.id ? (
                                      <VolumeX className="h-3 w-3 text-red-500 animate-pulse" />
                                    ) : (
                                      <Volume2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="bg-foreground text-background"
                                >
                                  {speakingMessageId === message.id
                                    ? "Detener (Alt+S)"
                                    : "Escuchar (Alt+S)"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const textToCopy = message.parts
                                      .filter((p) => p.type === "text")
                                      .map((p) => p.text)
                                      .join("\n");
                                    handleCopyMessage(message.id, textToCopy);
                                  }}
                                  className="h-6 w-6 rounded-full hover:bg-background/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 text-muted-foreground"
                                  aria-label={
                                    copiedMessageId === message.id
                                      ? "Copiado al portapapeles"
                                      : "Copiar mensaje al portapapeles"
                                  }
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-3 w-3 text-emerald-700" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-foreground text-background"
                              >
                                {copiedMessageId === message.id ? "¡Copiado!" : "Copiar"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                        </>
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
              {friendlyErrorMessage && (
                <div className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-2 max-w-[85%]">
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-700 mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="text-sm text-red-700 font-medium leading-normal">
                        {friendlyErrorMessage}
                      </span>
                    </div>
                    {!isSubmitting && (
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            retryLastMessage();
                          }}
                          className="h-7 text-xs font-semibold bg-white border-red-200 text-red-700 hover:bg-red-100/50 hover:text-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 flex items-center gap-1.5 transition-all shadow-xs"
                          aria-label="Reintentar enviar el último mensaje"
                        >
                          <RotateCw className="h-3 w-3 shrink-0" />
                          Reintentar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {showScrollToBottom && (
              <Button
                type="button"
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="absolute bottom-4 right-4 rounded-full shadow-lg z-40 bg-background text-foreground hover:bg-muted border p-2 h-9 w-9 flex items-center justify-center transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1"
                aria-label="Desplazarse al final"
              >
                <ArrowDown className="h-4.5 w-4.5" />
                {messages.length > lastSeenMessageCount && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3" data-testid="unread-badge">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Compact Follow-up Suggestions Row */}
          {messages.length > 0 && !isSubmitting && (
            <div className="px-4 py-2 border-t bg-muted/20 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth shrink-0">
              {followUpSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(s.text)}
                  className="whitespace-nowrap text-[11px] font-medium bg-background hover:bg-primary/5 hover:text-primary border hover:border-primary/20 rounded-full px-2.5 py-1 transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 text-muted-foreground shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="p-4 border-t">
            {attachedFile && (
              <div className="mb-2 flex flex-col gap-1.5 p-2 bg-muted rounded-md">
                <div className="flex items-center gap-3 justify-between w-full">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {attachedPreviewUrl ? (
                      <div className="relative w-10 h-10 rounded-md border bg-background overflow-hidden flex-shrink-0 shadow-sm">
                        <img
                          src={attachedPreviewUrl}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md border bg-background flex items-center justify-center flex-shrink-0 shadow-sm text-[10px] font-mono font-bold text-primary bg-primary/5 uppercase">
                        {attachedFile.name.split(".").pop()?.slice(0, 4).toUpperCase() || "FILE"}
                      </div>
                    )}
                    <span className="text-sm truncate font-medium text-foreground">
                      {attachedFile.name}
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-background/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-full p-0.5 shrink-0"
                        onClick={handleRemoveFile}
                        aria-label="Quitar archivo adjunto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-foreground text-background"
                    >
                      Quitar archivo adjunto
                    </TooltipContent>
                  </Tooltip>
                </div>
                {/* Contextual Action Buttons */}
                <div className="flex flex-wrap gap-1.5 justify-start">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleProcessInvoiceShortcut}
                    disabled={isSubmitting}
                    className="text-xs bg-background hover:bg-background/80 border text-primary font-medium h-7 px-2.5 flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Procesar como Factura de Compra
                  </Button>
                  {detectedBarcode && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleBarcodeSearchShortcut}
                      disabled={isSubmitting}
                      className="text-xs bg-background hover:bg-background/80 border text-primary font-medium h-7 px-2.5 flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      Buscar &quot;{detectedBarcode.value}&quot;
                    </Button>
                  )}
                </div>
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
                  className="bg-foreground text-background"
                >
                  Adjuntar archivos
                </TooltipContent>
              </Tooltip>
              <Textarea
                ref={inputRef}
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                placeholder={
                  isListening
                    ? "Escuchando... Hablá ahora"
                    : `Escribe tu mensaje... (${shortcutLabel} para cerrar)`
                }
                rows={1}
                className={`flex-1 min-h-[40px] max-h-32 py-2.5 resize-none transition-all ${
                  isListening
                    ? "border-red-500 focus-visible:ring-red-500 bg-red-50/10 focus-visible:ring-offset-0 placeholder:text-red-400"
                    : ""
                }`}
                disabled={isSubmitting}
              />
              {isSpeechSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleListening}
                      disabled={isSubmitting}
                      className={`h-10 w-10 p-0 transition-colors ${
                        isListening
                          ? "text-red-700 hover:text-red-800 hover:bg-red-100 bg-red-50 border border-red-200 animate-pulse"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label={
                        isListening ? "Detener dictado por voz (Alt+V)" : "Dictar por voz (Alt+V)"
                      }
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-foreground text-background"
                  >
                    {isListening ? "Detener dictado (Alt+V)" : "Dictar por voz (Alt+V)"}
                  </TooltipContent>
                </Tooltip>
              )}
              {isSubmitting ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-full p-0.5"
                      onClick={() => stop()}
                      aria-label="Detener respuesta de Nitro"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-foreground text-background"
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
                    className="bg-foreground text-background"
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
