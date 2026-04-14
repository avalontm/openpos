# AGENTS.md - Development Guide for AI Agents

## Project Overview

**POS (Point of Sale) Terminal UI** built with Bun, Ink (React for terminal), Zustand (state management), Drizzle ORM (SQLite).

- Entry: `src/app.tsx`
- Database: `pos.db` (SQLite with WAL mode)
- Schema: `src/db/schema.ts`

---

## Commands

```bash
# Development
bun run dev        # Run app in development
bun run start     # Alias for dev
bun run seed      # Seed database with sample products
bun run import   # Import products from CSV (src/db/import-csv.ts)

# Build (creates standalone .exe)
bun build src/app.tsx --compile --outfile pos.exe

# Type checking (strict mode - run before committing)
tsc --noEmit

# Testing
# No test framework currently installed. To add tests:
# bun add -d vitest @vitest/ui
# bun test src/path/to/test.test.ts  # Run single test file
# bun test --watch                   # Watch mode
```

---

## Code Style Guidelines

### File Organization
```
src/
├── app.tsx              # Entry point
├── modules/pos/        # POS feature
│   ├── PosScreen.tsx  # Main screen
│   └── components/   # POS components
├── shared/            # Utilities
│   ├── theme.ts      # Colors, formatters
│   └── components/  # UI components (Panel, ScrollBox, Button, etc.)
├── store/             # Zustand stores
│   └── cart.ts      # Cart state
└── db/                # Database
    ├── client.ts    # Drizzle client
    ├── schema.ts   # Table definitions
    └── seed.ts     # Seed data
```

### TypeScript
- **Strict mode** enabled - all strict flags are on
- Use `type` for shapes, `interface` for extensible types
- Use `typeof X.$inferSelect` for Drizzle row types:
  ```ts
  import { products } from "./schema.js";
  export type Product = typeof products.$inferSelect;
  ```
- Import types explicitly: `import type { Product } from "..."`

### Imports
- **Path aliases** in `tsconfig.json`:
  - `@db/*` → `src/db/*`
  - `@store/*` → `src/store/*`
  - `@shared/*` → `src/shared/*`
  - `@modules/*` → `src/modules/*`
- **REQUIRED: Use `.js` extension** for Bun compatibility:
  ```ts
  import { useCart } from "@store/cart.js";        // ✓ correct
  import { Panel } from "@shared/components/index.js"; // ✓ correct
  import { db } from "@db/client.js";             // ✓ correct
  ```

### React/Component Patterns
- Functional components with explicit return types
- Prefer `React.useState` over hook imports for Ink compatibility
- Use Ink hooks: `useInput`, `useApp`, `useStdin`
- Handle terminal resize:
  ```ts
  process.stdout.on("resize", () => {
    setSize({ width: process.stdout.columns, height: process.stdout.rows });
  });
  ```

### Zustand Store
- Define store type explicitly with all properties
- Use `create<StoreType>()` for type inference
- Use functional updates: `set(s => ({ ...s, count: s.count + 1 }))`
- Access computed state via `get()`:
  ```ts
  const total = useCart(s => s.getTotal()); // get() for computed values
  ```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PosScreen.tsx`, `CartPanel.tsx` |
| Files | camelCase | `cart.ts`, `theme.ts` |
| Types | PascalCase | `CartItem`, `Product` |
| Constants | PascalCase | `PAY_METHODS`, `TAX_RATE` |
| Database tables | PascalCase | `products`, `sales` |

### Error Handling
- Handle DB errors in `useEffect` with try-catch
- Display errors in status bar component
- Log errors appropriately for debugging

### UI/Theme
- Use `theme` object from `src/shared/theme.ts` for colors
- Use formatting helpers: `fmt.money()`, `fmt.ticket()`
- Minimal terminal design: box-drawing borders (┌─┐│└┘), horizontal dividers (──)

#### Available UI Components
```ts
import { Panel, ScrollBox, Button, Input, Badge, Spinner } from "@shared/components/index.js";
```

---

## Database Schema

### Tables
- **products**: `id`, `sku` (unique), `name`, `price`, `category`, `stock`
- **sales**: `id`, `ticket`, `total`, `tax`, `method`, `items` (JSON), `createdAt`

### Row Types
```ts
import { products, sales } from "./schema.js";
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
```

---

## Dependencies

### Runtime
- `ink` 7.0.0 - Terminal UI framework (React for CLI)
- `react` 19 - UI library
- `zustand` 4.5.2 - State management
- `drizzle-orm` 0.45.2 - SQL ORM

### Dev
- `typescript` 5.4.5 (strict mode)
- `drizzle-kit` 0.31.10 - Database migrations
- `@types/react` 19

---

## Notes

- No linting/formatting tools (Prettier/ESLint can be added if needed)
- No test framework - Vitest recommended for future tests
- Database auto-initializes on app start (creates tables if missing)
- Use Bun's built-in `--compile` for building standalone .exe
- Run `tsc --noEmit` before committing to catch type errors