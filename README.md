# StreamForge — Large-Scale CSV Ingestion Platform

StreamForge is a production-minded engineering showcase for importing multi-gigabyte CSV datasets without blocking Node.js or exhausting process memory. It combines a NestJS streaming pipeline with a recruiter-friendly React operations console.

**Live demo:** https://tanjir-mahabub.github.io/streamforge-csv-ingestion/

## Live product experience

The public frontend runs as a safe interactive simulation: upload any CSV, start/pause/resume the pipeline, monitor throughput and ETA, inspect data-quality signals, search/filter records, and explore the architecture. No visitor data is uploaded; selected files are used only to estimate workload size in the browser.

## Engineering highlights

- Node.js streams with backpressure for constant-memory ingestion
- Persisted checkpoints for refresh/restart recovery
- Database lock preventing concurrent duplicate jobs
- Validation, normalization, deduplication, and skipped-row accounting
- Idempotent batched persistence through Prisma
- Polling-based progress designed for long-running operations
- Cursor pagination and virtualized customer rendering
- Separation between import, customer, persistence, and presentation modules
- Responsive operations console with accessible light/dark themes

## Architecture decisions

| Requirement | Decision |
| --- | --- |
| 2GB+ CSV input | Stream from disk; never load the file into memory |
| Backpressure | Await database batches before consuming more rows |
| Crash recovery | Persist last processed row and job state |
| Duplicate safety | Normalized identifiers and idempotent writes |
| Live observability | Durable progress plus low-frequency polling |
| Large result sets | Cursor pagination and virtualized rendering |
| Portfolio availability | Browser-local simulation with no credentials |

## Monorepo

```text
apps/frontend  React 19 + TypeScript + Vite operations console
apps/backend   NestJS + Prisma streaming ingestion API
diagrams       Import-flow architecture assets
```

## Run locally

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
pnpm setup
pnpm dev
```

The API expects MongoDB and a configured `CSV_FILE_PATH`. The standalone frontend remains functional without either dependency.

## Quality gates

```bash
pnpm --filter @streamforge/frontend lint
pnpm --filter @streamforge/frontend build
pnpm --filter @streamforge/backend test -- --runInBand
pnpm --filter @streamforge/backend build
```

## Production roadmap

For a multi-tenant release: object-storage uploads, queue-backed workers, per-tenant concurrency controls, schema mapping, dead-letter exports, webhooks, OpenTelemetry traces, and role-based access control.
