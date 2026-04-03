/**
 * API Route: /api/import/products/analyze
 * POST: Analiza un archivo CSV, detecta encoding/delimitador, y sanitiza filas malformadas
 */
import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeResultSchema } from '@/lib/product-import-schemas';

// Parse a single CSV line respecting quotes
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse CSV with auto-detection of delimiter and encoding
function parseCSV(content: string): { 
  headers: string[]; 
  rows: string[][]; 
  delimiter: string;
  skippedRows: number;
} {
  // Try different delimiters
  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxCols = 0;

  // Get first few non-empty lines for delimiter detection
  const allLines = content.split('\n');
  const firstLines = allLines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 5);

  if (firstLines.length === 0) {
    return { headers: [], rows: [], delimiter: bestDelimiter, skippedRows: 0 };
  }

  // Find the best delimiter
  for (const delim of delimiters) {
    const colCounts = firstLines.map(line => parseCSVLine(line, delim).length);
    const consistent = colCounts.every(c => c === colCounts[0]);
    const minCols = Math.min(...colCounts);
    
    // Prefer consistent delimiters, but also consider those that produce more columns
    if (consistent && colCounts[0] > maxCols) {
      maxCols = colCounts[0];
      bestDelimiter = delim;
    } else if (!consistent && minCols > maxCols && minCols > 1) {
      // If no consistent delimiter found, use one that produces most columns
      maxCols = minCols;
      bestDelimiter = delim;
    }
  }

  // If still no good delimiter found, check first line specifically
  if (maxCols <= 1) {
    for (const delim of delimiters) {
      const firstLineCols = parseCSVLine(firstLines[0], delim).length;
      if (firstLineCols > maxCols) {
        maxCols = firstLineCols;
        bestDelimiter = delim;
      }
    }
  }

  const lines = allLines.filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: bestDelimiter, skippedRows: 0 };
  }

  const headers = parseCSVLine(lines[0], bestDelimiter)
    .map(h => h.trim().replace(/^["']|["']$/g, ''));
  const expectedColCount = headers.length;
  
  // Parse rows and discard malformed ones (wrong column count)
  const rawRows = lines.slice(1).map(line =>
    parseCSVLine(line, bestDelimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );
  
  // Sanitization: Keep only rows with correct column count
  const validRows: string[][] = [];
  let skippedRows = 0;
  
  for (const row of rawRows) {
    if (row.length === expectedColCount) {
      validRows.push(row);
    } else {
      skippedRows++;
    }
  }

  return { headers, rows: validRows, delimiter: bestDelimiter, skippedRows };
}

// Convert Buffer to string with encoding detection and BOM removal
function bufferToString(buffer: Buffer): string {
  // Remove BOM if present (UTF-8 BOM = EF BB BF)
  let buf = buffer;
  if (buffer.length >= 3 && 
      buffer[0] === 0xEF && 
      buffer[1] === 0xBB && 
      buffer[2] === 0xBF) {
    buf = buffer.subarray(3);
  }
  
  // Try UTF-8 first
  try {
    const utf8 = buf.toString('utf-8');
    if (!utf8.includes('\uFFFD')) return utf8;
  } catch {}

  // Try Latin1
  try {
    return buf.toString('latin1');
  } catch {}

  return buf.toString('utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to string with encoding detection
    const content = bufferToString(buffer);

    // Parse CSV with sanitization
    const { headers, rows, delimiter, skippedRows } = parseCSV(content);

    if (headers.length === 0) {
      return NextResponse.json({ error: 'Could not parse CSV file' }, { status: 400 });
    }

    // Build result with Zod validation
    const result = {
      columns: headers,
      preview: rows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || '';
        });
        return obj;
      }),
      totalRows: rows.length,
      skippedRows,
      delimiter,
      encoding: 'utf-8',
    };

    // Validate with Zod (optional, for type safety)
    const validated = AnalyzeResultSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Error analyzing CSV:', error);
    return NextResponse.json(
      { error: 'Error analyzing CSV file' },
      { status: 500 }
    );
  }
}
