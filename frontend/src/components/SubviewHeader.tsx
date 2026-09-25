'use client';

import React from 'react';
import { IconArrowLeft } from './CustomIcons';

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
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b ${isDark ? 'border-[#1a2035]' : 'border-slate-200'}`}>
      {/* Breadcrumb + Title */}
      <div>
        {/* Breadcrumb */}
        <button
          onClick={onBack}
          className={`
            inline-flex items-center gap-2 text-xs font-mono font-bold mb-2.5
            transition-colors
            ${isDark ? 'text-[#8b95b0] hover:text-[#818cf8]' : 'text-slate-500 hover:text-indigo-600'}
          `}
        >
          <IconArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
          <span className={isDark ? 'text-[#4e5d7a]' : 'text-slate-300'}>/</span>
        </button>

        <h2 className={`text-base sm:text-2xl font-bold tracking-tight leading-tight ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
          {title}
        </h2>
        <p className={`hidden sm:block text-sm sm:text-base mt-1.5 font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};
