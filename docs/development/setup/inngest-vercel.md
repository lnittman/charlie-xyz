# Setting Up Inngest with Vercel Integration

## Quick Start for Production

### Step 1: Deploy to Vercel First

Before setting up Inngest, make sure your app is deployed to Vercel:

```bash
# If using Vercel CLI
vercel

# Or push to your connected Git repository
git push origin main
```

### Step 2: Create Inngest Account

1. Go to [app.inngest.com](https://app.inngest.com)
2. Sign up for a free account
3. You'll be taken to the onboarding flow

### Step 3: Install Vercel Integration

Based on your screenshots, you have two options:

#### Option A: Manual Sync (Simple)

1. In the Inngest dashboard, choose "Sync manually"
2. Enter your app's URL: `https://your-app-name.vercel.app/api/inngest`
3. Click "Sync app here"

#### Option B: Vercel Integration (Recommended)

1. In the Inngest dashboard, choose "Sync with Vercel"
2. Click "Manage Vercel integration"
3. You'll be redirected to Vercel to authorize the integration
4. Select your Radar project from the list
5. Click "Install"

### Step 4: Configure Environment Variables

After installing the Vercel integration:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. The integration should have added:
   - `INNGEST_SIGNING_KEY`
   - `INNGEST_EVENT_KEY`

If not added automatically, get them from Inngest dashboard:
- Go to Settings → Keys
- Copy and add them manually to Vercel

### Step 5: Redeploy Your App

After adding environment variables:

```bash
# Trigger a new deployment
vercel --prod

# Or push a commit
git commit --allow-empty -m "Configure Inngest"
git push origin main
```

### Step 6: Verify Setup

1. In Inngest dashboard, you should see "No syncs found" change to show your app
2. Check the "Functions" tab - you should see:
   - `poll-opinions`
   - `calculate-trends`
   - `sync-subscriptions`
   - `cleanup-old-data`
   - `generate-reports`
   - Plus their scheduled versions

## Local Development Keys

For local development, update your `.env` files:

```env
# Development keys (safe to commit)
INNGEST_EVENT_KEY="test"
INNGEST_SIGNING_KEY="signkey-test-12345"
```

## Testing the Integration

### 1. Send a Test Event

From Inngest dashboard:

```json
{
  "name": "radar/opinion.poll.requested",
  "data": {
    "radarId": "test-123",
    "userId": "user-123"
  }
}
```

### 2. Check Function Runs

- Go to "Runs" tab in Inngest dashboard
- You should see your function execution
- Click on it for detailed logs

### 3. Monitor in Production

- Set up alerts for failed functions
- Monitor execution times
- Check for any rate limit issues

## Common Issues

### "No syncs found" persists

1. Check `/api/inngest` is accessible:
   ```bash
   curl https://your-app.vercel.app/api/inngest
   ```

2. Verify environment variables in Vercel

3. Check Vercel Functions logs for errors

### Functions not appearing

1. Ensure functions are exported from `@repo/inngest`
2. Check for TypeScript/build errors
3. Verify the Inngest client is initialized

### Deployment protection warning

If you see "Deployment protection key is enabled":
- This is normal for production
- It prevents unauthorized access to your functions
- The signing key handles authentication

## Next Steps

1. **Set up monitoring**: Configure alerts for failed functions
2. **Test critical paths**: Ensure opinion polling works end-to-end
3. **Configure schedules**: Adjust cron schedules for your needs
4. **Add custom events**: Trigger functions from your app code

## Useful Commands

```bash
# Trigger an event from your app
await inngest.send({
  name: "radar/opinion.poll.requested",
  data: { radarId, userId }
});

# Multiple events
await inngest.send([
  { name: "event1", data: {} },
  { name: "event2", data: {} }
]);
```

## Resources

- [Inngest Docs](https://www.inngest.com/docs)
- [Vercel Integration Guide](https://www.inngest.com/docs/deploy/vercel)
- [Function Writing Guide](https://www.inngest.com/docs/functions)