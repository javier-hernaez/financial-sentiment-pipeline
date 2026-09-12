'use client';

import React, { useState } from 'react';
import { BookOpen, Zap, Cpu, Database, ChevronDown, ChevronUp, ArrowRight, Play, LineChart, FileDown } from 'lucide-react';

interface DocumentationGuideProps {
  isDark?: boolean;
  onNavigate?: (view: string) => void;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({
  isDark = true,
  onNavigate,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: '¿Cómo ejecuto el pipeline de datos para actualizar noticias y precios?',
      a: 'Puedes hacerlo desde el panel pulsando el botón "Ejecutar Pipeline" en la cabecera o navegando a "Orquestación ELT" en la barra lateral. También puedes ejecutarlo desde la terminal con el comando: python src/main.py --source all.',
    },
    {
      q: '¿Qué significa el score de polaridad (-1.00 a +1.00)?',
      a: 'El modelo FinBERT calcula las probabilidades para tres clases: Bullish (positivo), Bearish (negativo) y Neutral. El score final se obtiene como: Score = P(Bullish) - P(Bearish). Valores cercanos a +1.00 indican optimismo acentuado, 0.00 neutralidad y -1.00 pánico o pesimismo.',
    },
    {
      q: '¿Dónde se guardan los datos y cómo consultarlos con Python/SQL?',
      a: 'Los datos finales residen en data/gold/market_intelligence.duckdb. Al tratarse de DuckDB, puedes consultarlos directamente en Python sin servidores externos usando: conn = duckdb.connect("data/gold/market_intelligence.duckdb") y ejecutar consultas SQL sobre la tabla gold_hourly_market_sentiment.',
    },
    {
      q: '¿Qué mide la señal de Divergencia Precio vs. Sentimiento?',
      a: 'Detecta discrepancias cuantitativas entre la dirección del precio en velas horarias y el sentimiento social. Por ejemplo, una divergencia alcista ocurre cuando el precio cae pero el sentimiento de los titulares repunta fuertemente al alza, anticipando posibles giros de mercado.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Minimalist Document Header */}
      <div className="space-y-2 border-b border-slate-800/40 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
          <BookOpen className="w-4 h-4" />
          <span>Manual de Operaciones &amp; Arquitectura Técnica</span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Guía del Sistema: Pipeline ELT &amp; FinBERT Lakehouse
        </h1>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Este entorno integra un pipeline asíncrono de ingeniería de datos (arquitectura Medallion con DuckDB) 
          y procesamiento de lenguaje natural financiero (modelo Transformer FinBERT) para monitorizar el pulso del mercado.
        </p>
      </div>

      {/* Section 1: ¿Qué puedes hacer en la plataforma? */}
      <section className="space-y-4">
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          1. ¿Qué puedes hacer en la plataforma?
        </h2>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          La plataforma está organizada en cuatro tareas operativas directas:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card 1 */}
          <div
            className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-blue-400 mb-1.5">
              <Play className="w-4 h-4" />
              <span>Ejecutar la Ingesta (Orquestación ELT)</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Lanza la extracción de datos desde Binance, Reddit y Fear &amp; Greed, aplica el pipeline de limpieza y calcula el scoring NLP con registro de logs en tiempo real.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('orchestration')}
                className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Ir a Orquestación ELT →
              </button>
            )}
          </div>

          {/* Card 2 */}
          <div
            className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-purple-400 mb-1.5">
              <Cpu className="w-4 h-4" />
              <span>Analizar Textos en el Laboratorio NLP</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Introduce cualquier titular financiero o noticia personalizada para someterla a inferencia con el modelo FinBERT y observar la distribución probabilística de polaridad.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('nlp')}
                className="mt-3 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Abrir Laboratorio FinBERT →
              </button>
            )}
          </div>

          {/* Card 3 */}
          <div
            className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-400 mb-1.5">
              <LineChart className="w-4 h-4" />
              <span>Examinar la Terminal de Mercado</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Visualiza velas horarias sincronizadas con la polaridad social y las señales algorítmicas de divergencia cuantitativa (Bullish / Bearish Divergence).
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('terminal')}
                className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Abrir Terminal de Mercado →
              </button>
            )}
          </div>

          {/* Card 4 */}
          <div
            className={`p-4 rounded-xl border transition ${
              isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400 mb-1.5">
              <Database className="w-4 h-4" />
              <span>Explorar el Lakehouse &amp; Exportar Datos</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Inspecciona las particiones Bronze (Parquet), las tablas transformadas Silver y la feature store Gold en DuckDB, con opción de descarga directa en CSV.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('medallion')}
                className="mt-3 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Explorar Data Lake Bronze →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Arquitectura Medallion */}
      <section className="space-y-4">
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          2. Arquitectura de Datos (Medallion)
        </h2>
        <div
          className={`p-5 rounded-xl border divide-y ${
            isDark ? 'bg-[#101726] border-slate-800 divide-slate-800' : 'bg-white border-slate-200 divide-slate-100'
          }`}
        >
          {/* Bronze */}
          <div className="pb-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-400 uppercase">Capa Bronze (Cruda)</span>
              <span className="text-[10px] text-slate-500 font-mono">data/bronze/</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Almacena los datos extraídos de Binance (precios OHLCV), Reddit (posts y comentarios) y Fear &amp; Greed en formato Parquet inmutable, particionados por año, mes y día.
            </p>
          </div>

          {/* Silver */}
          <div className="py-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-400 uppercase">Capa Silver (Limpia &amp; NLP)</span>
              <span className="text-[10px] text-slate-500 font-mono">silver_social_sentiment</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Aplica deduplicación, eliminación de URLs, tokenización y clasificación de sentimiento con FinBERT, generando un score numérico y una etiqueta probabilística por titular.
            </p>
          </div>

          {/* Gold */}
          <div className="pt-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase">Capa Gold (Analítica DuckDB)</span>
              <span className="text-[10px] text-slate-500 font-mono">gold_hourly_market_sentiment</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Agrega los datos en ventanas temporales de 1 hora, uniendo las métricas de sentimiento medio con la acción del precio y calculando indicadores técnicos y divergencias.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Preguntas Frecuentes (Minimalist Accordion) */}
      <section className="space-y-4">
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          3. Preguntas Frecuentes
        </h2>
        <div className="space-y-2">
          {faqs.map((f, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition ${
                  isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-xs sm:text-sm"
                >
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{f.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className={`px-4 pb-4 pt-1 text-xs leading-relaxed border-t ${
                    isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-600'
                  }`}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
