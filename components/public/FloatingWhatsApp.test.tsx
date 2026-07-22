import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingWhatsApp } from './FloatingWhatsApp';
import { TooltipProvider } from '@/components/ui/tooltip';
import React from 'react';

// Mock framer-motion to render elements statically in tests
vi.mock('framer-motion', () => {
  const ReactObj = require('react');
  return {
    motion: {
      div: ReactObj.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock window.open
const mockOpen = vi.fn();
vi.stubGlobal('open', mockOpen);

describe('FloatingWhatsApp', () => {
  beforeEach(() => {
    mockOpen.mockClear();
    // Reset document body between tests
    document.body.innerHTML = '';
  });

  const renderComponent = () => {
    return render(
      <TooltipProvider>
        <FloatingWhatsApp />
      </TooltipProvider>
    );
  };

  it('renders only the toggle button initially', () => {
    renderComponent();

    // Toggle button should exist with appropriate aria-label
    const toggleButton = screen.getByRole('button', { name: /abrir chat de whatsapp/i });
    expect(toggleButton).toBeInTheDocument();

    // The chat dialog/content should NOT be in the document
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the widget when toggle button is clicked', () => {
    renderComponent();

    const toggleButton = screen.getByRole('button', { name: /abrir chat de whatsapp/i });
    fireEvent.click(toggleButton);

    // Dialog should now be open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Sofia profile name heading, welcome bubble, and quick questions should be visible
    expect(screen.getByRole('heading', { name: 'Sofi' })).toBeInTheDocument();
    expect(screen.getByText(/¿En qué podemos ayudarte hoy?/i)).toBeInTheDocument();
  });

  it('populates the custom message textarea when a quick action chip is clicked', () => {
    renderComponent();

    // Open widget
    const toggleButton = screen.getByRole('button', { name: /abrir chat de whatsapp/i });
    fireEvent.click(toggleButton);

    // Find the chip
    const chip = screen.getByRole('button', { name: /Reservar Turno/i });
    fireEvent.click(chip);

    // Message field should be populated with the specific template
    const textarea = screen.getByRole('textbox', { name: /tu mensaje de consulta/i }) as HTMLTextAreaElement;
    expect(textarea.value).toBe('¡Hola! Me gustaría coordinar un turno para mi vehículo.');
  });

  it('sends the custom message when clicking "Iniciar Conversación"', () => {
    renderComponent();

    // Open widget
    fireEvent.click(screen.getByRole('button', { name: /abrir chat de whatsapp/i }));

    // Enter some text
    const textarea = screen.getByRole('textbox', { name: /tu mensaje de consulta/i });
    fireEvent.change(textarea, { target: { value: 'Mi consulta personalizada' } });

    // Click send
    const sendButton = screen.getByRole('button', { name: /enviar consulta por whatsapp/i });
    fireEvent.click(sendButton);

    // window.open should be called with correct URL parameters
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('text=Mi%20consulta%20personalizada'),
      '_blank'
    );

    // Dialog should close after sending
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the widget when the Escape key is pressed', () => {
    renderComponent();

    // Open widget
    fireEvent.click(screen.getByRole('button', { name: /abrir chat de whatsapp/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape key
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    // Dialog should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the widget when the close button inside header is clicked', () => {
    renderComponent();

    // Open widget
    fireEvent.click(screen.getByRole('button', { name: /abrir chat de whatsapp/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click close button inside header
    fireEvent.click(screen.getByRole('button', { name: /cerrar chat/i }));

    // Dialog should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the widget when clicking outside of it', () => {
    renderComponent();

    // Open widget
    fireEvent.click(screen.getByRole('button', { name: /abrir chat de whatsapp/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Simulate clicking outside on the document body
    fireEvent.mouseDown(document.body);

    // Dialog should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
