# Environment Setup Guide

This guide will help you set up the required environment variables for Radar XYZ.

## Quick Start

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in the required values as described below.

## Required Services

### 1. Database (PostgreSQL)

You'll need a PostgreSQL database. We recommend using [Neon](https://neon.tech) for easy setup:

1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection strings:
   - `DATABASE_URL` - Use the pooled connection string
   - `DIRECT_URL` - Use the direct connection string

### 2. Authentication (Clerk)

1. Sign up at https://clerk.com
2. Create a new application
3. Copy your API keys from the Clerk dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Set up a webhook endpoint and copy the signing secret:
   - `CLERK_WEBHOOK_SECRET`

### 3. AI Provider (OpenRouter)

1. Sign up at https://openrouter.ai
2. Generate an API key
3. Add it as `OPENROUTER_API_KEY`

### 4. Email Service (Resend)

1. Sign up at https://resend.com
2. Generate an API key
3. Add it as `RESEND_API_KEY`
4. Verify your domain and set `EMAIL_FROM`

### 5. Background Jobs (Inngest)

For local development, use the test keys provided in `.env.example`.

For production:
1. Sign up at https://inngest.com
2. Create a new app
3. Copy your event key and signing key

## Optional Services

### Payment Processing (Stripe)

Required only if you're implementing paid features:

1. Sign up at https://stripe.com
2. Copy your test/live keys from the dashboard
3. Set up webhook endpoints

### Additional AI Providers

You can optionally add keys for:
- `ANTHROPIC_API_KEY` - For Claude models
- `OPENAI_API_KEY` - For GPT models
- `GOOGLE_API_KEY` - For Gemini models

## Local Development

The default ports are:
- Web App: http://localhost:7101
- API: http://localhost:7101
- Ingest: http://localhost:7102

To run all services:

```bash
pnpm dev
```

## Production Deployment

When deploying to production:

1. Update all `NEXT_PUBLIC_*_URL` variables to your production domains
2. Set `NODE_ENV=production`
3. Update CORS_ORIGIN to include your production domains
4. Use production API keys for all services
5. Set up proper webhook URLs in Clerk and Stripe dashboards

## Security Notes

- Never commit your `.env` file to version control
- Rotate API keys regularly
- Use different keys for development and production
- Enable IP restrictions where possible (especially for database access)

## Troubleshooting

### Database Connection Issues
- Ensure your IP is whitelisted in Neon dashboard
- Check that you're using the pooled connection string for DATABASE_URL
- Verify SSL mode is set to `require`

### Authentication Issues
- Ensure Clerk webhook secret matches exactly
- Check that all Clerk URLs are configured correctly
- Verify your Clerk application is in the correct mode (development/production)

### AI Provider Issues
- Check your OpenRouter credits
- Verify API key permissions
- Monitor rate limits

For more help, see the main README or open an issue.
