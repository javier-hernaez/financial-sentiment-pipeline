export type Locale = 'es' | 'en';

export interface Translations {
  // Brand & Nav
  appName: string;
  brandTag: string;
  searchPlaceholder: string;
  commandPalette: string;
  operatorProfile: string;

  // Views
  viewDashboard: string;
  viewTerminal: string;
  viewNlp: string;
  viewOrchestration: string;
  viewWarehouse: string;
  viewObservability: string;
  viewDocumentation: string;

  // Header & Status
  consoleTitle: string;
  consoleRunning: string;
  consoleOffline: string;
  recordsConsolidated: string;
  runPipeline: string;
  syncPipeline: string;
  running: string;
  exportCsv: string;
  activeBatch: string;
  online: string;
  offline: string;

  // Medallion Flow
  medallionFlow: string;
  bronzeTitle: string;
  bronzeContext: string;
  bronzeUnit: string;
  silverTitle: string;
  silverContext: string;
  silverUnit: string;
  goldTitle: string;
  goldContext: string;
  goldUnit: string;

  // Metrics / Tabs
  tabMetrics: string;
  tabLogs: string;
  tabTables: string;
  latencyDuckdb: string;
  latencyBinance: string;
  latencyFinbert: string;
  latencyMacro: string;
  storage: string;

  // FinBERT Lab
  finbertTitle: string;
  finbertInstruction: string;
  finbertPlaceholder: string;
  finbertEvaluate: string;
  finbertInferring: string;
  finbertClear: string;
  finbertExamples: string;
  finbertPolarity: string;

  // Chart
  chartPolarityTitle: string;
  chartLastHour: string;
  consensusBullish: string;
  consensusBearish: string;
  consensusNeutral: string;
}

export const translations: Record<Locale, Translations> = {
  es: {
    appName: 'ELT project',
    brandTag: 'Medallion Lakehouse',
    searchPlaceholder: 'Buscar vistas, tablas o comandos...',
    commandPalette: 'Paleta de Comandos',
    operatorProfile: 'Perfil del Operador',

    viewDashboard: 'Dashboard ELT',
    viewTerminal: 'Terminal de Precios',
    viewNlp: 'Laboratorio FinBERT',
    viewOrchestration: 'Orquestación',
    viewWarehouse: 'Almacén DuckDB',
    viewObservability: 'Observabilidad',
    viewDocumentation: 'Documentación',

    consoleTitle: 'Consola de Ingesta & Lakehouse',
    consoleRunning: 'Ejecutando Pipeline ELT...',
    consoleOffline: 'Desconectado',
    recordsConsolidated: 'registros consolidados en DuckDB',
    runPipeline: 'Ejecutar Pipeline',
    syncPipeline: 'Sincronizar Pipeline',
    running: 'Procesando...',
    exportCsv: 'Exportar Gold CSV',
    activeBatch: 'Lote Activo · Tiempo Real',
    online: 'ONLINE',
    offline: 'OFFLINE',

    medallionFlow: 'Flujo Medallion',
    bronzeTitle: 'Bronze',
    bronzeContext: 'Particiones Parquet Snappy (Raw inmutable)',
    bronzeUnit: 'particiones',
    silverTitle: 'Silver NLP',
    silverContext: 'Titulares analizados y enriquecidos con FinBERT',
    silverUnit: 'titulares',
    goldTitle: 'Gold OLAP',
    goldContext: 'Ventanas horarias consolidadas con features Alpha',
    goldUnit: 'horas',

    tabMetrics: 'Métricas',
    tabLogs: 'Logs',
    tabTables: 'Tablas',
    latencyDuckdb: 'DuckDB OLAP',
    latencyBinance: 'Binance REST',
    latencyFinbert: 'FinBERT NLP',
    latencyMacro: 'Índice Macro',
    storage: 'Almacenamiento',

    finbertTitle: 'Laboratorio de Inferencia FinBERT',
    finbertInstruction: 'Introduce un titular o rumor financiero para clasificarlo con FinBERT',
    finbertPlaceholder: "Escribe o pega texto financiero... Ej: 'BlackRock compra 10,000 BTC tras aprobación de nuevo ETF spot'",
    finbertEvaluate: 'Evaluar Polaridad',
    finbertInferring: 'Infiriendo...',
    finbertClear: 'Limpiar',
    finbertExamples: 'Ejemplos:',
    finbertPolarity: 'Polaridad FinBERT',

    chartPolarityTitle: 'Polaridad FinBERT Agregada',
    chartLastHour: 'Última hora',
    consensusBullish: 'Consenso Alcista',
    consensusBearish: 'Consenso Bajista',
    consensusNeutral: 'Consenso Neutral',
  },
  en: {
    appName: 'ELT project',
    brandTag: 'Medallion Lakehouse',
    searchPlaceholder: 'Search views, tables or commands...',
    commandPalette: 'Command Palette',
    operatorProfile: 'Operator Profile',

    viewDashboard: 'ELT Dashboard',
    viewTerminal: 'Price Terminal',
    viewNlp: 'FinBERT Lab',
    viewOrchestration: 'Orchestration',
    viewWarehouse: 'DuckDB Warehouse',
    viewObservability: 'Observability',
    viewDocumentation: 'Documentation',

    consoleTitle: 'Ingestion & Lakehouse Console',
    consoleRunning: 'Running ELT Pipeline...',
    consoleOffline: 'Disconnected',
    recordsConsolidated: 'consolidated records in DuckDB',
    runPipeline: 'Run Pipeline',
    syncPipeline: 'Sync Pipeline',
    running: 'Processing...',
    exportCsv: 'Export Gold CSV',
    activeBatch: 'Active Batch · Real-Time',
    online: 'ONLINE',
    offline: 'OFFLINE',

    medallionFlow: 'Medallion Flow',
    bronzeTitle: 'Bronze',
    bronzeContext: 'Parquet Snappy Partitions (Raw Immutable)',
    bronzeUnit: 'partitions',
    silverTitle: 'Silver NLP',
    silverContext: 'Headlines analyzed and enriched with FinBERT',
    silverUnit: 'headlines',
    goldTitle: 'Gold OLAP',
    goldContext: 'Consolidated hourly windows with Alpha features',
    goldUnit: 'hours',

    tabMetrics: 'Metrics',
    tabLogs: 'Logs',
    tabTables: 'Tables',
    latencyDuckdb: 'DuckDB OLAP',
    latencyBinance: 'Binance REST',
    latencyFinbert: 'FinBERT NLP',
    latencyMacro: 'Macro Index',
    storage: 'Storage',

    finbertTitle: 'FinBERT Inference Laboratory',
    finbertInstruction: 'Enter a headline or market news to classify with FinBERT',
    finbertPlaceholder: "Type or paste financial text... E.g.: 'BlackRock acquires 10,000 BTC following spot ETF approval'",
    finbertEvaluate: 'Evaluate Polarity',
    finbertInferring: 'Inferring...',
    finbertClear: 'Clear',
    finbertExamples: 'Presets:',
    finbertPolarity: 'FinBERT Polarity',

    chartPolarityTitle: 'FinBERT Aggregate Polarity',
    chartLastHour: 'Last hour',
    consensusBullish: 'Bullish Consensus',
    consensusBearish: 'Bearish Consensus',
    consensusNeutral: 'Neutral Consensus',
  },
};
