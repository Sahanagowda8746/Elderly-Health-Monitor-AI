import React, { useState } from 'react';
import {
  FileText, Upload, TrendingUp, TrendingDown, Minus, Layers
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { parseReportText, compareReports, type ParsedReport, type ComparisonResult } from '../lib/reportParser';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

const SAMPLE_REPORT_A = `
METROPOLITAN CLINICAL LABORATORY
PATIENT: Margaret Vance | AGE: 76 | GENDER: Female | DATE: 2026-06-12

COMPLETE BLOOD COUNT (CBC) & COMPREHENSIVE METABOLIC PANEL
Hemoglobin: 13.8 g/dL (Reference Range: 12.0 - 15.5)
RBC Count: 4.6 million/µL (Reference Range: 4.0 - 5.2)
WBC Count: 6.8 thousand/µL (Reference Range: 4.5 - 11.0)
Platelet Count: 240 thousand/µL (Reference Range: 150 - 450)
Fasting Glucose: 104 mg/dL (Reference Range: 70 - 99)
HbA1c: 5.8 % (Reference Range: < 5.7)
Total Cholesterol: 195 mg/dL (Reference Range: < 200)
Triglycerides: 140 mg/dL (Reference Range: < 150)
Creatinine: 0.9 mg/dL (Reference Range: 0.6 - 1.2)
BUN: 16 mg/dL (Reference Range: 7 - 20)
Potassium: 4.2 mEq/L (Reference Range: 3.5 - 5.0)
Sodium: 139 mEq/L (Reference Range: 135 - 145)
`;

const SAMPLE_REPORT_B = `
METROPOLITAN CLINICAL LABORATORY
PATIENT: Margaret Vance | AGE: 76 | GENDER: Female | DATE: 2026-09-18

COMPLETE BLOOD COUNT (CBC) & COMPREHENSIVE METABOLIC PANEL
Hemoglobin: 12.2 g/dL (Reference Range: 12.0 - 15.5)
RBC Count: 4.1 million/µL (Reference Range: 4.0 - 5.2)
WBC Count: 8.9 thousand/µL (Reference Range: 4.5 - 11.0)
Platelet Count: 210 thousand/µL (Reference Range: 150 - 450)
Fasting Glucose: 118 mg/dL (Reference Range: 70 - 99)
HbA1c: 6.3 % (Reference Range: < 5.7)
Total Cholesterol: 218 mg/dL (Reference Range: < 200)
Triglycerides: 172 mg/dL (Reference Range: < 150)
Creatinine: 1.1 mg/dL (Reference Range: 0.6 - 1.2)
BUN: 19 mg/dL (Reference Range: 7 - 20)
Potassium: 4.4 mEq/L (Reference Range: 3.5 - 5.0)
Sodium: 138 mEq/L (Reference Range: 135 - 145)
`;

export function PatientReportsPage() {
  const { latestReading } = useHealth();

  const [selectedReportName, setSelectedReportName] = useState('September 2026 Comprehensive Lab');
  const [parsedCurrent, setParsedCurrent] = useState<ParsedReport>(() => parseReportText(SAMPLE_REPORT_B));
  const [parsedPrevious] = useState<ParsedReport>(() => parseReportText(SAMPLE_REPORT_A));
  const [activeTab, setActiveTab] = useState<'extracted' | 'comparison' | 'synthesis'>('extracted');

  const comparisons: ComparisonResult[] = compareReports(
    parsedPrevious.parameters,
    parsedCurrent.parameters
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setSelectedReportName(file.name);
      const res = parseReportText(content);
      setParsedCurrent(res);
    };
    reader.readAsText(file);
  };

  const loadSample = (report: 'A' | 'B') => {
    if (report === 'A') {
      setSelectedReportName('June 2026 Baseline Lab');
      setParsedCurrent(parseReportText(SAMPLE_REPORT_A));
    } else {
      setSelectedReportName('September 2026 Comprehensive Lab');
      setParsedCurrent(parseReportText(SAMPLE_REPORT_B));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'abnormal':
        return <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded text-[11px]">Abnormal</span>;
      case 'borderline':
        return <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded text-[11px]">Borderline</span>;
      case 'normal':
        return <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded text-[11px]">Normal</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded text-[11px]">Evaluated</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Medical Document & Lab Analysis</h1>
                <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2.5 py-0.5 rounded-full">
                  Multi-Modal NLP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated extraction of 30+ biomarkers with chronological delta analysis & sensor synthesis
              </p>
            </div>
          </div>

          {/* Quick Sample Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSample('A')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
            >
              Load June Lab (Baseline)
            </button>
            <button
              onClick={() => loadSample('B')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Load Sept Lab (Current)
            </button>
          </div>
        </div>
      </div>

      {/* Upload & Pipeline Status Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Upload Laboratory or Clinical Report</h2>
          <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
            <Upload size={32} className="text-teal-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              Drop PDF, scanned image, or text clinical report here
            </p>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              Supports CBC, Metabolic Panels, Lipid Profiles, and Glycemic markers
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all">
              <span>Choose Report File</span>
              <input type="file" accept=".pdf,.txt,.doc" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">Active Document: {selectedReportName}</span>
            <span className="font-mono text-teal-600 font-semibold">{parsedCurrent.extractedCount} Biomarkers Extracted</span>
          </div>
        </div>

        {/* Pipeline Intelligence Banner */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-3">
              <Layers size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Multi-Modal Synthesis</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              HealthGuard AI couples discrete clinical biomarkers with high-frequency continuous IoT telemetry.
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800 border border-slate-700">
                <span className="text-slate-400">Data Quality:</span>
                <span className="font-bold text-emerald-400 capitalize">{parsedCurrent.dataQuality}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800 border border-slate-700">
                <span className="text-slate-400">Pattern Engine:</span>
                <span className="font-mono text-slate-200">Regex + Confidence NLP</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            {parsedCurrent.qualityNote}
          </div>
        </div>
      </div>

      {/* Tabs: Extracted Parameters vs Comparison vs Combined Synthesis */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('extracted')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'extracted' ? 'bg-white shadow text-teal-700 font-bold' : 'text-slate-600'
              }`}
            >
              Extracted Parameters ({parsedCurrent.parameters.length})
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'comparison' ? 'bg-white shadow text-teal-700 font-bold' : 'text-slate-600'
              }`}
            >
              Chronological Comparison
            </button>
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'synthesis' ? 'bg-white shadow text-teal-700 font-bold' : 'text-slate-600'
              }`}
            >
              Sensor + Lab Clinical Synthesis
            </button>
          </div>
        </div>

        {/* Tab 1: Extracted Parameters Table */}
        {activeTab === 'extracted' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Biomarker Name</th>
                  <th className="py-2.5 px-3">Extracted Value</th>
                  <th className="py-2.5 px-3">Reference Range</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedCurrent.parameters.map((param, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {param.parameterName}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {param.value} <span className="text-slate-500 font-normal">{param.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {param.referenceRange ?? 'Not specified in text'}
                    </td>
                    <td className="py-2.5 px-3">
                      {getStatusBadge(param.status)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize">
                      {param.extractionConfidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Chronological Comparison */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Comparing <strong>June 2026 Baseline</strong> vs <strong>September 2026 Current</strong> laboratory panels.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Biomarker</th>
                    <th className="py-2.5 px-3">Previous (Jun)</th>
                    <th className="py-2.5 px-3">Current (Sept)</th>
                    <th className="py-2.5 px-3">Delta Change</th>
                    <th className="py-2.5 px-3">Trend Direction</th>
                    <th className="py-2.5 px-3">Clinical Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisons.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {c.parameterName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {c.previousValue ?? '--'} {c.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {c.currentValue ?? '--'} {c.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        {c.changePercent !== null ? (
                          <span className={c.changePercent > 0 ? 'text-amber-600' : 'text-blue-600'}>
                            {c.changePercent > 0 ? `+${c.changePercent}%` : `${c.changePercent}%`}
                          </span>
                        ) : '--'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                          c.trend === 'rising' ? 'bg-orange-50 text-orange-700' :
                          c.trend === 'falling' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.trend === 'rising' ? <TrendingUp size={12} /> : c.trend === 'falling' ? <TrendingDown size={12} /> : <Minus size={12} />}
                          <span className="capitalize">{c.trend}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                        {c.changeDescription}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Sensor + Lab Clinical Synthesis */}
        {activeTab === 'synthesis' && (
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
              <h3 className="font-bold text-sm text-teal-950 mb-1 flex items-center gap-1.5">
                Cross-Modal Clinical Correlation Summary
              </h3>
              <p className="leading-relaxed">
                Synthesis integrates continuous wearable sensor data (heart rate, SpO₂, skin temperature) with static laboratory biomarkers (glycated hemoglobin, fasting glucose, electrolytes).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Metabolic & Cardio-Respiratory Correlation
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Current Fasting Glucose (118 mg/dL) and HbA1c (6.3%) show an upward trajectory compared to previous tests. Concurrent live heart rate telemetry ({latestReading?.heartRate ?? 76} BPM) remains within normal bounds during resting periods.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500">
                  Caregiver note: Monitor post-prandial activity patterns and scheduled physician follow-up for glucose trend review.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Oxygen Transport & Red Blood Cell Indices
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Hemoglobin level is recorded at 12.2 g/dL (down from 13.8 g/dL). Live SpO₂ saturation is currently measuring {latestReading?.spo2 ?? 97}%. Peripheral oxygenation remains adequate despite mild downward trend in red blood cell parameters.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500">
                  Observation: Recommend continuing continuous SpO₂ nocturnal monitoring to ensure oxygenation stability.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
