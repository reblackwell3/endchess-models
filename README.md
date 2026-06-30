# endchess-models

Mongoose schemas, document types, and **server-only** domain helpers for EndChess.

## Responsibilities

| Belongs here | Does not belong here |
|--------------|----------------------|
| Mongoose schemas and `*Doc` types | HTTP routes, React UI |
| Collection models (`Game`, `SrsCard`, …) | API DTOs → use `endchess-contracts` |
| Pure/server chess helpers used by workers & batch jobs | RabbitMQ consumers |
| Explorer index delta builders | Frontend imports |

## Import paths

```typescript
// Schemas + models only (preferred for new code)
import { Game, SrsCard, IUser } from 'endchess-models/schemas';

// Server domain helpers (PGN enrichment, position keys, import trim)
import { enrichGameFromPgn, positionKey } from 'endchess-models/lib';

// Legacy — re-exports both (existing consumers)
import { Game, enrichGameFromPgn } from 'endchess-models';
```

## Schema modules (`src/models/`)

| Area | Models |
|------|--------|
| Raw corpus | `Game`, `Puzzle`, `Analysis`, catalog meta |
| User | `User`, `PlayerData`, `ItemEvent`, `SystemImportData` |
| Explorer | `ExplorerPosition`, `PositionOccurrence` |
| SRS | `SrsCard`, `SrsLine` |
| Replay | `ReplayView` |
| Courses | `Course`, `Lesson`, `CourseLessonView` |
| Settings | `UserSettings`, `SettingChangeEvent`, `UserDeviceSettings` |
| Auth audit | `GuestAccountAction` |

## Server lib modules (`src/lib/`)

| Module | Role |
|--------|------|
| `gameEnrichment` | PGN parse + normalize game documents |
| `gameReplay` | UCI/SAN replay on chess.js |
| `explorerIndex` | Pure index delta builders for batch import |
| `positionUtils` | `normalizeFen`, `positionKey` |
| `importJobStatus` | Import job status mutations |
| `trimUserImportedGames` | User import cap enforcement |
| `lichessOpenings` | Opening TSV helpers |
| `lessonTrainPosition`, `lessonLineStart`, `coursePreview` | Course pipeline helpers |
| `contentCatalogMeta` | Catalog timestamp bumps |

These modules intentionally live beside schemas today. A future `endchess-domain` package could absorb `lib/` if we need a stricter boundary; use subpath imports until then.

## Related packages

- **endchess-contracts** — API DTOs and queue message shapes
- **endchess-batch-import** — corpus CLI + explorer index writes
- **endchess-workers** — user import + analysis consumers
