'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppProvider, useApp } from '@/components/AppContext';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { TopNav, SiteFooter } from '@/components/shell/TopNav';
import { MobileTabBar } from '@/components/shell/MobileBar';
import { VIEWS } from '@/components/shell/views';
import { Skeleton } from '@/components/ui';
import { Overview } from '@/components/views/Overview';
import { LocaleProvider } from '@/lib/i18n';

const loading = () => <Skeleton className="h-96 w-full" />;

// The landing view ships with the page; the others, and their charts, download when first opened
const Runs = dynamic(() => import('@/components/views/Runs').then((m) => m.Runs), { loading });
const Tables = dynamic(() => import('@/components/views/Tables').then((m) => m.Tables), { loading });
const Quality = dynamic(() => import('@/components/views/Quality').then((m) => m.Quality), { loading });
const NlpModel = dynamic(() => import('@/components/views/NlpModel').then((m) => m.NlpModel), { loading });
const Results = dynamic(() => import('@/components/views/Results').then((m) => m.Results), { loading });
const Architecture = dynamic(() => import('@/components/views/Architecture').then((m) => m.Architecture), { loading });

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
