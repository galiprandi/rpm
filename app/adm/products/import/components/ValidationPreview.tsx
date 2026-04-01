'use client';

/**
 * ValidationPreview Component
 * Preview de validación de datos antes de importar
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ValidProduct {
  _rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  categoryName: string;
  isDuplicate: boolean;
}

interface InvalidRow {
  row: number;
  reason: string;
  data: Record<string, string>;
}

interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  categoriesToCreateCount: number;
}

interface ValidationPreviewProps {
  validProducts: ValidProduct[];
  invalidRows: InvalidRow[];
  stats: ValidationStats;
  categoriesToCreate: Array<{ key: string; name: string; count: number }>;
}

export function ValidationPreview({
  validProducts,
  invalidRows,
  stats,
  categoriesToCreate,
}: ValidationPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total registros</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{stats.valid}</div>
          <div className="text-sm text-green-600">Válidos</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{stats.invalid}</div>
          <div className="text-sm text-red-600">Inválidos</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-2xl font-bold text-blue-700">
            {stats.categoriesToCreateCount}
          </div>
          <div className="text-sm text-blue-600">Categorías nuevas</div>
        </Card>
      </div>

      {/* Categories to Create */}
      {categoriesToCreate.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Categorías a Crear
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoriesToCreate.map((cat) => (
              <Badge key={cat.key} variant="outline" className="text-blue-700 border-blue-200">
                {cat.name}
                <span className="ml-1 text-blue-500">({cat.count})</span>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Valid Products Preview */}
      {validProducts.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Productos Válidos ({validProducts.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Nombre</th>
                  <th className="text-left py-2 px-2">Categoría</th>
                  <th className="text-right py-2 px-2">Costo</th>
                  <th className="text-right py-2 px-2">Venta</th>
                  <th className="text-right py-2 px-2">Stock</th>
                  <th className="text-center py-2 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {validProducts.slice(0, 10).map((product) => (
                  <tr key={product._rowIndex} className="border-b last:border-0">
                    <td className="py-2 px-2 text-muted-foreground">{product._rowIndex}</td>
                    <td className="py-2 px-2 font-medium">{product.name}</td>
                    <td className="py-2 px-2">{product.categoryName}</td>
                    <td className="py-2 px-2 text-right">${product.costPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">${product.salePrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">{product.stock}</td>
                    <td className="py-2 px-2 text-center">
                      {product.isDuplicate ? (
                        <Badge variant="outline" className="text-yellow-600">
                          Duplicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Nuevo
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validProducts.length > 10 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                ... y {validProducts.length - 10} productos más
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Invalid Rows */}
      {invalidRows.length > 0 && (
        <Card className="p-4 border-red-200">
          <h4 className="font-medium mb-3 flex items-center gap-2 text-red-700">
            <XCircle className="h-4 w-4" />
            Registros Inválidos ({invalidRows.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {invalidRows.slice(0, 10).map((row) => (
              <div
                key={row.row}
                className="flex items-start gap-3 p-2 rounded bg-red-50"
              >
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Fila {row.row}:</span>{' '}
                  <span className="text-red-700">{row.reason}</span>
                </div>
              </div>
            ))}
            {invalidRows.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                ... y {invalidRows.length - 10} errores más
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
