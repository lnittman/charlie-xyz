# Inngest Setup Guide for Radar

## Overview

Inngest is used for background job processing in the Radar app. It handles tasks like:
- Polling AI opinions on schedules
- Calculating trends
- Processing alerts
- Syncing subscriptions

## Local Development Setup

### 1. Install Inngest Dev Server

```bash
# Install the Inngest CLI globally
npm install -g inngest-cli

# Or use npx (no installation needed)
npx inngest-cli dev
```

### 2. Start Inngest Dev Server

In a separate terminal, run:

```bash
# Start the dev server
npx inngest-cli dev

# This will start on http://localhost:8288
```

### 3. Configure Environment Variables

For local development, you can use test keys:

```env
INNGEST_EVENT_KEY="test"
INNGEST_SIGNING_KEY="signkey-test-12345"
```

### 4. Register Your App

With your app running on `http://localhost:7101`:

1. Open Inngest Dev UI at http://localhost:8288
2. Your app should auto-register at `http://localhost:7101/api/inngest`
3. You should see your functions listed

## Production Setup with Vercel

### 1. Create Inngest Account

1. Go to https://app.inngest.com
2. Sign up for a free account
3. Create a new app

### 2. Get Production Keys

From your Inngest dashboard:
- **Event Key**: Found in Settings → Event Keys
- **Signing Key**: Found in Settings → Signing Keys

### 3. Add to Vercel Environment Variables

In your Vercel project settings, add:

```env
INNGEST_EVENT_KEY="your-production-event-key"
INNGEST_SIGNING_KEY="your-production-signing-key"
```

### 4. Sync with Vercel (Two Options)

#### Option A: Manual Sync
1. Deploy your app to Vercel
2. In Inngest dashboard, go to "Sync your app"
3. Enter your app URL: `https://your-app.vercel.app/api/inngest`
4. Click "Sync app here"

#### Option B: Vercel Integration (Recommended)
1. In Inngest dashboard, click "Sync with Vercel"
2. Install the Inngest Vercel integration
3. Select your Vercel project
4. Inngest will automatically sync on each deployment

## Available Functions

The Radar app includes these Inngest functions:

### 1. Poll Opinions (`poll-opinions`)
- Triggered by: `radar/opinion.poll.requested`
- Polls multiple AI models for opinions on radar topics

### 2. Calculate Trends (`calculate-trends`)
- Triggered by: `radar/trend.calculate.requested`
- Analyzes historical opinion data to identify trends

### 3. Process Alerts (`process-alerts`)
- Triggered by: `radar/alert.triggered`
- Sends notifications for significant trend changes

### 4. Sync Subscriptions (`sync-subscriptions`)
- Runs on schedule: Every hour
- Syncs subscription status with payment provider

### 5. Cleanup Old Data (`cleanup-old-data`)
- Runs on schedule: Daily at 3 AM
- Removes old opinion data based on retention policy

## Testing Functions

### Local Testing

```typescript
// Trigger a function locally
await inngest.send({
  name: "radar/opinion.poll.requested",
  data: {
    radarId: "test-radar-id",
    userId: "test-user-id"
  }
});
```

### Using Inngest Dev UI

1. Open http://localhost:8288
2. Go to "Events" tab
3. Click "Send Event"
4. Select your event and provide test data

## Monitoring

### Local Development
- View function runs at http://localhost:8288/runs
- Check logs in the terminal running Inngest dev server

### Production
- Monitor at https://app.inngest.com
- Set up alerts for failed functions
- View detailed execution logs and traces

## Troubleshooting

### Function Not Appearing
1. Check that your app is running
2. Verify the Inngest endpoint is accessible: `curl http://localhost:7101/api/inngest`
3. Check for errors in app logs
4. Ensure functions are exported from `@repo/inngest`

### Sync Failing in Production
1. Verify environment variables are set in Vercel
2. Check that `/api/inngest` route is accessible
3. Ensure signing key matches between Inngest and Vercel
4. Check Vercel function logs for errors

### Events Not Triggering
1. Verify event names match exactly
2. Check event payload matches expected schema
3. Look for errors in Inngest dashboard
4. Ensure event key is correct

## Best Practices

1. **Use Step Functions**: Break long-running tasks into steps for better reliability
2. **Add Retries**: Configure automatic retries for transient failures
3. **Set Timeouts**: Prevent functions from running indefinitely
4. **Log Important Events**: Use structured logging for debugging
5. **Monitor Performance**: Track execution time and optimize slow functions
