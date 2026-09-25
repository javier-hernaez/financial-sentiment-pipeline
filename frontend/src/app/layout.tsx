import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Market ELT • Terminal de Datos, NLP y Almacén DuckDB',
  description: 'Consola operacional de datos, scoring FinBERT y analítica en DuckDB.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full bg-[#090d16]" suppressHydrationWarning>
      <body className="h-full flex flex-col antialiased selection:bg-sky-500/20 selection:text-sky-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
