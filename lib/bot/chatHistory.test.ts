import { describe, it, expect, beforeEach } from 'vitest';
import { loadChat, saveChat, clearChat, getAllChatIds, clearAllHistory, type ChatMessage } from '../agents/utils/chatHistory';

describe('chatHistory', () => {
  beforeEach(() => {
    clearAllHistory();
  });

  describe('loadChat', () => {
    it('should return empty array for non-existent chat', async () => {
      const messages = await loadChat('non-existent');
      expect(messages).toEqual([]);
    });

    it('should return saved messages for existing chat', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toHaveLength(1);
      expect(messages[0]).toBe('User: hello');
    });
  });

  describe('saveChat', () => {
    it('should extract user text messages', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [
          {
            role: 'user',
            parts: [{ type: 'text', text: 'hello world' }],
          },
        ],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toEqual(['User: hello world']);
    });

    it('should extract assistant tool outputs', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [
          {
            role: 'assistant',
            parts: [
              {
                type: 'tool-get_product',
                state: 'output-available',
                output: 'Found 2 products',
              },
            ],
          },
        ],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toEqual(['Assistant: Found 2 products']);
    });

    it('should extract both user and assistant messages', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [
          {
            role: 'user',
            parts: [{ type: 'text', text: 'show me products' }],
          },
          {
            role: 'assistant',
            parts: [
              {
                type: 'tool-get_product',
                state: 'output-available',
                output: 'Found 2 products',
              },
            ],
          },
        ],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toEqual(['User: show me products', 'Assistant: Found 2 products']);
    });

    it('should handle multiple tool outputs from assistant', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [
          {
            role: 'assistant',
            parts: [
              {
                type: 'tool-get_product',
                state: 'output-available',
                output: 'Product 1',
              },
              {
                type: 'tool-search_products',
                state: 'output-available',
                output: 'Product 2',
              },
            ],
          },
        ],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toEqual(['Assistant: Product 1', 'Assistant: Product 2']);
    });

    it('should skip tool outputs that are not output-available', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [
          {
            role: 'assistant',
            parts: [
              {
                type: 'tool-get_product',
                state: 'input-available',
                output: 'Should not be saved',
              },
              {
                type: 'tool-get_product',
                state: 'output-available',
                output: 'Should be saved',
              },
            ],
          },
        ],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toEqual(['Assistant: Should be saved']);
    });

    it('should append to existing chat history', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'first message' }] },
        ],
      });
      await saveChat({
        chatId: 'test-chat',
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'second message' }] },
        ],
      });
      const messages = await loadChat('test-chat');
      expect(messages).toEqual(['User: first message', 'User: second message']);
    });
  });

  describe('clearChat', () => {
    it('should clear specific chat history', async () => {
      await saveChat({
        chatId: 'test-chat',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      });
      await clearChat('test-chat');
      const messages = await loadChat('test-chat');
      expect(messages).toEqual([]);
    });

    it('should not affect other chats', async () => {
      await saveChat({
        chatId: 'chat-1',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'message 1' }] }],
      });
      await saveChat({
        chatId: 'chat-2',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'message 2' }] }],
      });
      await clearChat('chat-1');
      const messages1 = await loadChat('chat-1');
      const messages2 = await loadChat('chat-2');
      expect(messages1).toEqual([]);
      expect(messages2).toEqual(['User: message 2']);
    });
  });

  describe('getAllChatIds', () => {
    it('should return empty array when no chats exist', async () => {
      const ids = await getAllChatIds();
      expect(ids).toEqual([]);
    });

    it('should return all chat IDs', async () => {
      await saveChat({
        chatId: 'chat-1',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'message 1' }] }],
      });
      await saveChat({
        chatId: 'chat-2',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'message 2' }] }],
      });
      const ids = await getAllChatIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('chat-1');
      expect(ids).toContain('chat-2');
    });
  });

  describe('clearAllHistory', () => {
    it('should clear all chat history', async () => {
      await saveChat({
        chatId: 'chat-1',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'message 1' }] }],
      });
      await saveChat({
        chatId: 'chat-2',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'message 2' }] }],
      });
      await clearAllHistory();
      const ids = await getAllChatIds();
      expect(ids).toEqual([]);
    });
  });

  describe('message limit (10 messages)', () => {
    it('should handle up to 10 messages', async () => {
      const messages: ChatMessage[] = [];
      for (let i = 1; i <= 10; i++) {
        messages.push({
          role: 'user',
          parts: [{ type: 'text', text: `message ${i}` }],
        });
      }
      await saveChat({
        chatId: 'test-chat',
        messages,
      });
      const loaded = await loadChat('test-chat');
      expect(loaded).toHaveLength(10);
      expect(loaded[0]).toBe('User: message 1');
      expect(loaded[9]).toBe('User: message 10');
    });

    it('should limit to 10 messages when more than 10 are saved', async () => {
      const messages: ChatMessage[] = [];
      for (let i = 1; i <= 15; i++) {
        messages.push({
          role: 'user',
          parts: [{ type: 'text', text: `message ${i}` }],
        });
      }
      await saveChat({
        chatId: 'test-chat',
        messages,
      });
      const loaded = await loadChat('test-chat');
      expect(loaded).toHaveLength(10);
      // Should keep the last 10 messages (6-15)
      expect(loaded[0]).toBe('User: message 6');
      expect(loaded[9]).toBe('User: message 15');
    });
  });
});
