import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChatFloating } from "./ChatFloating";
import React from "react";

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
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/adm/dashboard",
}));

// Mock @ai-sdk/react useChat hook dynamically
const mockSendMessage = vi.fn();
const mockStop = vi.fn();
const mockSetMessages = vi.fn();
const mockClearError = vi.fn();
let mockMessages: any[] = [];

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: mockMessages,
    sendMessage: mockSendMessage,
    status: "idle",
    error: null,
    stop: mockStop,
    setMessages: mockSetMessages,
    clearError: mockClearError,
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
    mockMessages = [];
    // Clear global speech recognition mocks
    if (typeof window !== "undefined") {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
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
    expect(screen.getByRole("button", { name: /haz clic de nuevo para confirmar/i })).toBeInTheDocument();

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
});
