# Charlie Command Center

A sophisticated web application for visualizing, managing, and interacting with Charlie automation instances across Linear and GitHub workflows. Features AI-powered insights and real-time workflow analysis.

## Overview

Charlie Command Center is the primary control interface for monitoring and managing Charlie automation workflows. It provides comprehensive visualization of how Charlie (an AI assistant) orchestrates development tasks, creates PRs, responds to feedback, and maintains Linear↔GitHub synchronization.

### Recent Updates (August 29, 2025)
- ✨ Complete UI redesign with Charlie design system featuring #ABF716 accent color
- 🤖 AI-powered workflow analysis using Anthropic, OpenAI, and Google models
- 📝 Comprehensive ruler configuration for AI coding assistants
- 🎨 Enhanced dashboard with insights panel and improved navigation
- 📱 Mobile-responsive detail views with event filtering
- ⚙️ Settings page for configuring AI models and Charlie behavior
- 🔍 Advanced search, filtering, and sorting capabilities

## Features

### Core Functionality
- **Workflow Dashboard**: Comprehensive overview of all Charlie workflows with status indicators
- **AI-Powered Analysis**: Real-time insights and recommendations powered by multiple AI models
- **Event Timeline**: Detailed chronological view of all workflow events
- **Advanced Filtering**: Filter by status (active/completed/blocked/idle), search, and sort options
- **Detail Views**: Deep dive into individual workflows with full event history
- **Settings Management**: Configure AI models, API keys, and Charlie behavior

### UI/UX Enhancements
- **Charlie Design System**: Custom design tokens with signature #ABF716 accent
- **Animated Components**: Smooth transitions and loading states
- **Dark Mode**: Optimized for dark theme with high contrast
- **Mobile Responsive**: Fully responsive layouts for all screen sizes
- **Keyboard Navigation**: Accessible interface with keyboard shortcuts

## Tech Stack

### Core Technologies
- **Next.js 15.5.2** - React framework with App Router
- **React 19 RC** - Latest React features
- **TypeScript 5.7** - Type safety throughout
- **Tailwind CSS v4** - Modern styling with custom design tokens
- **Turborepo** - High-performance monorepo management

### AI Integration
- **Anthropic Claude** - Primary AI analysis engine
- **OpenAI GPT** - Alternative model support
- **Google Gemini** - Additional AI capabilities
- **AI SDK 4.1** - Unified AI interface

### Development Tools
- **Ruler** - AI coding assistant configuration management
- **MCP (Model Context Protocol)** - Enhanced AI context
- **Biome** - Fast formatting and linting
- **pnpm** - Efficient package management

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/lnittman/charlie-xyz.git
cd charlie-xyz

# Install dependencies
pnpm install

# Set up environment variables
cp apps/app/.env.example apps/app/.env.local
# Add your API keys:
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - GOOGLE_GENERATIVE_AI_API_KEY

# Run development server
pnpm dev

# Open http://localhost:7100
```

### Build & Production

```bash
# Build for production
pnpm build

# Run production build locally
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Testing

```bash
# Run tests (when implemented)
pnpm test

# Run specific app tests
pnpm --filter @repo/app test
```

## Project Structure

```
charlie-xyz/
├── apps/
│   └── app/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # App router pages & API routes
│       │   │   ├── api/        # Edge API endpoints
│       │   │   ├── c/[id]/     # Workflow detail pages
│       │   │   └── settings/   # Settings page
│       │   ├── components/     # React components
│       │   │   ├── charlie-*   # Charlie-specific components
│       │   │   └── shared/     # Shared UI components
│       │   ├── atoms/          # Jotai state management
│       │   ├── lib/            # Utilities
│       │   └── types/          # TypeScript definitions
│       └── public/
│           └── data.json       # Sample workflow data
├── packages/
│   ├── design/                 # Charlie design system
│   │   ├── components/         # Reusable UI components
│   │   └── styles/             # Global styles
│   ├── next-config/            # Shared Next.js configuration
│   ├── seo/                    # SEO utilities
│   └── typescript-config/      # Shared TypeScript configs
└── .ruler/                     # AI assistant configurations
    ├── ruler.toml              # Ruler configuration
    └── *.md                    # Documentation for AI assistants
```

## Data Structure

### Workflows
High-level task representations containing:
- **id**: Unique workflow identifier
- **name**: Human-readable workflow name
- **linearIssueKey**: Associated Linear issue
- **github**: PR number and repository info
- **status**: Current state (active/completed/blocked/idle)

### Events
Granular activity timeline with:
- **ts**: ISO timestamp
- **sequence**: Event ordering
- **provider**: Source system (Linear/GitHub)
- **actor**: Who triggered (human/charlie/bot)
- **entity**: Affected resource (issue/PR/commit)
- **payload**: Event-specific data

### AI Analysis
Dynamic insights including:
- **narrative**: AI-generated workflow summary
- **nextSteps**: Recommended actions with confidence scores
- **insights**: Key observations and patterns
- **estimatedCompletion**: Predicted timeline
- **bottlenecks**: Identified blockers

## Development

### Environment Variables

Create `.env.local` in `apps/app/` with:

```env
# Required for AI features
ANTHROPIC_API_KEY=your_api_key_here
OPENAI_API_KEY=your_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### AI Coding Assistants

The project includes comprehensive ruler configuration for:
- **Claude** (CLAUDE.md)
- **GitHub Copilot** (.github/copilot-instructions.md)
- **Cursor** (.cursor/rules/charlie.md)
- **Gemini** (GEMINI.md)

Run `ruler apply` to regenerate configurations after changes.

### Key Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Run production build

# Code Quality
pnpm typecheck    # Type checking
pnpm lint         # Linting
pnpm format       # Format with Biome

# Monorepo
pnpm --filter @repo/app dev     # Run specific app
pnpm --filter @repo/design build # Build specific package
```

### API Routes

All API routes use Edge Runtime for optimal performance:
- `/api/ai/analyze` - AI workflow analysis
- `/api/models/*` - Model-specific endpoints

### Deployment

Optimized for deployment on:
- **Vercel** - Zero-config deployment
- **Cloudflare Pages** - Edge network distribution
- **Any static host** - Export as static site

## Contributing

1. Follow the established patterns in the codebase
2. Use the Charlie design system components
3. Ensure TypeScript types are comprehensive
4. Test on mobile and desktop viewports
5. Run `pnpm typecheck` before committing

## Support

- Documentation: [docs.charlielabs.ai](https://docs.charlielabs.ai)
- Issues: Use the in-app feedback menu
- Updates: Check the settings page for latest features

## License

Private - Charlie Labs © 2025