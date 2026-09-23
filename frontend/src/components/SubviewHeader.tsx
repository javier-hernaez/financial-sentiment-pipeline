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
            inline-flex items-center gap-1.5 text-[10px] font-mono mb-2
            transition-colors
            ${isDark ? 'text-[#4e5d7a] hover:text-[#818cf8]' : 'text-slate-400 hover:text-indigo-500'}
          `}
        >
          <IconArrowLeft className="w-3 h-3" />
          <span>Dashboard</span>
          <span className={isDark ? 'text-[#232d44]' : 'text-slate-300'}>/</span>
        </button>

        <h2 className={`text-lg font-bold tracking-tight leading-tight ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}`}>
          {title}
        </h2>
        <p className={`text-[11px] mt-1 font-mono ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
          {description}
        </p>
      </div>
    </div>
  );
};
