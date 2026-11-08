// Engineering decisions, written against the code they describe.
export interface Decision {
  es: { title: string; short: string; long: string };
  en: { title: string; short: string; long: string };
}

export const DECISIONS: Decision[] = [
  {
    es: {
      title: 'DuckDB en lugar de Postgres',
      short: 'La carga es analítica y de un solo escritor. Un archivo, sin servidor, y SQL columnar sobre los datos.',
      long: 'Las consultas son agregaciones por hora sobre pocas tablas y el pipeline es el único que escribe (la API lo garantiza con un candado). DuckDB da SQL columnar en un único archivo, sin servidor que mantener, y se lleva bien con Arrow y Polars sin copias intermedias.',
    },
    en: {
      title: 'DuckDB instead of Postgres',
      short: 'Analytical, single-writer workload. One file, no server, columnar SQL over the data.',
      long: 'Queries are hourly aggregations over a few tables and the pipeline is the only writer (the API enforces it with a lock). DuckDB gives columnar SQL in a single file with no server to run, and exchanges data with Arrow and Polars without intermediate copies.',
    },
  },
  {
    es: {
      title: 'Bronze inmutable y particionado',
      short: 'Guardar el crudo permite cambiar la limpieza o el modelo y reprocesar sin depender de que la API devuelva lo mismo.',
      long: 'Cada extracción se escribe tal cual en Parquet bajo year=/month=/day=, con un nombre de archivo con marca de tiempo, y nunca se modifica. La etapa transform, lanzada sola, relee las particiones recientes de Bronze: si cambio la limpieza o el modelo, reproceso sin volver a llamar a Binance ni a Reddit.',
    },
    en: {
      title: 'Immutable, partitioned Bronze',
      short: 'Keeping the raw data lets me change cleaning or the model and reprocess without relying on the API returning the same thing.',
      long: 'Every extraction is written as-is to Parquet under year=/month=/day= with a timestamped file name, and is never modified. Run on its own, the transform stage re-reads recent Bronze partitions: if cleaning or the model changes, I reprocess without calling Binance or Reddit again.',
    },
  },
  {
    es: {
      title: 'Idempotencia por clave primaria',
      short: 'Cada tabla Silver tiene clave natural y se carga con upsert. Lanzar el pipeline dos veces da el mismo resultado.',
      long: 'silver_market_prices usa (asset_ticker, timestamp_open_ms) y silver_social_sentiment usa post_id. Las cargas son INSERT OR REPLACE desde una tabla Arrow registrada, así que re-ejecutar una ventana que se solapa actualiza filas en lugar de duplicarlas.',
    },
    en: {
      title: 'Idempotency through primary keys',
      short: 'Every Silver table has a natural key and is loaded with an upsert. Running the pipeline twice gives the same result.',
      long: 'silver_market_prices uses (asset_ticker, timestamp_open_ms) and silver_social_sentiment uses post_id. Loads are INSERT OR REPLACE from a registered Arrow table, so re-running an overlapping window updates rows instead of duplicating them.',
    },
  },
  {
    es: {
      title: 'Gold como vista, no como copia',
      short: 'La unión por hora se calcula al leer: no hay una segunda tabla que mantener sincronizada.',
      long: 'gold_hourly_market_sentiment es una vista que une velas y titulares por timestamp_hour y agrega menciones alcistas, bajistas y neutrales. Con este volumen, calcularla al leer es barato y elimina una clase entera de errores de sincronización.',
    },
    en: {
      title: 'Gold as a view, not a copy',
      short: 'The hourly join is computed on read: there is no second table to keep in sync.',
      long: 'gold_hourly_market_sentiment is a view joining candles and headlines on timestamp_hour and aggregating bullish, bearish and neutral mentions. At this volume computing it on read is cheap and removes a whole class of sync bugs.',
    },
  },
  {
    es: {
      title: 'FinBERT por lotes, con alternativa',
      short: 'La inferencia va en lotes. Si el modelo no carga, un motor heurístico mantiene el pipeline en marcha, y los tests usan un modo simulado.',
      long: 'Los titulares se puntúan en lotes (NLP_BATCH_SIZE) en un hilo aparte para no bloquear la API. Si transformers o el modelo no están disponibles, el motor cae a un clasificador léxico y el estado lo indica. En CI se fuerza el modo simulado para no descargar el modelo.',
    },
    en: {
      title: 'Batched FinBERT, with a fallback',
      short: 'Inference runs in batches. If the model fails to load a heuristic engine keeps the pipeline going, and tests use a mock mode.',
      long: 'Headlines are scored in batches (NLP_BATCH_SIZE) on a worker thread so the API stays responsive. If transformers or the model are unavailable the engine falls back to a lexicon classifier and the health view says so. CI forces the mock mode so the model is never downloaded.',
    },
  },
  {
    es: {
      title: 'Extracción concurrente y tolerante',
      short: 'asyncio.gather con return_exceptions: una fuente caída no tumba la ejecución.',
      long: 'Binance y las fuentes de noticias se extraen a la vez. Binance reintenta con backoff exponencial con jitter y respeta Retry-After. Si una fuente de noticias falla, se registra el motivo y las demás se cargan igualmente.',
    },
    en: {
      title: 'Concurrent, fault-tolerant extraction',
      short: 'asyncio.gather with return_exceptions: one source going down does not fail the run.',
      long: 'Binance and the news sources are extracted at the same time. Binance retries with exponential backoff plus jitter and honours Retry-After. If a news source fails the reason is logged and the rest are still loaded.',
    },
  },
  {
    es: {
      title: 'Cada ejecución queda registrada',
      short: 'pipeline_runs guarda etapa, filas, tiempos por fase y error, también cuando falla.',
      long: 'El orquestador mide extract, load, transform y gold por separado y escribe una fila en pipeline_runs al terminar, con éxito o con error. Este panel lee el historial de ahí, no de la memoria del navegador.',
    },
    en: {
      title: 'Every run is recorded',
      short: 'pipeline_runs stores stage, rows, per-phase timings and the error, including failures.',
      long: 'The orchestrator times extract, load, transform and gold separately and writes a row to pipeline_runs when it finishes, successfully or not. This dashboard reads the history from there, not from browser memory.',
    },
  },
];

export const STACK = [
  { name: 'Python', detail: 'asyncio, httpx' },
  { name: 'Polars', detail: '' },
  { name: 'FinBERT', detail: 'transformers, torch' },
  { name: 'DuckDB', detail: '' },
  { name: 'Parquet', detail: 'pyarrow' },
  { name: 'FastAPI', detail: '' },
  { name: 'Next.js', detail: '' },
  { name: 'Docker', detail: '' },
  { name: 'GitHub Actions', detail: '' },
];
