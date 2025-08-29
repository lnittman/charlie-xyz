# Development Bootstrap Guide

This guide helps you get started with development without needing all services configured upfront.

## Quick Start (Without Payments)

1. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```

2. **Minimal required services:**
   - **Clerk**: Sign up at [clerk.com](https://clerk.com) for authentication
   - **Database**: Use local PostgreSQL or [Neon](https://neon.tech) (free tier)
   - **Redis**: Get free tier at [Upstash](https://upstash.com)
   - **OpenAI**: Get API key from [OpenAI](https://platform.openai.com)

3. **Update `.env.local`** with your actual values:
   ```env
   CLERK_SECRET_KEY=sk_test_YOUR_KEY
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   DATABASE_URL=YOUR_DATABASE_URL
   UPSTASH_REDIS_REST_URL=YOUR_REDIS_URL
   UPSTASH_REDIS_REST_TOKEN=YOUR_REDIS_TOKEN
   OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
   ```

4. **Run development servers**
   ```bash
   pnpm dev
   ```

## Optional Services

### Payments (Stripe)
When you're ready to add payments:
1. Get Stripe keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Add to `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   ```
3. Run API with Stripe webhook listener:
   ```bash
   cd apps/api && pnpm dev:with-stripe
   ```

### Analytics (PostHog)
1. Get keys from [posthog.com](https://posthog.com)
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=YOUR_KEY
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

### Error Tracking (Sentry)
1. Get DSN from [sentry.io](https://sentry.io)
2. Add to `.env.local`:
   ```env
   SENTRY_DSN=YOUR_DSN
   NEXT_PUBLIC_SENTRY_DSN=YOUR_DSN
   ```

## Troubleshooting

- **Stripe errors**: The app works without Stripe configured. Payment features will be disabled.
- **Database connection**: Ensure PostgreSQL is running locally or use a cloud provider.
- **Redis connection**: Required for rate limiting. Get free tier at Upstash.
- **Missing env vars**: Check `.env.example` for all available options.