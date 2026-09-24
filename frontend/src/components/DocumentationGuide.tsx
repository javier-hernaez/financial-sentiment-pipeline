'use client';

import React, { useState } from 'react';
import {
  IconDocumentation,
  IconPipeline,
  IconFinbertLab,
  IconDuckDB,
  IconShield,
  IconPlay,
  IconTerminal,
  IconMarket,
  IconObservability,
} from './CustomIcons';

interface DocumentationGuideProps {
  isDark?: boolean;
}

/* ── helpers ──────────────────────────────────────────────────────────────── */
const CodeBlock: React.FC<{ comment: string; code: string; isDark: boolean }> = ({ comment, code, isDark }) => (
  <div className={`rounded-md border overflow-hidden font-mono text-sm ${isDark ? 'bg-[#080b12] border-[#1a2035]' : 'bg-slate-900 border-slate-800'}`}>
    <div className={`flex items-center gap-2 px-4 py-2 border-b ${isDark ? 'border-[#1a2035]' : 'border-slate-800'}`}>
      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
      <span className="ml-2 text-[10px] text-slate-500">{comment}</span>
    </div>
    <pre className="px-4 py-3 text-emerald-400 overflow-x-auto whitespace-pre-wrap break-words">{code}</pre>
  </div>
);

const SectionTitle: React.FC<{
  step: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  iconClass?: string;
  isDark: boolean;
}> = ({ step, title, icon: Icon, iconClass = 'text-[#818cf8]', isDark }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`
      w-7 h-7 rounded-sm flex items-center justify-center shrink-0 font-mono text-[10px] font-black
      ${isDark ? 'bg-[#6366f1]/15 text-[#818cf8]' : 'bg-[#6366f1]/10 text-[#6366f1]'}
    `}>
      {step}
    </div>
    <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
    <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
      {title}
    </h2>
  </div>
);

const Principle: React.FC<{
  title: string;
  body: string;
  accent: string;
  isDark: boolean;
}> = ({ title, body, accent, isDark }) => (
  <div className={`p-4 rounded-md border border-l-2 space-y-1.5 ${isDark ? 'bg-[#080b12] border-[#1a2035]' : 'bg-slate-50 border-slate-200'} ${accent}`}>
    <div className={`text-sm font-bold ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>{title}</div>
    <p className={`text-sm leading-relaxed ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>{body}</p>
  </div>
);

/* ── main component ───────────────────────────────────────────────────────── */
export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({ isDark = true }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const card = isDark ? 'bg-[#0c101a] border-[#1a2035]' : 'bg-white border-slate-200';
  const label = isDark ? 'text-[#4e5d7a]' : 'text-slate-400';
  const sub = isDark ? 'text-[#8b95b0]' : 'text-slate-600';
  const val = isDark ? 'text-[#eef0f6]' : 'text-slate-900';
  const inner = isDark ? 'bg-[#080b12] border-[#1a2035]' : 'bg-slate-50 border-slate-200';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={`pb-6 border-b ${isDark ? 'border-[#1a2035]' : 'border-slate-200'}`}>
        <div className={`flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest mb-3 ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`}>
          <IconDocumentation className="w-3.5 h-3.5" />
          <span>DOSSIER DE INGENIERÍA · Q ELT PLATFORM</span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${val}`}>
          Plataforma de Ingeniería de Datos<br className="hidden sm:block" />
          <span className={isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}> & NLP Financiero</span>
        </h1>
        <p className={`text-sm sm:text-base mt-3 leading-relaxed max-w-2xl ${sub}`}>
          Infraestructura analítica end-to-end diseñada para transformar flujos de noticias no estructuradas
          y series temporales de mercado en variables cuantitativas listas para modelos econométricos.
        </p>
      </div>

      {/* ── Tech stack grid ──────────────────────────────────────────────── */}
      <div className={`rounded-lg border p-5 sm:p-6 ${card}`}>
        <div className={`text-[10px] font-mono font-bold tracking-widest uppercase mb-4 ${label}`}>
          Stack Tecnológico
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { name: 'DuckDB', role: 'OLAP Columnar', color: isDark ? 'text-[#d97706]' : 'text-amber-600', border: 'border-t-[#d97706]/50', icon: IconDuckDB },
            { name: 'FinBERT', role: 'NLP · 768-dim', color: isDark ? 'text-[#a78bfa]' : 'text-purple-600', border: 'border-t-[#a78bfa]/50', icon: IconFinbertLab },
            { name: 'Polars', role: 'Procesamiento', color: isDark ? 'text-[#38bdf8]' : 'text-sky-600', border: 'border-t-[#38bdf8]/50', icon: IconMarket },
            { name: 'Next.js 14', role: 'App Router', color: isDark ? 'text-[#818cf8]' : 'text-indigo-600', border: 'border-t-[#818cf8]/50', icon: IconObservability },
            { name: 'Apache Parquet', role: 'Data Lake', color: isDark ? 'text-[#d97706]' : 'text-amber-600', border: 'border-t-[#d97706]/50', icon: IconPipeline },
            { name: 'HuggingFace', role: 'Transformers', color: isDark ? 'text-[#a78bfa]' : 'text-purple-600', border: 'border-t-[#a78bfa]/50', icon: IconFinbertLab },
            { name: 'Python 3.12', role: 'asyncio · httpx', color: isDark ? 'text-[#10b981]' : 'text-emerald-600', border: 'border-t-[#10b981]/50', icon: IconTerminal },
            { name: 'Binance REST', role: 'Market Data', color: isDark ? 'text-[#38bdf8]' : 'text-sky-600', border: 'border-t-[#38bdf8]/50', icon: IconMarket },
          ].map(({ name, role, color, border, icon: Icon }) => (
            <div key={name} className={`rounded-md border border-t-2 p-3 ${inner} ${border}`}>
              <Icon className={`w-4 h-4 mb-2 ${color}`} />
              <div className={`text-sm font-bold ${val}`}>{name}</div>
              <div className={`text-[10px] font-mono mt-0.5 ${label}`}>{role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. Propuesta de valor ─────────────────────────────────────────── */}
      <section className={`rounded-lg border p-5 sm:p-6 space-y-4 ${card}`}>
        <SectionTitle step="01" title="Propuesta de Valor & Problema Resuelto" icon={IconShield} isDark={isDark} />

        <p className={`text-sm sm:text-base leading-relaxed ${sub}`}>
          En los mercados de capitales modernos, más del{' '}
          <strong className={val}>80% de la información</strong> se origina en formato no estructurado —
          noticias de última hora, comunicados de bancos centrales y comentarios sociales. Los sistemas
          tradicionales de trading no pueden cuantificar el impacto semántico con baja latencia.
        </p>

        <div className={`rounded-md border p-4 space-y-2 ${inner}`}>
          <div className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-4 h-4">
              <rect x="2" y="2" width="12" height="12" rx="0.5" />
              <polyline points="5,8 7,10 11,6" />
            </svg>
            <span>Solución Implementada</span>
          </div>
          <p className={`text-sm leading-relaxed ${sub}`}>
            Un pipeline <strong className={val}>ELT reactivo y columnar</strong> que ingesta cientos de titulares
            por minuto en un Data Lake inmutable (Parquet), ejecuta inferencia paralela con{' '}
            <strong className={val}>FinBERT</strong> y consolida matrices analíticas en{' '}
            <strong className={val}>DuckDB</strong> con consultas sub-milisegundo — sin infraestructura cloud.
          </p>
        </div>
      </section>

      {/* ── 2. Arquitectura Medallion ─────────────────────────────────────── */}
      <section className={`rounded-lg border p-5 sm:p-6 space-y-4 ${card}`}>
        <SectionTitle step="02" title="Arquitectura Técnica Medallion" icon={IconPipeline} iconClass={isDark ? 'text-[#d97706]' : 'text-amber-600'} isDark={isDark} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              layer: 'BRONZE',
              subtitle: 'Data Lake · Raw',
              schema: 'data/bronze/year=…/*.parquet',
              desc: 'Payload bruto e inmutable de Binance REST, feeds RSS y feeds sociales. Particionado por fecha, compresión Snappy.',
              color: isDark ? 'text-[#d97706]' : 'text-amber-600',
              border: 'border-t-[#d97706]/60',
              tagClass: isDark ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/25' : 'bg-amber-50 text-amber-700 border-amber-200',
            },
            {
              layer: 'SILVER',
              subtitle: 'DuckDB · NLP',
              schema: 'silver_social_sentiment',
              desc: 'Deduplicación criptográfica SHA-256, sanitización y scoring batch de FinBERT. Trazabilidad completa por post.',
              color: isDark ? 'text-[#a78bfa]' : 'text-purple-600',
              border: 'border-t-[#a78bfa]/60',
              tagClass: isDark ? 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/25' : 'bg-purple-50 text-purple-700 border-purple-200',
            },
            {
              layer: 'GOLD',
              subtitle: 'Feature Store',
              schema: 'gold_hourly_market_sentiment',
              desc: 'Vista analítica horaria que une precio de cierre, volumen, polaridad media ponderada y clasificación macro.',
              color: isDark ? 'text-[#10b981]' : 'text-emerald-600',
              border: 'border-t-[#10b981]/60',
              tagClass: isDark ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            },
          ].map(({ layer, subtitle, schema, desc, color, border, tagClass }) => (
            <div key={layer} className={`rounded-md border border-t-2 p-4 space-y-3 ${inner} ${border}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-black font-mono ${color}`}>{layer}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs border ${tagClass}`}>{subtitle}</span>
              </div>
              <code className={`block text-[10px] font-mono break-all ${label}`}>{schema}</code>
              <p className={`text-sm leading-relaxed ${sub}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Motor NLP ─────────────────────────────────────────────────── */}
      <section className={`rounded-lg border p-5 sm:p-6 space-y-4 ${card}`}>
        <SectionTitle step="03" title="Motor NLP FinBERT & Cuantificación" icon={IconFinbertLab} iconClass={isDark ? 'text-[#a78bfa]' : 'text-purple-600'} isDark={isDark} />

        <p className={`text-sm sm:text-base leading-relaxed ${sub}`}>
          Se utiliza el modelo Transformer <strong className={val}>ProsusAI/finbert</strong>, basado en BERT
          pre-entrenado con Financial PhraseBank y calibrado para jerga financiera. Para cada texto se
          genera un vector triclase de probabilidades mediante la función Softmax:
        </p>

        <div className={`rounded-md border p-5 space-y-3 ${inner}`}>
          <div className={`text-[10px] font-mono font-bold tracking-widest uppercase ${label}`}>
            Fórmula de Polaridad Normalizada
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-[#10b981]' : 'text-emerald-600'}`}>
            Score = P(Bullish) − P(Bearish) ∈ [−1.00, +1.00]
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { val: '+1.00', label: 'Máxima certeza alcista', color: isDark ? 'text-[#10b981]' : 'text-emerald-600' },
              { val: '0.00', label: 'Neutralidad o equilibrio', color: isDark ? 'text-[#f59e0b]' : 'text-amber-600' },
              { val: '−1.00', label: 'Certeza bajista extrema', color: isDark ? 'text-[#f43f5e]' : 'text-rose-600' },
            ].map(({ val: v, label: l, color }) => (
              <div key={v} className="text-center">
                <div className={`text-lg font-black font-mono ${color}`}>{v}</div>
                <div className={`text-[10px] font-mono mt-0.5 ${label}`}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Principios ────────────────────────────────────────────────── */}
      <section className={`rounded-lg border p-5 sm:p-6 space-y-4 ${card}`}>
        <SectionTitle step="04" title="Rigor de Ingeniería & Principios de Diseño" icon={IconShield} iconClass={isDark ? 'text-[#10b981]' : 'text-emerald-600'} isDark={isDark} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Principle
            title="Cero Datos Mockeados"
            body="Toda la información visible proviene de transacciones reales en DuckDB y llamadas activas a APIs. Si una fuente falla, el sistema lo informa mediante telemetría unificada."
            accent={isDark ? 'border-l-[#818cf8]' : 'border-l-indigo-400'}
            isDark={isDark}
          />
          <Principle
            title="Idempotencia y ACID"
            body="Claves primarias compuestas (asset_ticker, timestamp_open_ms y post_id) garantizan que múltiples ejecuciones del pipeline no generen duplicados ni corrompan el histórico."
            accent={isDark ? 'border-l-[#a78bfa]' : 'border-l-purple-400'}
            isDark={isDark}
          />
          <Principle
            title="Observabilidad Centralizada"
            body="Métricas de latencia en ms, operaciones de disco VACUUM/CHECKPOINT y verificación continua de la salud de conexiones en una única vista de telemetría."
            accent={isDark ? 'border-l-[#10b981]' : 'border-l-emerald-400'}
            isDark={isDark}
          />
          <Principle
            title="Procesamiento Vectorizado"
            body="Aceleración sobre Apache Arrow mediante Polars para sanitización y unión de datasets, alcanzando latencias de transformación de ~40 ms por lote sobre CPU."
            accent={isDark ? 'border-l-[#d97706]' : 'border-l-amber-400'}
            isDark={isDark}
          />
        </div>
      </section>

      {/* ── 5. Competencias ──────────────────────────────────────────────── */}
      <section className={`rounded-lg border p-5 sm:p-6 space-y-4 ${card}`}>
        <SectionTitle step="05" title="Competencias Técnicas Demostradas" icon={IconObservability} isDark={isDark} />

        <div className="space-y-3">
          {[
            {
              area: 'Data Engineering & Lakehouse',
              desc: 'Modelado Medallion, Apache Parquet particionado, OLAP con DuckDB, operaciones VACUUM/CHECKPOINT y persistencia transaccional.',
              color: isDark ? 'text-[#818cf8]' : 'text-indigo-500',
            },
            {
              area: 'Machine Learning & NLP',
              desc: 'Despliegue e inferencia batch con HuggingFace Transformers (FinBERT), distribuciones Softmax, calibración y tokenización financiera.',
              color: isDark ? 'text-[#a78bfa]' : 'text-purple-600',
            },
            {
              area: 'Backend & Sistemas Distribuidos',
              desc: 'Arquitectura asíncrona con asyncio y httpx, orquestación por etapas ELT, resiliencia ante bloqueos y APIs de alta disponibilidad.',
              color: isDark ? 'text-[#10b981]' : 'text-emerald-600',
            },
            {
              area: 'Full-Stack & Observabilidad',
              desc: 'Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, diseño responsive, telemetría de red en vivo y visualización con Recharts.',
              color: isDark ? 'text-[#d97706]' : 'text-amber-600',
            },
          ].map(({ area, desc, color }) => (
            <div key={area} className={`flex gap-3 p-4 rounded-md border ${inner}`}>
              <span className={`text-base font-black leading-none pt-0.5 ${color}`}>›</span>
              <div>
                <div className={`text-sm font-bold ${val}`}>{area}</div>
                <p className={`text-sm mt-1 leading-relaxed ${sub}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Comandos de terminal ───────────────────────────────────────── */}
      <section className={`rounded-lg border p-5 sm:p-6 space-y-4 ${card}`}>
        <SectionTitle step="06" title="Comandos Operativos de Terminal" icon={IconTerminal} iconClass={isDark ? 'text-[#8b95b0]' : 'text-slate-500'} isDark={isDark} />

        <div className="space-y-3">
          <CodeBlock
            comment="# Inicializar Backend Python + Dashboard Next.js simultáneamente"
            code=".\\start.ps1"
            isDark={isDark}
          />
          <CodeBlock
            comment="# Ejecutar pipeline ELT manual desde CLI para Bitcoin (24h)"
            code="python -m src.main --symbol BTCUSDT --hours 24"
            isDark={isDark}
          />
          <CodeBlock
            comment="# Consulta directa SQL a la feature store DuckDB"
            code={`duckdb data/gold/market_intelligence.duckdb \\\n  "SELECT * FROM gold_hourly_market_sentiment LIMIT 5;"`}
            isDark={isDark}
          />
        </div>

        <div className={`mt-2 p-3 rounded-sm border-l-2 border-l-[#818cf8] text-xs font-mono ${isDark ? 'bg-[#080b12] text-[#4e5d7a]' : 'bg-slate-50 text-slate-400'}`}>
          Atajo: abre la Paleta de Comandos con <kbd className={`px-1 py-0.5 rounded-xs border text-[10px] mx-1 ${isDark ? 'bg-[#111622] border-[#232d44] text-[#818cf8]' : 'bg-white border-slate-300 text-indigo-600'}`}>⌘K</kbd> para navegar sin ratón.
        </div>
      </section>

    </div>
  );
};
