# Clerk OAuth Setup for Radar

## Prerequisites

1. Create a Clerk account at https://clerk.com
2. Create a new application in the Clerk dashboard

## Configuration Steps

### 1. Update Clerk Keys

In `radar-ios/Config.swift`, update the Clerk configuration with your actual keys:

```swift
public static var clerkPublishableKey: String {
    #if DEBUG
    return "pk_test_your-actual-test-key-here"
    #else
    return "pk_live_your-actual-production-key-here"
    #endif
}

public static var clerkURLScheme: String {
    // Format: clerk.[your-instance-subdomain].radar
    return "clerk.your-instance.radar"
}
```

### 2. Update Info.plist

In `radar-ios/Info.plist`, update the URL scheme to match your Clerk instance:

```xml
<key>CFBundleURLSchemes</key>
<array>
    <string>clerk.your-instance.radar</string>
</array>
```

### 3. Configure OAuth Providers in Clerk Dashboard

1. Go to your Clerk dashboard
2. Navigate to "User & Authentication" → "Social Connections"
3. Enable and configure:
   - **Google OAuth**: Add your Google OAuth credentials
   - **Apple Sign In**: Configure Apple Sign In settings

### 4. Set Redirect URLs

In the Clerk dashboard, add the following redirect URL for your iOS app:
```
clerk.your-instance.radar://oauth_redirect
```

### 5. Test OAuth Flow

1. Run the app in simulator or device
2. Tap "Continue with Google" or "Continue with Apple"
3. The app should open a browser for authentication
4. After successful auth, it should redirect back to the app

## Troubleshooting

- **OAuth not working**: Ensure your URL scheme in Info.plist matches exactly with your Clerk configuration
- **Redirect not working**: Check that LSApplicationQueriesSchemes includes the browsers you want to support
- **Clerk not configured error**: Make sure AuthProvider is wrapping your app in radar_iosApp.swift

## Notes

- The Clerk SDK handles OAuth callbacks automatically when using `SignIn.authenticateWithRedirect`
- No manual URL handling is needed in the app delegate
- Auth state is automatically synced through the AuthManager