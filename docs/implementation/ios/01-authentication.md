# Agent 1: Authentication & User Management
*"Implement complete Clerk authentication integration with OAuth, biometrics, and profile management"*

## Scope

This agent will implement a comprehensive authentication system using Clerk's iOS SDK, replacing the current mock authentication with real user management. It includes email/password auth, OAuth providers (Google, Apple), biometric authentication, session management, and user profile features.

## Packages to modify

- `Packages/RadarAuth` - Complete overhaul with Clerk integration
- `radar-ios/Managers/AuthManager.swift` - Update to use Clerk SDK
- `radar-ios/Views/Auth/` - Update all authentication views
- `radar-ios/Views/ProfileView.swift` - Add profile management features

## Implementation Details

### 1. Clerk SDK Integration

```swift
// Packages/RadarAuth/Sources/RadarAuth/ClerkManager.swift
import Foundation
import Clerk

@MainActor
public final class ClerkManager: ObservableObject {
    public static let shared = ClerkManager()
    
    @Published public private(set) var clerk = Clerk.shared
    @Published public private(set) var isAuthenticated = false
    @Published public private(set) var user: User?
    
    private let publishableKey = "pk_live_xxx" // From environment
    
    private init() {
        setupClerk()
    }
    
    private func setupClerk() {
        clerk.configure(publishableKey: publishableKey)
        
        Task {
            do {
                try await clerk.load()
                updateAuthState()
            } catch {
                print("Failed to load Clerk: \(error)")
            }
        }
    }
    
    private func updateAuthState() {
        isAuthenticated = clerk.session != nil
        user = clerk.user
    }
}
```

### 2. Email/Password Authentication

```swift
// Packages/RadarAuth/Sources/RadarAuth/Views/EmailSignInView.swift
import SwiftUI
import Clerk

public struct EmailSignInView: View {
    @StateObject private var clerkManager = ClerkManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var error: Error?
    
    public var body: some View {
        VStack(spacing: 24) {
            // Header
            VStack(spacing: 8) {
                Text("Welcome Back")
                    .font(.custom("Brett", size: 28))
                Text("Sign in to continue")
                    .foregroundColor(.secondary)
            }
            
            // Form
            VStack(spacing: 16) {
                TextField("Email", text: $email)
                    .textFieldStyle(RadarTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RadarTextFieldStyle())
                
                Button(action: signIn) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Sign In")
                    }
                }
                .buttonStyle(RadarPrimaryButtonStyle())
                .disabled(isLoading || email.isEmpty || password.isEmpty)
            }
            
            // OAuth Options
            VStack(spacing: 12) {
                Text("Or continue with")
                    .foregroundColor(.secondary)
                    .font(.caption)
                
                HStack(spacing: 16) {
                    OAuthButton(provider: .google)
                    OAuthButton(provider: .apple)
                }
            }
        }
        .padding()
        .alert("Error", isPresented: .constant(error != nil)) {
            Button("OK") { error = nil }
        } message: {
            Text(error?.localizedDescription ?? "")
        }
    }
    
    private func signIn() {
        Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                try await SignIn.create(
                    strategy: .identifier(email, password: password)
                )
            } catch {
                self.error = error
            }
        }
    }
}
```

### 3. OAuth Integration

```swift
// Packages/RadarAuth/Sources/RadarAuth/OAuth/OAuthManager.swift
import SwiftUI
import Clerk
import AuthenticationServices

public struct OAuthButton: View {
    let provider: OAuthProvider
    @StateObject private var clerkManager = ClerkManager.shared
    @State private var isLoading = false
    
    public var body: some View {
        Button(action: authenticate) {
            HStack {
                Image(systemName: provider.iconName)
                Text("Continue with \(provider.displayName)")
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(RadarSecondaryButtonStyle())
        .disabled(isLoading)
    }
    
    private func authenticate() {
        Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                if provider == .apple {
                    await authenticateWithApple()
                } else {
                    let result = try await SignIn.authenticateWithRedirect(
                        strategy: .oauth(provider: provider)
                    )
                    handleAuthResult(result)
                }
            } catch {
                print("OAuth error: \(error)")
            }
        }
    }
    
    private func authenticateWithApple() async {
        // Apple Sign In implementation
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.email, .fullName]
        
        // ... handle Apple auth flow
    }
}
```

### 4. Biometric Authentication

```swift
// Packages/RadarAuth/Sources/RadarAuth/Biometric/BiometricAuthManager.swift
import LocalAuthentication
import SwiftUI

public class BiometricAuthManager: ObservableObject {
    @Published public var isBiometricAvailable = false
    @Published public var biometricType: LABiometryType = .none
    
    private let context = LAContext()
    private let keychainManager = KeychainManager()
    
    public func checkBiometricAvailability() {
        var error: NSError?
        isBiometricAvailable = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )
        biometricType = context.biometryType
    }
    
    public func authenticateWithBiometrics() async -> Result<String, Error> {
        let reason = "Authenticate to access your Radar account"
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success {
                // Retrieve stored session token
                if let token = keychainManager.getSessionToken() {
                    return .success(token)
                }
            }
            
            return .failure(AuthError.biometricFailed)
        } catch {
            return .failure(error)
        }
    }
}
```

### 5. Session Management

```swift
// Packages/RadarAuth/Sources/RadarAuth/Session/SessionManager.swift
import Foundation
import Clerk

public class SessionManager: ObservableObject {
    @Published public private(set) var isSessionValid = false
    @Published public private(set) var sessionExpiresAt: Date?
    
    private var refreshTimer: Timer?
    
    public func startSessionMonitoring() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in
            Task { await self.checkAndRefreshSession() }
        }
    }
    
    private func checkAndRefreshSession() async {
        guard let session = Clerk.shared.session else { return }
        
        // Check if session needs refresh (within 5 minutes of expiry)
        if let expiresAt = sessionExpiresAt,
           expiresAt.timeIntervalSinceNow < 300 {
            do {
                try await session.getToken()
                updateSessionState()
            } catch {
                // Handle refresh failure
                await signOut()
            }
        }
    }
    
    public func signOut() async {
        do {
            try await Clerk.shared.signOut()
        } catch {
            print("Sign out error: \(error)")
        }
    }
}
```

### 6. User Profile Management

```swift
// radar-ios/Views/ProfileView.swift
import SwiftUI
import Clerk

struct ProfileView: View {
    @StateObject private var clerkManager = ClerkManager.shared
    @State private var isEditingProfile = false
    @State private var newUsername = ""
    @State private var newEmail = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Header
                ProfileHeaderView(user: clerkManager.user)
                
                // Profile Actions
                VStack(spacing: 16) {
                    ProfileActionButton(
                        title: "Edit Profile",
                        icon: "person.crop.circle",
                        action: { isEditingProfile = true }
                    )
                    
                    ProfileActionButton(
                        title: "Email Addresses",
                        icon: "envelope",
                        action: manageEmails
                    )
                    
                    ProfileActionButton(
                        title: "Security",
                        icon: "lock",
                        action: manageSecurity
                    )
                    
                    ProfileActionButton(
                        title: "Connected Accounts",
                        icon: "link",
                        action: manageConnectedAccounts
                    )
                    
                    ProfileActionButton(
                        title: "Delete Account",
                        icon: "trash",
                        foregroundColor: .red,
                        action: deleteAccount
                    )
                }
                .padding(.horizontal)
            }
        }
        .sheet(isPresented: $isEditingProfile) {
            EditProfileView()
        }
    }
}
```

### 7. Security Enhancements

```swift
// Packages/RadarAuth/Sources/RadarAuth/Security/SecurityManager.swift
import CryptoKit
import Foundation

public class SecurityManager {
    // Certificate pinning for API calls
    public func validateServerCertificate(_ certificate: SecCertificate) -> Bool {
        // Implement certificate pinning
        let serverCertData = SecCertificateCopyData(certificate) as Data
        let serverCertHash = SHA256.hash(data: serverCertData)
        
        return knownCertificateHashes.contains(serverCertHash.description)
    }
    
    // Secure token storage
    public func storeTokenSecurely(_ token: String) {
        let tokenData = token.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "RadarAuthToken",
            kSecValueData as String: tokenData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemAdd(query as CFDictionary, nil)
    }
}
```

## Dependencies

- None (this is the foundational agent)

## Testing Strategy

1. **Unit Tests**
   - Test Clerk SDK integration
   - Test authentication flows
   - Test session management
   - Test biometric authentication

2. **Integration Tests**
   - Test OAuth providers
   - Test profile updates
   - Test error handling

3. **UI Tests**
   - Test sign in/up flows
   - Test biometric prompt
   - Test profile management

## Security Considerations

1. **Token Storage**: Use iOS Keychain with proper access controls
2. **Biometric Data**: Never store biometric data, only use for authentication
3. **Certificate Pinning**: Implement for all API calls
4. **Session Security**: Implement automatic timeout and refresh
5. **OAuth Security**: Use ASWebAuthenticationSession for OAuth flows

## Effort Estimate

8-10 developer days

## Success Metrics

- [ ] Clerk SDK successfully integrated
- [ ] Email/password authentication working
- [ ] Google OAuth implemented
- [ ] Apple Sign In implemented
- [ ] Biometric authentication functional
- [ ] Session management with auto-refresh
- [ ] Profile management features complete
- [ ] All authentication flows tested
- [ ] Security best practices implemented
- [ ] Zero authentication-related crashes