export type ViewId = 'overview' | 'runs' | 'tables' | 'quality' | 'model' | 'results' | 'architecture';

export interface ViewDef {
  id: ViewId;
  es: string;
  en: string;
  /** Short label for the navigation strip and the mobile tab bar */
  shortEs: string;
  shortEn: string;
  key: string;
}

export const VIEWS: ViewDef[] = [
  { id: 'overview', es: 'Resumen', en: 'Overview', shortEs: 'Resumen', shortEn: 'Overview', key: '1' },
  { id: 'runs', es: 'Ejecuciones', en: 'Runs', shortEs: 'Ejecutar', shortEn: 'Run', key: '2' },
  { id: 'tables', es: 'Tablas y linaje', en: 'Tables & lineage', shortEs: 'Tablas', shortEn: 'Tables', key: '3' },
  { id: 'quality', es: 'Calidad y estado', en: 'Quality & health', shortEs: 'Estado', shortEn: 'Health', key: '4' },
  { id: 'model', es: 'Modelo NLP (FinBERT)', en: 'NLP model (FinBERT)', shortEs: 'Modelo', shortEn: 'Model', key: '5' },
  { id: 'results', es: 'Resultado en Gold', en: 'Gold output', shortEs: 'Resultado', shortEn: 'Output', key: '6' },
  { id: 'architecture', es: 'Arquitectura y decisiones', en: 'Architecture & decisions', shortEs: 'Arquitectura', shortEn: 'Architecture', key: '7' },
];

export function viewFromHash(hash: string): ViewId {
  const id = hash.replace(/^#\/?/, '');
  return (VIEWS.some((v) => v.id === id) ? id : 'overview') as ViewId;
}
