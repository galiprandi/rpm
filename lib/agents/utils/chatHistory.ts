// In-memory message storage for chat history
// TODO: migrate to DB (see specs/bot-tools/get-product.md)

import logger from './logger';

const chatHistory = new Map<string, string[]>();

export interface ChatMessage {
  role: string;
  parts?: Array<{
    type: string;
    text?: string;
    output?: string | unknown;
    state?: string;
    [key: string]: unknown;
  }>;
}

export interface SaveChatOptions {
  chatId: string;
  messages: ChatMessage[];
}

/**
 * Load conversation history from storage
 * @param id - Chat ID to load
 * @returns Array of text messages
 */
export async function loadChat(id: string): Promise<string[]> {
  const messages = chatHistory.get(id) || [];
  logger.debug({ chatId: id, messageCount: messages.length }, 'Loaded chat history');
  return messages;
}

/**
 * Save conversation history to storage
 * Extracts plain text from UI messages (user text + tool outputs)
 * @param options - Chat ID and UI messages to save
 */
export async function saveChat({ chatId, messages }: SaveChatOptions): Promise<void> {
  logger.debug({ chatId, messageCount: messages.length }, 'Saving chat history');
  
  // Extract plain text from messages (user text + tool outputs)
  const newTextMessages: string[] = [];
  for (const msg of messages) {
    if (msg.role === 'user') {
      const textPart = msg.parts?.find((p) => p.type === 'text');
      if (textPart?.text) {
        newTextMessages.push(`User: ${textPart.text}`);
      }
    } else if (msg.role === 'assistant') {
      // Extract tool outputs from all tools
      const toolOutputs = msg.parts?.filter((p) => 
        p.type.startsWith('tool-') && p.state === 'output-available'
      );
      for (const toolOutput of toolOutputs || []) {
        if (toolOutput.output) {
          newTextMessages.push(`Assistant: ${toolOutput.output}`);
        }
      }
    }
  }
  
  // Append to existing history instead of overwriting
  const existingHistory = chatHistory.get(chatId) || [];
  const updatedHistory = [...existingHistory, ...newTextMessages];
  
  // Limit to last 10 messages to prevent memory issues
  const limitedHistory = updatedHistory.slice(-10);
  
  logger.debug({ extracted: newTextMessages.length, total: limitedHistory.length }, 'Extracted text messages');
  chatHistory.set(chatId, limitedHistory);
}

/**
 * Clear chat history for a specific chat
 * @param id - Chat ID to clear
 */
export async function clearChat(id: string): Promise<void> {
  chatHistory.delete(id);
  logger.debug({ chatId: id }, 'Cleared chat history');
}

/**
 * Get all chat IDs with history
 * @returns Array of chat IDs
 */
export async function getAllChatIds(): Promise<string[]> {
  return Array.from(chatHistory.keys());
}

/**
 * Clear all chat history (useful for testing)
 */
export async function clearAllHistory(): Promise<void> {
  chatHistory.clear();
  logger.debug('Cleared all chat history');
}
