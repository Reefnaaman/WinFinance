import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    // Debug: Show first 5 lines and their parsed fields
    const debug = lines.slice(0, 5).map((line, i) => {
      const fields = parseCSVLine(line);
      return {
        lineNumber: i + 1,
        rawLine: line,
        fieldCount: fields.length,
        fields: fields.map((field, j) => ({
          index: j,
          value: field,
          length: field.length
        }))
      };
    });

    return NextResponse.json({
      totalLines: lines.length,
      debug
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}