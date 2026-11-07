'use client';

import { useEffect } from 'react';
import { AppProvider, useApp } from '@/components/AppContext';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { TopNav, SiteFooter } from '@/components/shell/TopNav';
import { MobileTabBar } from '@/components/shell/MobileBar';
import { VIEWS } from '@/components/shell/views';
import { Overview } from '@/components/views/Overview';
import { Runs } from '@/components/views/Runs';
import { Tables } from '@/components/views/Tables';
import { Quality } from '@/components/views/Quality';
import { NlpModel } from '@/components/views/NlpModel';
import { Results } from '@/components/views/Results';
import { Architecture } from '@/components/views/Architecture';
import { LocaleProvider } from '@/lib/i18n';

function Shell() {
  const { view, navigate, setPaletteOpen } = useApp();

  // Ctrl/⌘ K opens the palette; 1–7 jump between sections when not typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = VIEWS.find((v) => v.key === e.key);
      if (target) {
        e.preventDefault();
        navigate(target.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, setPaletteOpen]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopNav />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-3 px-3 pt-3 lg:gap-4 lg:px-6 lg:pt-5">
        {view === 'overview' && <Overview />}
        {view === 'runs' && <Runs />}
        {view === 'tables' && <Tables />}
        {view === 'quality' && <Quality />}
        {view === 'model' && <NlpModel />}
        {view === 'results' && <Results />}
        {view === 'architecture' && <Architecture />}
      </main>
      <SiteFooter />
      <MobileTabBar />
      <CommandPalette />
    </div>
  );
}

export default function Home() {
  return (
    <LocaleProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </LocaleProvider>
  );
}
