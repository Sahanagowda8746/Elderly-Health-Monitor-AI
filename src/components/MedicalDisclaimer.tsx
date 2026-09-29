import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export function MedicalDisclaimer({ compact = false }: Props) {
  if (compact) {
    return (
      <p className="text-xs text-slate-400 italic">
        ⚕ This application provides informational health-monitoring insights only. It is not a medical diagnostic system.
      </p>
    );
  }
  return (
    <div className="medical-disclaimer flex gap-2">
      <Info size={14} className="flex-shrink-0 mt-0.5 text-sky-500" />
      <p>
        <strong>Medical Disclaimer:</strong> This application provides informational health-monitoring
        insights based on available sensor readings and uploaded documents. It is not a medical
        diagnostic system and does not replace professional medical evaluation, diagnosis, or treatment.
        All thresholds shown are configurable demonstration values, not clinical recommendations.
      </p>
    </div>
  );
}
