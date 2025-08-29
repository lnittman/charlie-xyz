# Charlie Workflow Monitor

A clean, modern web application for visualizing and tracking Charlie automation workflows across Linear and GitHub.

## Overview

This application provides a timeline-based visualization of workflows and events, showing how Charlie (an AI assistant) helps complete development tasks by creating PRs, responding to feedback, and managing the Linear↔GitHub sync.

## Features

- **Workflow Timeline**: Visual timeline of all events in chronological order
- **Event Details**: Detailed view of each event including actors, payloads, and metadata
- **Filtering**: Filter events by provider (Linear/GitHub), event type, and actor type
- **Workflow Selection**: Click workflows to filter events for specific tasks
- **Real-time Updates**: Data loaded from JSON file (can be easily adapted for API)

## Tech Stack

- **Next.js 15.3** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Tailwind CSS v4** - Styling
- **date-fns** - Date formatting
- **Turborepo** - Monorepo management

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:7100
```

## Project Structure

```
charlie-xyz/
├── apps/
│   └── app/                # Next.js web application
│       ├── src/
│       │   ├── app/        # App router pages
│       │   ├── components/ # React components
│       │   └── types/      # TypeScript types
│       └── public/
│           └── data.json   # Workflow and event data
└── packages/
    ├── design/             # Shared design system
    ├── seo/                # SEO utilities
    └── typescript-config/  # Shared TS configs
```

## Data Structure

The application reads from `data.json` which contains:

- **Workflows**: High-level tasks with Linear issues and GitHub PRs
- **Events**: Granular timeline of activities for each workflow

Each event includes:
- Timestamp and sequence number
- Provider (Linear or GitHub)
- Actor information (human, Charlie, or bot)
- Entity details (issue, PR, commit, etc.)
- Payload with event-specific data

## Development

The app is built as a simple client-side application with no backend dependencies. All data is loaded from a static JSON file, making it easy to:

- Deploy anywhere as a static site
- Adapt to use a real API
- Add more visualizations
- Extend with additional features

## License

Private