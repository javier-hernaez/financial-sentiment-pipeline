'use client';

import React from 'react';
import { BookOpen, Terminal, Database, Cpu, Layers } from 'lucide-react';

interface DocumentationGuideProps {
  isDark?: boolean;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({ isDark = true }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="border-b pb-5 border-slate-800/40">
        <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-2">
          <BookOpen className="w-4 h-4" />
          <span>DOCUMENTACIÓN TÉCNICA · TFM DATA ENGINEERING</span>
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Guía de Operaciones del Pipeline ELT &amp; FinBERT
        </h1>
        <p className={`text-xs mt-1.5 leading-relaxed font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Manual técnico de referencia para el monitoreo de datos, clasificación de lenguaje natural y almacenamiento columnar en DuckDB.
        </p>
      </div>

      {/* 1. Qué puede hacer el usuario */}
      <section className={`p-5 rounded-lg border space-y-3 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            1. Funcionalidades de la Plataforma
          </h2>
        </div>
        <div className={`text-xs space-y-2.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <div className="flex items-start gap-2">
            <span className="font-mono text-sky-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Monitoreo del Pipeline ELT:</strong> Supervisa el estado de las capas Bronze, Silver y Gold, verificando la ingesta de fuentes y la salud del lago de datos.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-sky-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Orquestación de Ingesta:</strong> Lanza extracciones bajo demanda desde Binance (precios OHLCV), Reddit y feeds RSS, procesando lotes de forma síncrona o asíncrona.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-sky-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Laboratorio NLP FinBERT:</strong> Evalúa cualquier texto o titular financiero para verificar la probabilidad de polaridad (Bullish, Bearish, Neutral) asignada por el Transformer.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-sky-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Terminal Cuantitativo:</strong> Analiza gráficos de velas sincronizados con la evolución temporal del sentimiento para identificar divergencias.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-mono text-sky-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Explorador y Exportación DuckDB:</strong> Consulta tablas particionadas en Parquet y descarga datasets consolidados en formato CSV.
            </div>
          </div>
        </div>
      </section>

      {/* 2. Arquitectura Medallion */}
      <section className={`p-5 rounded-lg border space-y-4 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            2. Arquitectura de Datos (Medallion)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className={`p-3.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="font-mono font-bold text-sky-400 mb-1">Capa Bronze</div>
            <div className="text-[11px] font-mono text-slate-500 mb-2">data/bronze/ (*.parquet)</div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Almacena el payload crudo e inmutable particionado por año, mes y día. Preserva la fidelidad original de las fuentes.
            </p>
          </div>

          <div className={`p-3.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="font-mono font-bold text-purple-400 mb-1">Capa Silver</div>
            <div className="text-[11px] font-mono text-slate-500 mb-2">silver_social_sentiment</div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Deduplicación semántica, filtrado de URLs y scoring NLP continuo mediante FinBERT con puntuación normalizada [-1, +1].
            </p>
          </div>

          <div className={`p-3.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="font-mono font-bold text-emerald-400 mb-1">Capa Gold</div>
            <div className="text-[11px] font-mono text-slate-500 mb-2">market_intelligence.duckdb</div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Feature store agregada por ventanas horarias. Combina sentimiento ponderado con métricas de precio para análisis.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Modelo NLP y Fórmula de Polaridad */}
      <section className={`p-5 rounded-lg border space-y-3 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            3. Modelo NLP FinBERT
          </h2>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          El motor utiliza los pesos pre-entrenados de <strong>ProsusAI/finbert</strong> optimizados para terminología bursátil. La inferencia produce un vector de probabilidades Softmax en tres clases: Bullish, Bearish y Neutral.
        </p>
        <div className={`p-3 rounded-md font-mono text-xs border ${
          isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          Score = P(Bullish) - P(Bearish) &nbsp;∈ [-1.00, +1.00]
        </div>
      </section>

      {/* 4. Ejecución por Terminal */}
      <section className={`p-5 rounded-lg border space-y-3 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            4. Comandos de Terminal
          </h2>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className={`p-2.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] text-slate-500 mb-1"># Iniciar ambos servicios (Backend + Frontend)</div>
            .\start.ps1
          </div>
          <div className={`p-2.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] text-slate-500 mb-1"># Ejecución manual del pipeline completo</div>
            python -m src.main --source all
          </div>
          <div className={`p-2.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] text-slate-500 mb-1"># Consulta directa en DuckDB desde CLI</div>
            duckdb data/gold/market_intelligence.duckdb "SELECT * FROM gold_hourly_market_sentiment LIMIT 5;"
          </div>
        </div>
      </section>

    </div>
  );
};
