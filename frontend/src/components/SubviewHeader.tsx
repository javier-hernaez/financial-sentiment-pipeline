'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SubviewHeaderProps {
  title: string;
  description: string;
  onBack: () => void;
  isDark?: boolean;
}

export const SubviewHeader: React.FC<SubviewHeaderProps> = ({
  title,
  description,
  onBack,
  isDark = true,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
      <div>
        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
      <button
        onClick={onBack}
        className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver al Dashboard</span>
      </button>
    </div>
  );
};
