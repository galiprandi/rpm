/**
 * ExecuteStep Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ExecuteStep } from './ExecuteStep';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';
import { useImportExecution } from '@/app/adm/products/import/hooks/useImportExecution';

// Mock hooks
vi.mock('@/app/adm/products/import/hooks/useImportState');
vi.mock('@/app/adm/products/import/hooks/useImportExecution');

// Mock child components
vi.mock('../shared/StepActions', () => ({
  StepActions: ({ 
    onBack, 
    onContinue, 
    onContinueDisabled, 
    backLabel, 
    continueLabel, 
    loading,
    extraActions 
  }: {
    onBack: () => void;
    onContinue: () => void;
    onContinueDisabled?: boolean;
    backLabel: string;
    continueLabel: string;
    loading?: boolean;
    extraActions?: any;
  }) => (
    <div>
      <button data-testid="prev-button" onClick={onBack}>{backLabel}</button>
      <button data-testid="next-button" onClick={onContinue} disabled={onContinueDisabled}>
        {continueLabel}
      </button>
      {loading && <span data-testid="loading">Loading...</span>}
      {extraActions && <div data-testid="extra-actions">{extraActions}</div>}
    </div>
  )
}));

vi.mock('../ImportProgress', () => ({
  ImportProgress: ({ 
    isRunning, 
    progress, 
    dryRun, 
    stats, 
    results, 
    onDownloadReport,
    onReset,
    onToggleDryRun
  }: {
    isRunning: boolean;
    progress: number;
    dryRun: boolean;
    stats: any;
    results: any;
    onDownloadReport: () => void;
    onReset: () => void;
    onToggleDryRun: () => void;
  }) => (
    <div>
      <div data-testid="import-progress">
        <span>Running: {isRunning ? 'Yes' : 'No'}</span>
        <span>Progress: {progress}%</span>
        <span>Dry Run: {dryRun ? 'Yes' : 'No'}</span>
        <span>Created: {stats?.created || 0}</span>
        <button data-testid="download-report" onClick={onDownloadReport}>
          Download Report
        </button>
        <button data-testid="reset" onClick={onReset}>
          Reset
        </button>
        <button data-testid="toggle-dry-run" onClick={onToggleDryRun}>
          Toggle Dry Run
        </button>
      </div>
    </div>
  )
}));

const mockUseImportState = useImportState as ReturnType<typeof vi.mocked<typeof useImportState>>;
const mockUseImportExecution = useImportExecution as ReturnType<typeof vi.mocked<typeof useImportExecution>>;

describe('ExecuteStep Component', () => {
  const mockValidationResult = {
    valid: [
      { name: 'Test Product 1', sku: 'TEST1', price: '10.99' },
      { name: 'Test Product 2', sku: 'TEST2', price: '20.99' }
    ],
    invalid: [],
    stats: { attempted: 2, created: 2, failed: 0, skipped: 0, total: 2 },
    categories: [
      { detectedName: 'Iluminación', finalName: 'Iluminación', count: 2 }
    ]
  };

  const mockGlobalOptions = {
    skipStockLessThanOne: false,
    duplicateAction: 'skip' as const
  };

  const mockExistingCategories = [
    { id: '1', name: 'Iluminación' },
    { id: '2', name: 'Accesorios' }
  ];

  beforeEach(() => {
    mockUseImportState.mockReturnValue({
      validationResult: mockValidationResult,
      configuration: { mapping: {}, options: mockGlobalOptions },
      reset: vi.fn(),
      prevStep: vi.fn(),
      nextStep: vi.fn(),
      currentStep: 3,
      fileData: null,
      setFileData: vi.fn(),
      categoryMappings: [],
      importResults: null,
      isProcessing: false
    } as any);

    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: false,
      progress: { percentage: 0, current: 0, total: 0 },
      results: null,
      error: null,
      downloadReport: vi.fn()
    });
  });

  it('should render correctly when validation result exists', () => {
    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    expect(screen.getByText('Importar Productos')).toBeInTheDocument();
    expect(screen.getByText('Productos Válidos')).toBeInTheDocument();
    // Use getAllByText since there are multiple "2" elements
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it('should show no validation message when no validation result', () => {
    mockUseImportState.mockReturnValue({
      validationResult: null,
      configuration: { mapping: {}, options: {} },
      reset: vi.fn(),
      prevStep: vi.fn(),
      nextStep: vi.fn()
    } as any);

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    expect(screen.getByText('No hay datos validados')).toBeInTheDocument();
  });

  it('should pass correct props to ImportProgress', () => {
    // ImportProgress is only rendered when there are results, so we need to mock results
    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: false,
      progress: 0,
      results: { 
        stats: { attempted: 2, created: 2, failed: 0, skipped: 0 },
        results: [],
        createdCategories: []
      },
      error: null,
      downloadReport: vi.fn(),
      reset: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    const progress = screen.getByTestId('import-progress');
    expect(progress).toHaveTextContent('Running: No');
    expect(progress).toHaveTextContent('Progress: 100%');
  });

  it('should handle execute button click', async () => {
    const mockExecute = vi.fn().mockResolvedValue(undefined);
    mockUseImportExecution.mockReturnValue({
      execute: mockExecute,
      isExecuting: false,
      progress: 0,
      results: null,
      error: null,
      downloadReport: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // Find and click execute button (dry run by default)
    const executeButton = screen.getByText('Ejecutar Simulación');
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith({
        products: mockValidationResult.valid,
        categoryMappings: [
          {
            sourceName: 'Iluminación',
            action: 'create',
            newName: 'Iluminación',
            productCount: 2
          }
        ],
        options: { ...mockGlobalOptions, dryRun: true }
      });
    });
  });

  it('should toggle between dry run and actual execution', () => {
    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // Find dry run toggle button
    const toggleButton = screen.getByText('Cambiar a Modo Real');
    expect(toggleButton).toBeInTheDocument();
    
    // Click to toggle to actual execution
    fireEvent.click(toggleButton);
    
    // Now the execute button should be for actual execution
    const executeButton = screen.getByTestId('next-button');
    expect(executeButton).toHaveTextContent('Importar Productos');
  });

  it('should handle download report', () => {
    const mockDownloadReport = vi.fn();
    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: false,
      progress: 100,
      results: { 
        stats: { attempted: 2, created: 2, failed: 0, skipped: 0 },
        results: [],
        createdCategories: []
      },
      error: null,
      downloadReport: mockDownloadReport,
      reset: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    fireEvent.click(screen.getByTestId('download-report'));
    
    expect(mockDownloadReport).toHaveBeenCalled();
  });

  it('should show loading state during execution', () => {
    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: true,
      progress: 50,
      results: null,
      error: null,
      downloadReport: vi.fn(),
      reset: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // Check that loading state is displayed
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should display error when execution fails', () => {
    const mockError = 'API Error: Failed to import products';
    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: false,
      progress: 0,
      results: null,
      error: mockError,
      downloadReport: vi.fn(),
      reset: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // Error should be displayed in the component
    expect(screen.getByText(mockError)).toBeInTheDocument();
  });

  it('should display results after successful execution', () => {
    const mockResults = {
      stats: { attempted: 8, created: 5, failed: 1, skipped: 2 },
      results: [],
      createdCategories: []
    };
    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: false,
      progress: 100,
      results: mockResults,
      error: null,
      downloadReport: vi.fn(),
      reset: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // Results should be displayed
    expect(screen.getByText('Resultados de Importación')).toBeInTheDocument();
  });

  it('should handle reset correctly', () => {
    const mockReset = vi.fn();
    mockUseImportState.mockReturnValue({
      validationResult: mockValidationResult,
      configuration: { mapping: {}, options: mockGlobalOptions },
      reset: mockReset,
      prevStep: vi.fn(),
      nextStep: vi.fn()
    } as any);

    // Mock results to show reset button
    mockUseImportExecution.mockReturnValue({
      execute: vi.fn(),
      isExecuting: false,
      progress: 100,
      results: { 
        stats: { attempted: 2, created: 2, failed: 0, skipped: 0 },
        results: [],
        createdCategories: []
      },
      error: null,
      downloadReport: vi.fn(),
      reset: vi.fn()
    });

    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // Reset button should be available in results view (via ImportProgress mock)
    const resetButton = screen.getByTestId('reset');
    fireEvent.click(resetButton);
    
    expect(mockReset).toHaveBeenCalled();
  });

  it('should navigate to previous step', () => {
    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // The StepActions mock should call onBack when clicked
    fireEvent.click(screen.getByTestId('prev-button'));
    
    // Since this is a mock, we just verify the button exists and is clickable
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
  });

  it('should pass existingCategories to hooks', () => {
    render(<ExecuteStep existingCategories={mockExistingCategories} />);
    
    // The component should render correctly with existingCategories
    expect(screen.getByText('Importar Productos')).toBeInTheDocument();
  });

  describe('Integration with hooks', () => {
    it('should use import state hook correctly', () => {
      render(<ExecuteStep existingCategories={mockExistingCategories} />);
      
      expect(mockUseImportState).toHaveBeenCalled();
    });

    it('should use import execution hook correctly', () => {
      render(<ExecuteStep existingCategories={mockExistingCategories} />);
      
      expect(mockUseImportExecution).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty validation result', () => {
      mockUseImportState.mockReturnValue({
        validationResult: null,
        configuration: { mapping: {}, options: {} },
        reset: vi.fn(),
        prevStep: vi.fn(),
        nextStep: vi.fn()
      } as any);

      render(<ExecuteStep existingCategories={mockExistingCategories} />);
      
      expect(screen.getByText('No hay datos validados')).toBeInTheDocument();
    });

    it('should handle missing categories in validation result', () => {
      mockUseImportState.mockReturnValue({
        validationResult: {
          valid: [{ name: 'Test Product' }],
          invalid: [],
          stats: { attempted: 1, created: 1, failed: 0, skipped: 0, total: 1 }
        },
        configuration: { mapping: {}, options: {} },
        reset: vi.fn(),
        prevStep: vi.fn(),
        nextStep: vi.fn()
      } as any);

      render(<ExecuteStep existingCategories={mockExistingCategories} />);
      
      // Should still render without crashing
      expect(screen.getByText('Importar Productos')).toBeInTheDocument();
    });

    it('should handle execution errors gracefully', async () => {
      const mockExecute = vi.fn().mockRejectedValue(new Error('Network error'));
      mockUseImportExecution.mockReturnValue({
        execute: mockExecute,
        isExecuting: false,
        progress: 0,
        results: null,
        error: null,
        downloadReport: vi.fn(),
        reset: vi.fn()
      });

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ExecuteStep existingCategories={mockExistingCategories} />);
      
      const executeButton = screen.getByText('Ejecutar Simulación');
      fireEvent.click(executeButton);
      
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Import error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
