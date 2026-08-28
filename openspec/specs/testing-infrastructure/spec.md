# Testing Infrastructure

## Capability Overview

Setup testing framework (Vitest) dan CI workflow untuk menjalankan lint, typecheck, dan test secara otomatis.

## Components

### Vitest Setup

- **Package:** vitest
- **Config:** `server/vitest.config.ts`
- **Environment:** Node
- **Test pattern:** `src/**/*.test.ts`

### Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

### CI Workflow

- **File:** `.github/workflows/ci.yml`
- **Trigger:** Push to any branch + PR to main
- **Jobs:**
  1. lint (eslint)
  2. typecheck (tsc)
  3. test-server (vitest)

### Testing Strategy

- Unit tests dengan mock database (tidak perlu real DB)
- Coverage target: Service ≥80%, Controller ≥60%
- Colocated test files: `*.test.ts` di samping source file
