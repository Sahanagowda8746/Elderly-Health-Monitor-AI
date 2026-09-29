import type { ReportParameter } from '../types';

// ─── Keyword Patterns ─────────────────────────────────────────────────────────

interface ParameterPattern {
  name: string;
  unit: string;
  keywords: string[];
  valuePattern: RegExp;
  referencePattern?: RegExp;
}

const PARAMETER_PATTERNS: ParameterPattern[] = [
  {
    name: 'Hemoglobin',
    unit: 'g/dL',
    keywords: ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
    valuePattern: /(?:hemoglobin|haemoglobin|hb|hgb)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'RBC Count',
    unit: 'million/µL',
    keywords: ['rbc', 'red blood cell', 'erythrocyte'],
    valuePattern: /(?:rbc|red blood cell)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'WBC Count',
    unit: 'thousand/µL',
    keywords: ['wbc', 'white blood cell', 'leukocyte', 'tlc'],
    valuePattern: /(?:wbc|white blood cell|tlc)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Platelet Count',
    unit: 'thousand/µL',
    keywords: ['platelet', 'plt', 'thrombocyte'],
    valuePattern: /(?:platelet|plt)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Fasting Glucose',
    unit: 'mg/dL',
    keywords: ['glucose', 'blood sugar', 'fbs', 'fasting glucose'],
    valuePattern: /(?:glucose|blood sugar|fbs)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'HbA1c',
    unit: '%',
    keywords: ['hba1c', 'glycated hemoglobin', 'glycohemoglobin', 'a1c'],
    valuePattern: /(?:hba1c|a1c|glycated)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    keywords: ['total cholesterol', 'cholesterol total'],
    valuePattern: /total\s+cholesterol[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Triglycerides',
    unit: 'mg/dL',
    keywords: ['triglyceride', 'tg', 'triacylglycerol'],
    valuePattern: /(?:triglyceride|tg\b)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    keywords: ['hdl', 'high density lipoprotein'],
    valuePattern: /hdl[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    keywords: ['ldl', 'low density lipoprotein'],
    valuePattern: /ldl[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Creatinine',
    unit: 'mg/dL',
    keywords: ['creatinine', 'creat'],
    valuePattern: /creatinine[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Urea',
    unit: 'mg/dL',
    keywords: ['urea', 'blood urea', 'bun'],
    valuePattern: /(?:urea|bun)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'eGFR',
    unit: 'mL/min/1.73m²',
    keywords: ['egfr', 'gfr', 'glomerular filtration'],
    valuePattern: /(?:egfr|gfr)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Bilirubin Total',
    unit: 'mg/dL',
    keywords: ['bilirubin', 'total bilirubin'],
    valuePattern: /(?:total\s+)?bilirubin[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'ALT (SGPT)',
    unit: 'U/L',
    keywords: ['alt', 'sgpt', 'alanine aminotransferase'],
    valuePattern: /(?:alt|sgpt)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'AST (SGOT)',
    unit: 'U/L',
    keywords: ['ast', 'sgot', 'aspartate aminotransferase'],
    valuePattern: /(?:ast|sgot)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'ALP',
    unit: 'U/L',
    keywords: ['alp', 'alkaline phosphatase'],
    valuePattern: /(?:alp|alkaline phosphatase)[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'TSH',
    unit: 'mIU/L',
    keywords: ['tsh', 'thyroid stimulating hormone'],
    valuePattern: /tsh[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'T3',
    unit: 'ng/dL',
    keywords: ['t3', 'triiodothyronine'],
    valuePattern: /\bt3\b[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'T4',
    unit: 'µg/dL',
    keywords: ['t4', 'thyroxine'],
    valuePattern: /\bt4\b[^\d]*(\d+\.?\d*)/i,
  },
  {
    name: 'Heart Rate',
    unit: 'BPM',
    keywords: ['heart rate', 'pulse rate', 'hr'],
    valuePattern: /(?:heart rate|pulse)[^\d]*(\d+)/i,
  },
  {
    name: 'Systolic BP',
    unit: 'mmHg',
    keywords: ['systolic', 'blood pressure', 'bp'],
    valuePattern: /(?:systolic|bp)[^\d]*(\d+)/i,
  },
  {
    name: 'SpO₂',
    unit: '%',
    keywords: ['spo2', 'oxygen saturation', 'o2 sat'],
    valuePattern: /(?:spo2|oxygen saturation|o2 sat)[^\d]*(\d+)/i,
  },
  {
    name: 'Temperature',
    unit: '°C',
    keywords: ['temperature', 'temp', 'body temp'],
    valuePattern: /(?:temperature|temp)[^\d]*(\d+\.?\d*)/i,
  },
];

// ─── Reference Range Extraction ────────────────────────────────────────────────

function extractReferenceRange(text: string, paramName: string): string | null {
  // Look for patterns like "12.0 - 16.0" or "70-100" near the parameter
  const rangePattern = /(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/g;
  const lines = text.split('\n');

  for (const line of lines) {
    const lower = line.toLowerCase();
    const paramLower = paramName.toLowerCase();
    if (lower.includes(paramLower) || lower.includes(paramLower.split(' ')[0])) {
      const matches = [...line.matchAll(rangePattern)];
      if (matches.length > 0) {
        const match = matches[matches.length - 1];
        return `${match[1]}–${match[2]}`;
      }
    }
  }
  return null;
}

// ─── Status Determination ──────────────────────────────────────────────────────

function determineStatus(
  value: number,
  referenceRange: string | null
): ReportParameter['status'] {
  if (!referenceRange) return 'unknown';

  const rangeMatch = referenceRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  const upperMatch = referenceRange.match(/[<>]\s*(\d+\.?\d*)/);

  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    const margin = (high - low) * 0.1;
    if (value >= low && value <= high) return 'normal';
    if (value < low - margin || value > high + margin) return 'abnormal';
    return 'borderline';
  }

  if (upperMatch) {
    const limit = parseFloat(upperMatch[1]);
    const margin = limit * 0.05;
    if (referenceRange.startsWith('<')) {
      if (value < limit) return 'normal';
      if (value < limit + margin) return 'borderline';
      return 'abnormal';
    }
    if (referenceRange.startsWith('>')) {
      if (value > limit) return 'normal';
      if (value > limit - margin) return 'borderline';
      return 'abnormal';
    }
  }

  return 'unknown';
}

// ─── Main Parser ───────────────────────────────────────────────────────────────

export interface ParsedReport {
  parameters: Omit<ReportParameter, 'id' | 'reportId' | 'createdAt'>[];
  rawText: string;
  dataQuality: 'high' | 'moderate' | 'limited';
  extractedCount: number;
  qualityNote: string;
}

export function parseReportText(text: string): ParsedReport {
  const parameters: Omit<ReportParameter, 'id' | 'reportId' | 'createdAt'>[] = [];
  const foundNames = new Set<string>();

  const cleanText = text.replace(/\s+/g, ' ').trim();

  for (const pattern of PARAMETER_PATTERNS) {
    const match = cleanText.match(pattern.valuePattern);
    if (match && match[1] && !foundNames.has(pattern.name)) {
      const numericValue = parseFloat(match[1]);
      if (!isNaN(numericValue)) {
        const referenceRange = extractReferenceRange(cleanText, pattern.name);
        const status = determineStatus(numericValue, referenceRange);

        parameters.push({
          parameterName: pattern.name,
          value: match[1],
          unit: pattern.unit,
          referenceRange,
          extractedText: match[0].trim(),
          extractionConfidence: referenceRange ? 'high' : 'moderate',
          status,
        });
        foundNames.add(pattern.name);
      }
    }
  }

  // Determine data quality
  let dataQuality: 'high' | 'moderate' | 'limited';
  let qualityNote = '';

  if (parameters.length >= 8 && cleanText.length > 500) {
    dataQuality = 'high';
    qualityNote = `Analysis confidence: High. ${parameters.length} parameters successfully extracted.`;
  } else if (parameters.length >= 3) {
    dataQuality = 'moderate';
    qualityNote = `Analysis confidence: Moderate. ${parameters.length} parameters extracted. Some values may require verification.`;
  } else {
    dataQuality = 'limited';
    qualityNote =
      'Analysis confidence: Limited. Few parameters could be reliably extracted from the uploaded document. Please upload a clearer image or a text-based PDF.';
  }

  return {
    parameters,
    rawText: cleanText,
    dataQuality,
    extractedCount: parameters.length,
    qualityNote,
  };
}

// ─── Report Comparison ────────────────────────────────────────────────────────

export interface ComparisonResult {
  parameterName: string;
  previousValue: string | null;
  currentValue: string | null;
  unit: string | null;
  trend: 'rising' | 'falling' | 'stable' | 'insufficient_data';
  changePercent: number | null;
  changeDescription: string;
  clinicalNote: string;
}

export function compareReports(
  previous: Omit<ReportParameter, 'id' | 'reportId' | 'createdAt'>[],
  current: Omit<ReportParameter, 'id' | 'reportId' | 'createdAt'>[]
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  // All parameters from current report
  for (const cur of current) {
    const prev = previous.find((p) => p.parameterName === cur.parameterName);

    if (!prev) {
      results.push({
        parameterName: cur.parameterName,
        previousValue: null,
        currentValue: cur.value,
        unit: cur.unit,
        trend: 'insufficient_data',
        changePercent: null,
        changeDescription: 'No previous value available for comparison.',
        clinicalNote: 'Insufficient historical data to identify a reliable trend.',
      });
      continue;
    }

    const prevNum = parseFloat(prev.value);
    const curNum = parseFloat(cur.value);

    if (isNaN(prevNum) || isNaN(curNum)) {
      results.push({
        parameterName: cur.parameterName,
        previousValue: prev.value,
        currentValue: cur.value,
        unit: cur.unit,
        trend: 'insufficient_data',
        changePercent: null,
        changeDescription: 'Values could not be numerically compared.',
        clinicalNote: 'Numeric comparison was not possible for this parameter.',
      });
      continue;
    }

    const changePercent = prevNum !== 0 ? ((curNum - prevNum) / prevNum) * 100 : 0;
    const absChange = Math.abs(curNum - prevNum);
    const threshold = Math.abs(prevNum) * 0.03; // 3% change = meaningful

    let trend: ComparisonResult['trend'];
    let changeDescription: string;

    if (absChange < threshold) {
      trend = 'stable';
      changeDescription = `The recorded value has remained relatively stable compared with the previous report (${prev.value} → ${cur.value} ${cur.unit ?? ''}).`;
    } else if (curNum > prevNum) {
      trend = 'rising';
      changeDescription = `The recorded value has increased compared with the previous available report (${prev.value} → ${cur.value} ${cur.unit ?? ''}, +${Math.abs(changePercent).toFixed(1)}%).`;
    } else {
      trend = 'falling';
      changeDescription = `The recorded value has decreased compared with the previous available report (${prev.value} → ${cur.value} ${cur.unit ?? ''}, −${Math.abs(changePercent).toFixed(1)}%).`;
    }

    results.push({
      parameterName: cur.parameterName,
      previousValue: prev.value,
      currentValue: cur.value,
      unit: cur.unit,
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
      changeDescription,
      clinicalNote:
        'Observed changes are noted for monitoring purposes. Professional medical review is recommended for clinical interpretation.',
    });
  }

  return results;
}

// ─── PDF Text Extraction Placeholder ─────────────────────────────────────────

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(file);
  }
  // For images, return a placeholder (would need backend OCR)
  return '';
}

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}
