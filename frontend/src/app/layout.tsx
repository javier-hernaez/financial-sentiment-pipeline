import type { Metadata, Viewport } from 'next';
import { PROJECT } from '@/lib/project';
import './globals.css';

// Loaded by the browser (not at build time) so builds work without network access
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600&display=swap';

const description =
  'Pipeline ELT de Javier Hernáez: extrae precios de Binance y titulares de Google News, RSS y Reddit, los guarda en Parquet, los clasifica con FinBERT y los consolida en DuckDB.';

export const metadata: Metadata = {
  title: `${PROJECT.name} · ${PROJECT.author.name}`,
  description,
  authors: [{ name: PROJECT.author.name, url: PROJECT.author.github }],
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }],
    apple: '/icon.svg',
  },
  openGraph: {
    title: `${PROJECT.name} · ${PROJECT.author.name}`,
    description,
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0b0d' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0b0d' },
  ],
};

// Applies the theme before first paint so there is no flash
const themeScript = `try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';var l=localStorage.getItem('locale');if(l==='en'||l==='es')document.documentElement.lang=l}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
