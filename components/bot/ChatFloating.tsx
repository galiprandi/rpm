'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Plus, FileImage, Camera as CameraIcon, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

export function ChatFloating({ isOpen: controlledIsOpen, onOpenChange }: { isOpen?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const isMobile = useIsMobile();
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().includes('MAC');
  const shortcutLabel = isMac ? '⌘Shift+M' : 'Ctrl+Shift+M';
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
   
  // Manual API call since useChat hook doesn't provide handleSubmit due to v6/v7 incompatibility
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = localInput?.trim();
    
    if (!messageText && !attachedFile) return;
    
    setIsSubmitting(true);
    setError(null);
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: messageText,
      id: Date.now().toString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: { role: 'ADMIN', url: { path: '/', search: '', hash: '' } },
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      let assistantMessage = '';
      const decoder = new TextDecoder();
      
      // Add empty assistant message placeholder
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        id: (Date.now() + 1).toString(),
      }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        
        // Update assistant message in real-time
        setChatMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = assistantMessage;
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err as Error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error al enviar mensaje. Por favor intenta nuevamente.',
        id: Date.now().toString(),
      }]);
    } finally {
      setIsSubmitting(false);
      setLocalInput('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsOpen(!isOpen);
        return;
      }

      if (!isOpen) return;

      // Escape to close chat
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      fileInputRef.current.value = '';
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
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`${
          isMobile 
            ? 'fixed inset-0 w-full h-full rounded-none' 
            : `fixed bottom-24 right-6 bg-background border rounded-lg shadow-xl z-50 flex flex-col transition-all duration-300 ${
                isExpanded 
                  ? 'w-[600px] h-[700px]' 
                  : 'w-[500px] h-[600px]'
              }`
        } bg-background z-50 flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Nitro</h3>
              <p className="text-sm text-muted-foreground">Asistente de operaciones</p>
            </div>
            <div className="flex items-center gap-1">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Reducir" : "Expandir"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>¡Hola! Soy Nitro, tu asistente virtual.</p>
                  <p className="text-sm mt-2">¿En qué puedo ayudarte hoy?</p>
                </div>
              )}
              {chatMessages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {/* Loading indicator */}
              {isSubmitting && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Nitro está pensando...</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      {error.message?.includes('Failed to parse stream') 
                        ? 'Hubo un problema al procesar la respuesta. Por favor intenta nuevamente con un mensaje más simple.'
                        : error.message?.includes('quota') || error.message?.includes('limit')
                        ? 'La quota diaria de la API de Gemini está excedida (20 req/día). Por favor intenta más tarde.'
                        : error.message || 'Ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.'}
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
                <span className="text-sm truncate flex-1">{attachedFile.name}</span>
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
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Adjuntar archivo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
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
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsSubmitting(false)}>
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="icon" disabled={!localInput?.trim() && !attachedFile}>
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
