# Agent 1: Infrastructure Setup

## Objective
Set up the foundational infrastructure for the Radar analytics platform, including project structure, core dependencies, and development environment.

## Dependencies
- Existing turborepo setup
- Node.js/Bun runtime
- Git repository

## Scope of Work

### 1. Create New App: Ingest Service
```bash
# Create ingest app for high-performance event collection
cd apps/
mkdir ingest
cd ingest
bun init
```

**Package.json configuration:**
```json
{
  "name": "ingest",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "build": "bun build src/index.ts --target=bun --outdir=dist",
    "start": "bun run dist/index.js",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "check": "biome check . --write"
  }
}
```

### 2. Create Core Packages

#### @repo/ai Package
```bash
cd packages/
mkdir ai
cd ai
bun init
```

**Setup Mastra AI framework:**
```json
{
  "name": "@repo/ai",
  "dependencies": {
    "@mastra/core": "latest",
    "@mastra/tools": "latest",
    "openai": "^4.0.0",
    "zod": "^3.24.3"
  }
}
```

#### @repo/analytics Package
```bash
cd packages/
mkdir analytics
cd analytics
bun init
```

**Core analytics engine setup:**
```json
{
  "name": "@repo/analytics",
  "dependencies": {
    "date-fns": "^4.2.0",
    "decimal.js": "^10.4.3",
    "zod": "^3.24.3"
  }
}
```

#### @repo/events Package
```bash
cd packages/
mkdir events
cd events
bun init
```

**Event schemas and types:**
```json
{
  "name": "@repo/events",
  "dependencies": {
    "zod": "^3.24.3",
    "superjson": "^2.2.2"
  }
}
```

#### @repo/jobs Package
```bash
cd packages/
mkdir jobs
cd jobs
bun init
```

**Inngest setup:**
```json
{
  "name": "@repo/jobs",
  "dependencies": {
    "inngest": "^3.29.2",
    "zod": "^3.24.3"
  }
}
```

#### @repo/sdk Package
```bash
cd packages/
mkdir sdk
cd sdk
bun init
```

**Client SDK setup:**
```json
{
  "name": "@repo/sdk",
  "dependencies": {
    "superjson": "^2.2.2"
  },
  "exports": {
    ".": "./src/index.ts",
    "./react": "./src/react/index.ts",
    "./next": "./src/next/index.ts"
  }
}
```

### 3. Update Database Package for Drizzle

Replace Prisma with Drizzle ORM in `packages/database/package.json`:
```json
{
  "name": "@repo/database",
  "dependencies": {
    "drizzle-orm": "^0.36.4",
    "@neondatabase/serverless": "^0.11.2",
    "postgres": "^3.5.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.1",
    "@types/pg": "^8.11.10"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 4. Update Rate Limit Package

Update `packages/rate-limit/package.json`:
```json
{
  "name": "@repo/rate-limit",
  "dependencies": {
    "@upstash/ratelimit": "^2.0.6",
    "@upstash/redis": "^1.38.2"
  }
}
```

### 5. Environment Configuration

Create `.env.example` at root:
```env
# Database
DATABASE_URL=

# Clerk Auth (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AI Services
OPENROUTER_API_KEY=
MASTRA_API_KEY=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Analytics
NEXT_PUBLIC_RADAR_ENDPOINT=http://localhost:4000
RADAR_SECRET_KEY=
```

### 6. Update Root Configuration

Update `turbo.json` to include new apps and packages:
```json
{
  "globalEnv": [
    "DATABASE_URL",
    "OPENROUTER_API_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "INNGEST_EVENT_KEY",
    "RADAR_SECRET_KEY"
  ],
  "pipeline": {
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true
    },
    "ingest:dev": {
      "dependsOn": ["@repo/events#build", "@repo/rate-limit#build"]
    }
  }
}
```

### 7. TypeScript Configuration

Create TypeScript configs for new packages using the shared configs:
- Each package should extend `@repo/typescript-config/base.json`
- React packages should extend `@repo/typescript-config/react-library.json`

### 8. Development Scripts

Update root `package.json`:
```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=web",
    "dev:api": "turbo dev --filter=api", 
    "dev:ingest": "turbo dev --filter=ingest",
    "dev:all": "turbo dev --filter=web --filter=api --filter=ingest"
  }
}
```

## Testing Requirements

1. Run `bun install` at root - all dependencies should install
2. Run `bun typecheck` - no TypeScript errors
3. Run `bun lint` - all code passes Biome checks
4. Verify new package structure with `ls -la packages/`
5. Test that each package exports correctly

## Success Criteria

- ✅ Ingest app created and configured
- ✅ All new packages created with proper dependencies
- ✅ Database package updated to use Drizzle
- ✅ Rate limiting package updated for Upstash
- ✅ Environment variables documented
- ✅ TypeScript configurations in place
- ✅ All packages listed in turbo.json

## Handoff to Next Agent

Agent 2 will need:
- Working package structure
- Drizzle ORM configured in database package
- Environment variables template
- Clean TypeScript setup

## Implementation Order

1. Create ingest app structure
2. Create all package directories
3. Set up package.json files
4. Update existing packages (database, rate-limit)
5. Configure TypeScript
6. Update turbo.json
7. Test full installation

## Notes

- Use Bun for all package management and running
- Maintain consistency with existing package patterns
- Ensure all packages are properly scoped under @repo/
- Follow existing code style and conventions