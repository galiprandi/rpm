import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChatFloating } from "./ChatFloating";
import React from "react";

// Mock URL createObjectURL and revokeObjectURL for memory management testing
const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
const mockRevokeObjectURL = vi.fn();

if (typeof window !== "undefined") {
  window.URL.createObjectURL = mockCreateObjectURL;
  window.URL.revokeObjectURL = mockRevokeObjectURL;
}

// Mock navigator.clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
if (typeof navigator !== "undefined") {
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: mockWriteText,
    },
    writable: true,
  });
}

// Mock scrollIntoView for HTMLElement in JSDOM
HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock window.matchMedia for JSDOM
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockPathname = "/adm/dashboard";
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname,
}));

// Mock @ai-sdk/react useChat hook dynamically
const mockSendMessage = vi.fn();
const mockStop = vi.fn();
const mockSetMessages = vi.fn();
const mockClearError = vi.fn();
const mockReload = vi.fn();
let mockMessages: any[] = [];
let mockError: any = null;

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: mockMessages,
    sendMessage: mockSendMessage,
    status: "idle",
    error: mockError,
    stop: mockStop,
    setMessages: mockSetMessages,
    clearError: mockClearError,
    reload: mockReload,
  }),
}));

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: "test-user-id", name: "Test User", email: "test@user.com", role: "ADMIN" },
      },
    }),
  },
}));

// Mock Radix tooltip to render children inline
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ChatFloating Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    mockWriteText.mockClear();
    mockMessages = [];
    mockError = null;
    mockPathname = "/adm/dashboard";
    // Clear global speech recognition mocks
    if (typeof window !== "undefined") {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).BarcodeDetector;
    }
  });

  it("renders the toggle button on load when closed", () => {
    render(<ChatFloating />);
    const toggleBtn = screen.getByRole("button", { name: /abrir asistente virtual/i });
    expect(toggleBtn).toBeInTheDocument();
    // Chat window should not be open
    expect(screen.queryByPlaceholderText(/Escribe tu mensaje.../i)).not.toBeInTheDocument();
  });

  it("opens the chat panel when clicking the toggle button", () => {
    render(<ChatFloating />);
    const toggleBtn = screen.getByRole("button", { name: /abrir asistente virtual/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText("Nitro")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe tu mensaje.../i)).toBeInTheDocument();
  });

  it("displays suggestion chips when message list is empty", () => {
    render(<ChatFloating isOpen={true} />);
    expect(screen.getByText("¡Hola! Soy Nitro, tu asistente virtual.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /📦 Consultar Stock/i })).toBeInTheDocument();
  });

  it("triggers sendMessage when suggestion chip is clicked", () => {
    render(<ChatFloating isOpen={true} />);
    const suggestionBtn = screen.getByRole("button", { name: /📦 Consultar Stock/i });
    fireEvent.click(suggestionBtn);
    expect(mockSendMessage).toHaveBeenCalledWith({ text: "¿Hay stock de luces LED?" });
  });

  it("handles double-click clear conversation confirmation flow", () => {
    mockMessages = [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }];

    render(<ChatFloating isOpen={true} />);
    const clearBtn = screen.getByRole("button", { name: /limpiar conversación/i });
    expect(clearBtn).toBeInTheDocument();

    // First click: enters confirmation mode
    fireEvent.click(clearBtn);
    expect(screen.getByRole("button", { name: /haz clic de nuevo o presiona Alt\+C para confirmar/i })).toBeInTheDocument();

    // Second click: completes clear
    fireEvent.click(clearBtn);
    expect(mockStop).toHaveBeenCalled();
    expect(mockSetMessages).toHaveBeenCalledWith([]);
  });

  it("toggles voice recognition and displays correct listening state when SpeechRecognition is supported", async () => {
    const mockStart = vi.fn();
    const mockStopRecognition = vi.fn();

    // Mock global SpeechRecognition
    const MockSpeechRecognition = vi.fn().mockImplementation(function(this: any) {
      const recognition = {
        start: function(this: any) {
          mockStart();
          if (this.onstart) {
            act(() => {
              this.onstart();
            });
          }
        },
        stop: function(this: any) {
          mockStopRecognition();
          if (this.onend) {
            act(() => {
              this.onend();
            });
          }
        },
        continuous: false,
        lang: "es-AR",
        interimResults: false,
        onstart: null as any,
        onend: null as any,
        onerror: null as any,
        onresult: null as any,
      };
      return recognition;
    });

    (window as any).SpeechRecognition = MockSpeechRecognition;

    render(<ChatFloating isOpen={true} />);
    const micBtn = screen.getByRole("button", { name: /dictar por voz/i });
    expect(micBtn).toBeInTheDocument();

    // Click mic to start listening
    fireEvent.click(micBtn);

    // Input placeholder should change and mic button should change label to stop dictation
    expect(screen.getByPlaceholderText("Escuchando... Hablá ahora")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /detener dictado por voz/i })).toBeInTheDocument();
    expect(mockStart).toHaveBeenCalled();

    // Click again to stop listening
    fireEvent.click(screen.getByRole("button", { name: /detener dictado por voz/i }));
    expect(mockStopRecognition).toHaveBeenCalled();
  });

  it("does not render mic button when SpeechRecognition is unsupported", () => {
    // Ensure SpeechRecognition globals are missing
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    render(<ChatFloating isOpen={true} />);
    expect(screen.queryByRole("button", { name: /dictar por voz/i })).not.toBeInTheDocument();
  });

  it("shows the 'Procesar como Factura de Compra' button and triggers shortcut when a file is uploaded", async () => {
    const { container } = render(<ChatFloating isOpen={true} />);

    // Find the file input element (the first file input is for regular attachments)
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const file = new File(["dummy content"], "invoice.pdf", { type: "application/pdf" });

    // Simulate uploading a file
    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    // Check if the file name is rendered and the shortcut button is visible
    expect(screen.getByText(/invoice.pdf/i)).toBeInTheDocument();
    const shortcutBtn = screen.getByRole("button", { name: /Procesar como Factura de Compra/i });
    expect(shortcutBtn).toBeInTheDocument();

    // Click the shortcut button
    await act(async () => {
      fireEvent.click(shortcutBtn);
    });

    // It should call sendMessage with the correct structure
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Procesar factura de compra",
        files: expect.arrayContaining([
          expect.objectContaining({
            type: "file",
            mediaType: "application/pdf",
          })
        ])
      })
    );

    // The file preview should be cleared after clicking the shortcut
    expect(screen.queryByText(/invoice.pdf/i)).not.toBeInTheDocument();
  });

  it("detects barcode/QR code on attached image and shows/triggers search action button", async () => {
    const mockDetect = vi.fn().mockResolvedValue([{ rawValue: "7791234567890", format: "ean_13" }]);
    const MockBarcodeDetector = vi.fn().mockImplementation(function() {
      return { detect: mockDetect };
    });
    (window as any).BarcodeDetector = MockBarcodeDetector;

    // Mock Image object to trigger load automatically in tests
    const originalImage = window.Image;
    const MockImage = vi.fn().mockImplementation(function() {
      const img = {
        src: "",
        onload: null as any,
        onerror: null as any,
      };
      // Automatically call onload when src is set
      setTimeout(() => {
        if (img.onload) img.onload();
      }, 0);
      return img;
    });
    window.Image = MockImage as any;

    const { container } = render(<ChatFloating isOpen={true} />);

    // Find the first file input
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy"], "barcode.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    // Wait for the barcode detection to trigger and render the button
    const searchBtn = await screen.findByRole("button", { name: /Buscar "7791234567890"/i });
    expect(searchBtn).toBeInTheDocument();

    // Click search button
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    // It should call sendMessage with "Buscar 7791234567890"
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Buscar 7791234567890",
      })
    );

    // It should clear the file preview and barcode state
    expect(screen.queryByText(/barcode.png/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Buscar "7791234567890"/i })).not.toBeInTheDocument();

    // Restore Image
    window.Image = originalImage;
  });

  it("renders contextual suggestion chips for different admin routes", () => {
    // 1. Cash route
    mockPathname = "/adm/cash";
    const { rerender } = render(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /💸 Movimiento Caja/i })).toBeInTheDocument();

    // 2. Purchase Vouchers route
    mockPathname = "/adm/purchase-vouchers";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /🧾 Procesar Factura/i })).toBeInTheDocument();

    // 3. Suppliers route
    mockPathname = "/adm/suppliers";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /👥 Buscar Proveedores/i })).toBeInTheDocument();

    // 4. Settings route
    mockPathname = "/adm/settings";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /⚙️ Roles y Permisos/i })).toBeInTheDocument();

    // 5. Reports route
    mockPathname = "/adm/reports";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /📊 Resumen diario/i })).toBeInTheDocument();

    // 6. Services route
    mockPathname = "/adm/services";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /🛠️ Buscar Servicios/i })).toBeInTheDocument();

    // 7. Direct Sales route
    mockPathname = "/adm/direct-sales";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /📝 Nueva Venta Directa/i })).toBeInTheDocument();

    // 8. Categories route
    mockPathname = "/adm/categories";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /📦 Buscar Productos/i })).toBeInTheDocument();

    // 9. Users route
    mockPathname = "/adm/users";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /👥 Buscar Técnicos/i })).toBeInTheDocument();
  });

  it("renders a thumbnail image preview for attached image files", async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-preview-url");
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    const { container } = render(<ChatFloating isOpen={true} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy image"], "test-image.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    // Check that createObjectURL was called with the file
    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);

    // Verify the image thumbnail preview is displayed
    const previewImg = screen.getByAltText("Previsualización");
    expect(previewImg).toBeInTheDocument();
    expect(previewImg).toHaveAttribute("src", "blob:http://localhost/mock-preview-url");

    // Click to remove file
    const removeBtn = screen.getByRole("button", { name: /Quitar archivo adjunto/i });
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    // Verify preview and file are cleared, and revokeObjectURL was called
    expect(screen.queryByAltText("Previsualización")).not.toBeInTheDocument();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-preview-url");
  });

  it("renders a capitalized file extension fallback badge for attached non-image files", async () => {
    const { container } = render(<ChatFloating isOpen={true} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy pdf"], "document.pdf", { type: "application/pdf" });

    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    // Check that fallback extension badge displays 'PDF'
    const extensionBadge = screen.getByText("PDF");
    expect(extensionBadge).toBeInTheDocument();
    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.queryByAltText("Previsualización")).not.toBeInTheDocument();
  });

  it("automatically clears attached file state and revokes url when chat isOpen is set to false", async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-preview-url-close");
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    const { container, rerender } = render(<ChatFloating isOpen={true} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(["dummy image"], "close-test.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    expect(screen.getByAltText("Previsualización")).toBeInTheDocument();

    // Close the chat
    rerender(<ChatFloating isOpen={false} />);

    // Verify revokeObjectURL was called
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-preview-url-close");
  });

  it("triggers voice dictation via Alt+V keyboard shortcut", async () => {
    const mockStart = vi.fn();
    const mockStop = vi.fn();

    const MockSpeechRecognition = vi.fn().mockImplementation(function(this: any) {
      const recognition = {
        start: function(this: any) {
          mockStart();
          if (this.onstart) {
            act(() => {
              this.onstart();
            });
          }
        },
        stop: function(this: any) {
          mockStop();
          if (this.onend) {
            act(() => {
              this.onend();
            });
          }
        },
        continuous: false,
        lang: "es-AR",
        interimResults: false,
        onstart: null as any,
        onend: null as any,
        onerror: null as any,
        onresult: null as any,
      };
      return recognition;
    });

    (window as any).SpeechRecognition = MockSpeechRecognition;

    render(<ChatFloating isOpen={true} />);

    // Simulate Alt+V key press
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, key: "v" }));
    });

    // Check placeholder changes to listening state
    expect(screen.getByPlaceholderText("Escuchando... Hablá ahora")).toBeInTheDocument();
    expect(mockStart).toHaveBeenCalled();

    // Simulate Alt+V key press again to toggle off
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, key: "v" }));
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it("handles double-press Alt+C clear conversation confirmation flow via keyboard shortcut", async () => {
    mockMessages = [{ id: "1", role: "user", parts: [{ type: "text", text: "testing clear shortcut" }] }];

    render(<ChatFloating isOpen={true} />);

    // First Alt+C press should enter confirmation mode
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, key: "c" }));
    });

    // Verify confirmation is shown
    expect(screen.getByRole("button", { name: /haz clic de nuevo o presiona Alt\+C para confirmar/i })).toBeInTheDocument();

    // Second Alt+C press should finalize clear
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, key: "c" }));
    });

    expect(mockStop).toHaveBeenCalled();
    expect(mockSetMessages).toHaveBeenCalledWith([]);
  });

  it("displays retry button when there is an error, and clicking it invokes reload and clearError", async () => {
    mockError = new Error("Failed to fetch");

    render(<ChatFloating isOpen={true} />);

    // Check if the error message is displayed
    expect(screen.getByText("No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.")).toBeInTheDocument();

    // Verify retry button is rendered
    const retryBtn = screen.getByRole("button", { name: /reintentar enviar el último mensaje/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry button
    fireEvent.click(retryBtn);

    expect(mockClearError).toHaveBeenCalled();
    expect(mockReload).toHaveBeenCalled();
  });

  it("renders compact follow-up suggestion pills only when messages are present and chatbot is not submitting", () => {
    // 1. Empty conversation - should not render follow-up pills
    mockMessages = [];
    const { rerender } = render(<ChatFloating isOpen={true} />);
    expect(screen.queryByRole("button", { name: /^📦 Stock$/i })).not.toBeInTheDocument();

    // 2. Active conversation - should render follow-up pills
    mockMessages = [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }];
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^📦 Stock$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^🔧 OTs hoy$/i })).toBeInTheDocument();
  });

  it("triggers sendMessage when a compact follow-up pill is clicked", () => {
    mockMessages = [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }];
    render(<ChatFloating isOpen={true} />);

    const stockPill = screen.getByRole("button", { name: /^📦 Stock$/i });
    fireEvent.click(stockPill);

    expect(mockSendMessage).toHaveBeenCalledWith({ text: "¿Hay stock de luces LED?" });
  });

  it("adjusts follow-up suggestion labels dynamically based on pathname", () => {
    mockMessages = [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }];
    mockPathname = "/adm/cash";

    const { rerender } = render(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^💸 Mov\. Caja$/i })).toBeInTheDocument();

    mockPathname = "/adm/work-orders";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^🔧 Nueva OT$/i })).toBeInTheDocument();

    mockPathname = "/adm/services";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^🛠️ Servicios$/i })).toBeInTheDocument();

    mockPathname = "/adm/direct-sales";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^📝 Venta Directa$/i })).toBeInTheDocument();

    mockPathname = "/adm/categories";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^📦 Productos$/i })).toBeInTheDocument();

    mockPathname = "/adm/users";
    rerender(<ChatFloating isOpen={true} />);
    expect(screen.getByRole("button", { name: /^👥 Técnicos$/i })).toBeInTheDocument();
  });

  it("automatically adjusts textarea height dynamically when input text changes", async () => {
    render(<ChatFloating isOpen={true} />);
    const textarea = screen.getByPlaceholderText(/Escribe tu mensaje.../i) as HTMLTextAreaElement;

    const heightSpy = vi.spyOn(textarea.style, "height", "set");

    await act(async () => {
      fireEvent.change(textarea, { target: { value: "A new long text value" } });
    });

    expect(heightSpy).toHaveBeenCalled();
  });

  it("submits the form when Enter is pressed without Shift on the textarea, and does not submit when Shift+Enter is pressed", async () => {
    render(<ChatFloating isOpen={true} />);
    const textarea = screen.getByPlaceholderText(/Escribe tu mensaje.../i);

    // 1. Press Shift+Enter - should NOT trigger sendMessage
    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    });
    expect(mockSendMessage).not.toHaveBeenCalled();

    // 2. Type some text and press Enter without Shift - should trigger sendMessage
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "Test prompt message" } });
    });
    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    });
    expect(mockSendMessage).toHaveBeenCalledWith({ text: "Test prompt message" });
  });

  describe("Drag and Drop File Attachment", () => {
    it("renders drag overlay on dragEnter and hides on dragLeave", async () => {
      render(<ChatFloating isOpen={true} />);

      const chatContainer = screen.getByText("Nitro").closest(".flex-col")!;
      expect(screen.queryByTestId("drag-overlay")).not.toBeInTheDocument();

      // Trigger dragEnter
      await act(async () => {
        fireEvent.dragEnter(chatContainer, {
          dataTransfer: {
            types: ["Files"],
          },
        });
      });

      expect(screen.getByTestId("drag-overlay")).toBeInTheDocument();
      expect(screen.getByText("Soltá el archivo aquí")).toBeInTheDocument();

      // Trigger dragLeave
      await act(async () => {
        fireEvent.dragLeave(chatContainer);
      });

      expect(screen.queryByTestId("drag-overlay")).not.toBeInTheDocument();
    });

    it("attaches dropped file on drop event", async () => {
      render(<ChatFloating isOpen={true} />);

      const chatContainer = screen.getByText("Nitro").closest(".flex-col")!;

      // Create a mock File
      const file = new File(["dummy content"], "invoice.pdf", { type: "application/pdf" });

      // Trigger dragEnter to show overlay
      await act(async () => {
        fireEvent.dragEnter(chatContainer, {
          dataTransfer: {
            types: ["Files"],
          },
        });
      });
      expect(screen.getByTestId("drag-overlay")).toBeInTheDocument();

      // Trigger drop
      await act(async () => {
        fireEvent.drop(chatContainer, {
          dataTransfer: {
            files: [file],
          },
        });
      });

      // Overlay should be gone
      expect(screen.queryByTestId("drag-overlay")).not.toBeInTheDocument();

      // The file name should be rendered in the attached files list
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument(); // fallback badge
    });
  });
});
