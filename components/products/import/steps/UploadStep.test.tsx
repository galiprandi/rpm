/**
 * UploadStep Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UploadStep } from './UploadStep';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';
import { useFileUpload } from '@/app/adm/products/import/hooks/useFileUpload';

// Mock hooks
vi.mock('@/app/adm/products/import/hooks/useImportState');
vi.mock('@/app/adm/products/import/hooks/useFileUpload');

// Mock FileUploader component
vi.mock('../FileUploader', () => ({
  FileUploader: ({ onFileAnalyzed }: { onFileAnalyzed: (data: any) => void }) => (
    <div>
      <button data-testid="file-uploader" onClick={() => onFileAnalyzed({
        columns: ['name', 'price'],
        preview: [{ name: 'Test', price: '10.99' }],
        totalRows: 1,
        delimiter: ',',
        encoding: 'utf-8',
        file: new File(['test'], 'test.csv')
      })}>
        Upload File
      </button>
    </div>
  )
}));

const mockUseImportState = useImportState as ReturnType<typeof vi.mocked<typeof useImportState>>;
const mockUseFileUpload = useFileUpload as ReturnType<typeof vi.mocked<typeof useFileUpload>>;

describe('UploadStep Component', () => {
  const mockSetFileData = vi.fn();
  const mockNextStep = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    const mockImportStateReturn = {
      setFileData: mockSetFileData,
      nextStep: mockNextStep,
      reset: mockReset,
      currentStep: 0,
      fileData: null,
      configuration: { mapping: {}, options: { skipStockLessThanOne: false, duplicateAction: 'skip' } },
      validationResult: null,
      categoryMappings: [],
      importResults: null,
      isProcessing: false,
      setMapping: vi.fn(),
      setOptions: vi.fn(),
      setValidationResult: vi.fn(),
      setCategoryMappings: vi.fn(),
      updateCategoryMapping: vi.fn(),
      setImportResults: vi.fn(),
      setIsProcessing: vi.fn(),
      clearFileData: vi.fn(),
      clearConfiguration: vi.fn(),
      clearValidationResult: vi.fn(),
      clearImportResults: vi.fn(),
      prevStep: vi.fn(),
      goToStep: vi.fn(),
    };
    
    mockUseImportState.mockReturnValue(mockImportStateReturn);
    mockUseFileUpload.mockReturnValue({
      isUploading: false,
      error: null,
      uploadFile: vi.fn(),
      reset: mockReset,
    });
  });

  it('should render correctly', () => {
    render(<UploadStep />);
    
    expect(screen.getByText('Cargar Archivo CSV')).toBeInTheDocument();
    expect(screen.getByText(/El sistema analizará el archivo y te mostrará un preview/)).toBeInTheDocument();
  });

  it('should show FileUploader component', () => {
    render(<UploadStep />);
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
  });

  it('should handle file upload and call callbacks', async () => {
    const mockOnFileAnalyzed = vi.fn();
    
    render(<UploadStep onUpload={mockOnFileAnalyzed} />);

    // Simulate file upload through the mocked FileUploader
    fireEvent.click(screen.getByTestId('file-uploader'));

    await waitFor(() => {
      expect(mockSetFileData).toHaveBeenCalledWith({
        columns: ['name', 'price'],
        preview: [{ name: 'Test', price: '10.99' }],
        totalRows: 1,
        delimiter: ',',
        encoding: 'utf-8',
        file: expect.any(File)
      });
      expect(mockNextStep).toHaveBeenCalled();
      expect(mockOnFileAnalyzed).toHaveBeenCalledWith({
        columns: ['name', 'price'],
        preview: [{ name: 'Test', price: '10.99' }],
        totalRows: 1,
        delimiter: ',',
        encoding: 'utf-8',
        file: expect.any(File)
      });
    });
  });

  it('should work without onUpload callback', async () => {
    render(<UploadStep />);

    // Simulate file upload through the mocked FileUploader
    fireEvent.click(screen.getByTestId('file-uploader'));

    await waitFor(() => {
      expect(mockSetFileData).toHaveBeenCalledWith({
        columns: ['name', 'price'],
        preview: [{ name: 'Test', price: '10.99' }],
        totalRows: 1,
        delimiter: ',',
        encoding: 'utf-8',
        file: expect.any(File)
      });
      expect(mockNextStep).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should show error state from useFileUpload', () => {
      mockUseFileUpload.mockReturnValue({
        isUploading: false,
        error: 'Archivo demasiado grande',
        uploadFile: vi.fn(),
        reset: mockReset,
      });

      render(<UploadStep />);

      // El error de useFileUpload se muestra como botón de retry
      expect(screen.getByText('Intentar con otro archivo')).toBeInTheDocument();
    });

    it('should allow retry after error', () => {
      mockUseFileUpload.mockReturnValue({
        isUploading: false,
        error: 'Upload failed',
        uploadFile: vi.fn(),
        reset: mockReset,
      });

      render(<UploadStep />);

      const retryButton = screen.getByText('Intentar con otro archivo');
      fireEvent.click(retryButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should not show error when no error exists', () => {
      mockUseFileUpload.mockReturnValue({
        isUploading: false,
        error: null,
        uploadFile: vi.fn(),
        reset: mockReset,
      });

      render(<UploadStep />);

      expect(screen.queryByText(/Intentar con otro archivo/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<UploadStep />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Cargar Archivo CSV');
    });

    it('should have accessible file upload button', () => {
      render(<UploadStep />);
      
      const uploadButton = screen.getByTestId('file-uploader');
      expect(uploadButton).toBeInTheDocument();
    });
  });
});
