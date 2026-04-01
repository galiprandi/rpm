/**
 * API Route: /api/import/products/analyze
 * POST: Analiza un archivo CSV y detecta columnas, encoding, delimitador
 */
import { NextRequest, NextResponse } from 'next/server';

// Parse CSV with auto-detection of delimiter and encoding
function parseCSV(content: string): { headers: string[]; rows: string[][]; delimiter: string } {
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
    return { headers: [], rows: [], delimiter: bestDelimiter };
  }

  // Find the best delimiter
  for (const delim of delimiters) {
    const colCounts = firstLines.map(line => line.split(delim).length);
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
      const firstLineCols = firstLines[0].split(delim).length;
      if (firstLineCols > maxCols) {
        maxCols = firstLineCols;
        bestDelimiter = delim;
      }
    }
  }

  const lines = allLines.filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: bestDelimiter };
  }

  const headers = lines[0].split(bestDelimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1, 6).map(line =>
    line.split(bestDelimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  return { headers, rows, delimiter: bestDelimiter };
}

// Convert Buffer to string with encoding detection
function bufferToString(buffer: Buffer): string {
  // Try UTF-8 first
  try {
    const utf8 = buffer.toString('utf-8');
    if (!utf8.includes('\uFFFD')) return utf8;
  } catch {}

  // Try Latin1
  try {
    return buffer.toString('latin1');
  } catch {}

  return buffer.toString('utf-8');
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

    // Parse CSV
    const { headers, rows, delimiter } = parseCSV(content);

    if (headers.length === 0) {
      return NextResponse.json({ error: 'Could not parse CSV file' }, { status: 400 });
    }

    // Count total rows
    const totalRows = content.split('\n').filter(line => line.trim()).length - 1;

    return NextResponse.json({
      columns: headers,
      preview: rows.map((row, index) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] || '';
        });
        return { ...obj, _rowIndex: index + 2 };
      }),
      totalRows,
      delimiter,
      encoding: 'utf-8',
    });
  } catch (error) {
    console.error('Error analyzing CSV:', error);
    return NextResponse.json(
      { error: 'Error analyzing CSV file' },
      { status: 500 }
    );
  }
}
