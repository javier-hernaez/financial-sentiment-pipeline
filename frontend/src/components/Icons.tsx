// Small stroke icons drawn for this project. 16px grid, currentColor, 1.5 stroke.
import React from 'react';

type P = { className?: string };

const base = (path: React.ReactNode, viewBox = '0 0 16 16') =>
  function Icon({ className = 'w-4 h-4' }: P) {
    return (
      <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {path}
      </svg>
    );
  };

export const IconSearch = base(<><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></>);
export const IconMoon = base(<path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />);
export const IconSun = base(<><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" /></>);
export const IconExternal = base(<path d="M6 3h7v7M13 3 4 12" />);
export const IconCheck = base(<path d="m3 8.5 3 3 7-7" />);
export const IconX = base(<path d="m4 4 8 8M12 4l-8 8" />);
export const IconPlay = base(<path d="M5 3.5v9l7-4.5z" />);
export const IconRefresh = base(<><path d="M13 8a5 5 0 1 1-1.5-3.6" /><path d="M13 2.5V5h-2.5" /></>);
export const IconDownload = base(<path d="M8 2.5v8m-3.5-3.5L8 10.5l3.5-3.5M3 13.5h10" />);

export const IconArrowRight = base(<path d="M3 8h10m-4-4 4 4-4 4" />);
export const IconMore = base(<><circle cx="3.5" cy="8" r=".6" fill="currentColor" /><circle cx="8" cy="8" r=".6" fill="currentColor" /><circle cx="12.5" cy="8" r=".6" fill="currentColor" /></>);

// Navigation (20px grid, drawn for the tab bar)
export const IconOverview = base(<path d="M3 3.5h6v6H3zM11 3.5h6v3.5h-6zM11 9h6v7.5h-6zM3 11.5h6v5H3z" />, '0 0 20 20');
export const IconRuns = base(<path d="M6 4.5v11l9-5.5z" />, '0 0 20 20');
export const IconTables = base(<><ellipse cx="10" cy="5" rx="6" ry="2.2" /><path d="M4 5v10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5M4 10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" /></>, '0 0 20 20');
export const IconStatus = base(<path d="M2 10h4l2-5 4 10 2-5h4" />, '0 0 20 20');
