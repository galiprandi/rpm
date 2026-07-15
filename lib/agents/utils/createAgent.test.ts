import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent } from './createAgent';
import { tool } from 'ai';
import { z } from 'zod';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('createAgent', () => {
  const testInstructionsPath = join(process.cwd(), 'test-instructions.md');

  beforeEach(() => {
    // Clean up test file if exists
    if (existsSync(testInstructionsPath)) {
      unlinkSync(testInstructionsPath);
    }
  });

  it('should create agent with string instructions', () => {
    const mockTool = tool({
      description: 'Test tool',
      inputSchema: z.object({ query: z.string() }),
      execute: async () => 'test result',
    });

    const agent = createAgent({
      instructions: 'You are a test agent',
      tools: { testTool: mockTool },
    });

    expect(agent).toBeDefined();
  });

  it('should create agent with instructions from .md file', () => {
    const testContent = '# Test Instructions\n\nYou are a test agent.';
    writeFileSync(testInstructionsPath, testContent, 'utf-8');

    const mockTool = tool({
      description: 'Test tool',
      inputSchema: z.object({ query: z.string() }),
      execute: async () => 'test result',
    });

    const agent = createAgent({
      instructions: './test-instructions.md',
      tools: { testTool: mockTool },
    });

    expect(agent).toBeDefined();

    // Cleanup
    unlinkSync(testInstructionsPath);
  });

  it('should fallback to string if .md file read fails', () => {
    const mockTool = tool({
      description: 'Test tool',
      inputSchema: z.object({ query: z.string() }),
      execute: async () => 'test result',
    });

    const agent = createAgent({
      instructions: './non-existent-file.md', // Will fail to read
      tools: { testTool: mockTool },
    });

    expect(agent).toBeDefined();
  });

  it('should accept optional model parameter', () => {
    const mockTool = tool({
      description: 'Test tool',
      inputSchema: z.object({ query: z.string() }),
      execute: async () => 'test result',
    });

    const agent = createAgent({
      instructions: 'You are a test agent',
      tools: { testTool: mockTool },
      model: 'gpt-4o',
    });

    expect(agent).toBeDefined();
  });
});
