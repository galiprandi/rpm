/**
 * useFileUpload Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useFileUpload } from '@/app/adm/products/import/hooks/useFileUpload';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock FormData
global.FormData = class FormData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  append(_name: string, _value: File | string) {}
} as unknown as typeof FormData;

describe('useFileUpload Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() => useFileUpload());
    
    expect(result.current).toBeDefined();
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.uploadFile).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useFileUpload());
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful file analysis', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        columns: ['name', 'price'],
        preview: [{ name: 'Test', price: '10.99' }],
        totalRows: 1,
        delimiter: ',',
        encoding: 'utf-8',
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useFileUpload());
    
    const file = new File(['name,price\nTest,10.99'], 'test.csv');

    await act(async () => {
      const data = await result.current.uploadFile(file);
      expect(data).toEqual({
        columns: ['name', 'price'],
        preview: [{ name: 'Test', price: '10.99' }],
        totalRows: 1,
        file,
        delimiter: ',',
        encoding: 'utf-8',
      });
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Invalid file' }),
    });

    const { result } = renderHook(() => useFileUpload());
    const file = new File(['test'], 'test.csv');

    await act(async () => {
      try {
        await result.current.uploadFile(file);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Invalid file');
  });

  it('should validate file type', async () => {
    const { result } = renderHook(() => useFileUpload());
    const file = new File(['test'], 'test.txt');

    await act(async () => {
      try {
        await result.current.uploadFile(file);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('El archivo debe ser un CSV');
  });

  it('should validate file size', async () => {
    const { result } = renderHook(() => useFileUpload());
    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv');

    await act(async () => {
      try {
        await result.current.uploadFile(largeFile);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('El archivo no puede superar 10MB');
  });
});
