# Market Intelligence Engine: Financial Sentiment ETL

Motor de Inteligencia de Mercado diseñado bajo arquitectura **Medallion (Bronze / Silver / Gold)**. Ingiere de forma asíncrona datos de mercado financiero (OHLCV de Binance), sentimiento social (Reddit / Noticias) y macro-sentimiento (Crypto Fear & Greed Index), aplicando modelos **NLP (FinBERT)** para generar un conjunto de datos consolidado en **DuckDB** listo para modelos de Machine Learning y estrategias de trading algorítmico.

---

## 🏛️ Arquitectura del Sistema

- **Extracción Asíncrona:** Python `asyncio` + `httpx` con reintentos exponenciales (*Exponential Backoff*).
- **Data Lake (Bronze):** Ingestión de datos crudos inmutables particionados por fecha (`year=YYYY/month=MM/day=DD/`).
- **Capa Silver (Limpieza & FinBERT):** Limpieza de strings vectorizada con `Polars` e inferencia batch con `ProsusAI/finbert`.
- **Capa Gold (DuckDB Feature Store):** Vistas y tablas analíticas que unen series temporales financieras con el sentimiento horario agregado.

Para el informe de diseño profundo y PRD institucional, consultar [docs/PRD.md](docs/PRD.md).

---

## 🚀 Inicio Rápido (Setup Básico)

### 1. Crear entorno virtual e instalar dependencias
```bash
py -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

### 2. Configurar variables de entorno
```bash
copy .env.example .env
```

### 3. Ejecutar el Pipeline
Ejecuta la ingestión completa y generación del dataset Gold:
```bash
# Modo rápido de integración (usa mock NLP para validar extracción y DuckDB inmediatamente)
.\venv\Scripts\python -m src.main --symbol BTCUSDT --hours 24 --mock-nlp

# Modo con inferencia FinBERT completa
.\venv\Scripts\python -m src.main --symbol BTCUSDT --hours 24
```

### 4. Ejecutar Pruebas Unitarias
```bash
.\venv\Scripts\pytest tests/ -v
```

---

## 📂 Estructura del Repositorio
```
sentiment-analysis/
├── docs/
│   └── PRD.md                   # Product Requirements Document & Arquitectura
├── src/
│   ├── configs/                 # Configuración Pydantic & variables de entorno
│   ├── extractors/              # Extractores asíncronos (Binance, FearGreed, Social)
│   ├── storage/                 # Data Lake Bronze y Almacén DuckDB
│   ├── nlp/                     # Limpieza con Polars y motor FinBERT
│   ├── pipeline/                # Orquestador del ciclo E -> L -> T
│   └── main.py                  # CLI ejecutable
└── tests/                       # Suite de pruebas unitarias
```
