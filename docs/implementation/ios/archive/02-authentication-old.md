# Agent 2: Authentication & Security
*"Implement Clerk authentication with biometric support and secure storage"*

## Scope

This agent implements a secure authentication system using Clerk's iOS SDK, integrates biometric authentication (Face ID/Touch ID), and establishes secure token storage in the iOS Keychain. The implementation mirrors the web app's auth flow while adding native iOS security features.

## Packages to modify

- `radar-apple/Packages/RadarAuth` - New authentication package
- `radar-apple/Radar/App` - Integration with main app
- `radar-apple/Radar/Resources` - Auth-related assets

## Implementation Details

### 1. RadarAuth Package Structure

```swift
// Packages/RadarAuth/Package.swift
// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "RadarAuth",
    platforms: [.iOS(.v17)],
    products: [
        .library(
            name: "RadarAuth",
            targets: ["RadarAuth"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/clerk/clerk-ios", from: "0.1.0"),
        .package(path: "../Design")
    ],
    targets: [
        .target(
            name: "RadarAuth",
            dependencies: [
                .product(name: "ClerkSDK", package: "clerk-ios"),
                "Design"
            ]
        ),
        .testTarget(
            name: "RadarAuthTests",
            dependencies: ["RadarAuth"]
        ),
    ]
)
```

### 2. Core Authentication Manager

```swift
// Sources/RadarAuth/AuthManager.swift
import Foundation
import ClerkSDK
import LocalAuthentication
import Combine

@MainActor
public class AuthManager: ObservableObject {
    public static let shared = AuthManager()
    
    @Published public var isAuthenticated = false
    @Published public var currentUser: User?
    @Published public var isLoading = false
    @Published public var error: AuthError?
    
    private let clerk: Clerk
    private let keychain = KeychainManager()
    private let biometricAuth = BiometricAuthManager()
    
    private init() {
        // Initialize Clerk with your publishable key
        self.clerk = Clerk.shared
        Clerk.shared.configure(publishableKey: ProcessInfo.processInfo.environment["CLERK_PUBLISHABLE_KEY"] ?? "")
        
        // Check for existing session
        Task {
            await checkAuthState()
        }
    }
    
    // MARK: - Public Methods
    
    public func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let signIn = try await clerk.signIn.create(
                identifier: email,
                password: password
            )
            
            if let session = signIn.createdSession {
                try await handleSuccessfulAuth(session: session)
            }
        } catch {
            self.error = AuthError.signInFailed(error.localizedDescription)
            throw error
        }
    }
    
    public func signInWithBiometrics() async throws {
        guard await biometricAuth.canUseBiometrics() else {
            throw AuthError.biometricsNotAvailable
        }
        
        isLoading = true
        defer { isLoading = false }
        
        // Authenticate with biometrics
        let reason = "Sign in to your Radar account"
        guard await biometricAuth.authenticate(reason: reason) else {
            throw AuthError.biometricsFailed
        }
        
        // Retrieve stored credentials
        guard let credentials = try? keychain.retrieveCredentials() else {
            throw AuthError.noStoredCredentials
        }
        
        // Sign in with stored credentials
        try await signIn(email: credentials.email, password: credentials.password)
    }
    
    public func signUp(email: String, password: String, username: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let signUp = try await clerk.signUp.create(
                emailAddress: email,
                password: password,
                username: username
            )
            
            // Handle email verification if needed
            if signUp.verifications.emailAddress.status == .unverified {
                // Navigate to verification screen
                throw AuthError.emailVerificationRequired
            }
            
            if let session = signUp.createdSession {
                try await handleSuccessfulAuth(session: session)
            }
        } catch {
            self.error = AuthError.signUpFailed(error.localizedDescription)
            throw error
        }
    }
    
    public func signOut() async throws {
        isLoading = true
        defer { isLoading = false }
        
        try await clerk.signOut()
        
        // Clear keychain
        try keychain.deleteCredentials()
        
        // Update state
        isAuthenticated = false
        currentUser = nil
    }
    
    public func enableBiometrics(email: String, password: String) async throws {
        guard await biometricAuth.canUseBiometrics() else {
            throw AuthError.biometricsNotAvailable
        }
        
        // Store credentials securely
        try keychain.storeCredentials(email: email, password: password)
    }
    
    // MARK: - Private Methods
    
    private func checkAuthState() async {
        if let session = clerk.session {
            isAuthenticated = true
            currentUser = session.user
            
            // Check for biometric availability
            if await biometricAuth.canUseBiometrics() && keychain.hasStoredCredentials() {
                // Biometrics are available and configured
            }
        }
    }
    
    private func handleSuccessfulAuth(session: Session) async throws {
        isAuthenticated = true
        currentUser = session.user
        
        // Store session token securely
        if let token = session.sessionToken {
            try keychain.storeSessionToken(token)
        }
    }
}

// MARK: - Error Types

public enum AuthError: LocalizedError {
    case signInFailed(String)
    case signUpFailed(String)
    case biometricsNotAvailable
    case biometricsFailed
    case noStoredCredentials
    case emailVerificationRequired
    case keychainError(String)
    
    public var errorDescription: String? {
        switch self {
        case .signInFailed(let message):
            return "Sign in failed: \(message)"
        case .signUpFailed(let message):
            return "Sign up failed: \(message)"
        case .biometricsNotAvailable:
            return "Biometric authentication is not available on this device"
        case .biometricsFailed:
            return "Biometric authentication failed"
        case .noStoredCredentials:
            return "No stored credentials found"
        case .emailVerificationRequired:
            return "Please verify your email address"
        case .keychainError(let message):
            return "Keychain error: \(message)"
        }
    }
}
```

### 3. Keychain Manager

```swift
// Sources/RadarAuth/KeychainManager.swift
import Foundation
import Security

struct KeychainManager {
    private let serviceName = "com.radar.ios"
    private let credentialsKey = "userCredentials"
    private let tokenKey = "sessionToken"
    
    // MARK: - Credentials Storage
    
    func storeCredentials(email: String, password: String) throws {
        let credentials = UserCredentials(email: email, password: password)
        let data = try JSONEncoder().encode(credentials)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: credentialsKey,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing item if any
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw AuthError.keychainError("Failed to store credentials: \(status)")
        }
    }
    
    func retrieveCredentials() throws -> UserCredentials {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: credentialsKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data else {
            throw AuthError.keychainError("Failed to retrieve credentials: \(status)")
        }
        
        return try JSONDecoder().decode(UserCredentials.self, from: data)
    }
    
    func deleteCredentials() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: credentialsKey
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw AuthError.keychainError("Failed to delete credentials: \(status)")
        }
    }
    
    var hasStoredCredentials: Bool {
        do {
            _ = try retrieveCredentials()
            return true
        } catch {
            return false
        }
    }
    
    // MARK: - Token Storage
    
    func storeSessionToken(_ token: String) throws {
        let data = token.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw AuthError.keychainError("Failed to store token: \(status)")
        }
    }
}

private struct UserCredentials: Codable {
    let email: String
    let password: String
}
```

### 4. Biometric Authentication Manager

```swift
// Sources/RadarAuth/BiometricAuthManager.swift
import LocalAuthentication

@MainActor
class BiometricAuthManager {
    private let context = LAContext()
    
    func canUseBiometrics() async -> Bool {
        var error: NSError?
        let canEvaluate = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )
        
        return canEvaluate && error == nil
    }
    
    func authenticate(reason: String) async -> Bool {
        var error: NSError?
        
        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        ) else {
            return false
        }
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            return success
        } catch {
            return false
        }
    }
    
    var biometricType: BiometricType {
        _ = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: nil
        )
        
        switch context.biometryType {
        case .touchID:
            return .touchID
        case .faceID:
            return .faceID
        default:
            return .none
        }
    }
    
    enum BiometricType {
        case touchID
        case faceID
        case none
        
        var displayName: String {
            switch self {
            case .touchID: return "Touch ID"
            case .faceID: return "Face ID"
            case .none: return "Biometrics"
            }
        }
        
        var systemImageName: String {
            switch self {
            case .touchID: return "touchid"
            case .faceID: return "faceid"
            case .none: return "lock"
            }
        }
    }
}
```

### 5. Auth UI Components

```swift
// Sources/RadarAuth/Views/SignInView.swift
import SwiftUI
import Design

public struct SignInView: View {
    @StateObject private var authManager = AuthManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showSignUp = false
    @State private var showBiometricOption = false
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Logo and welcome
                    VStack(spacing: 8) {
                        Image("RadarLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 80, height: 80)
                        
                        Text("Welcome back")
                            .font(RadarTypography.title1)
                        
                        Text("Sign in to track AI opinions")
                            .font(RadarTypography.body)
                            .foregroundColor(.radarMuted)
                    }
                    .padding(.top, 40)
                    
                    // Form fields
                    VStack(spacing: 16) {
                        RadarTextField(
                            text: $email,
                            placeholder: "Email",
                            keyboardType: .emailAddress,
                            textContentType: .emailAddress
                        )
                        
                        RadarSecureField(
                            text: $password,
                            placeholder: "Password"
                        )
                    }
                    
                    // Sign in button
                    RadarButton("Sign In", style: .primary) {
                        Task {
                            await signIn()
                        }
                    }
                    .disabled(authManager.isLoading)
                    
                    // Biometric sign in
                    if showBiometricOption {
                        BiometricSignInButton()
                    }
                    
                    // Sign up link
                    HStack {
                        Text("Don't have an account?")
                            .font(RadarTypography.footnote)
                            .foregroundColor(.radarMuted)
                        
                        Button("Sign Up") {
                            showSignUp = true
                        }
                        .font(RadarTypography.footnote.weight(.semibold))
                        .foregroundColor(.radarPrimary)
                    }
                }
                .padding(.horizontal, 24)
            }
            .background(Color.radarBackground)
            .navigationBarHidden(true)
            .sheet(isPresented: $showSignUp) {
                SignUpView()
            }
            .alert("Error", isPresented: .constant(authManager.error != nil)) {
                Button("OK") {
                    authManager.error = nil
                }
            } message: {
                Text(authManager.error?.localizedDescription ?? "")
            }
        }
        .task {
            checkBiometricAvailability()
        }
    }
    
    private func signIn() async {
        do {
            try await authManager.signIn(email: email, password: password)
            
            // Offer to enable biometrics after successful sign in
            if await BiometricAuthManager().canUseBiometrics() {
                // Show biometric enrollment prompt
            }
        } catch {
            // Error is handled by AuthManager
        }
    }
    
    private func checkBiometricAvailability() {
        Task {
            let biometricAuth = BiometricAuthManager()
            showBiometricOption = await biometricAuth.canUseBiometrics() && 
                                 KeychainManager().hasStoredCredentials
        }
    }
}

// Sources/RadarAuth/Views/BiometricSignInButton.swift
import SwiftUI
import Design

struct BiometricSignInButton: View {
    @StateObject private var authManager = AuthManager.shared
    private let biometricAuth = BiometricAuthManager()
    
    var body: some View {
        RadarButton(buttonText, style: .secondary) {
            Task {
                await signInWithBiometrics()
            }
        }
        .disabled(authManager.isLoading)
    }
    
    private var buttonText: String {
        "Sign in with \(biometricAuth.biometricType.displayName)"
    }
    
    private func signInWithBiometrics() async {
        do {
            try await authManager.signInWithBiometrics()
        } catch {
            // Error handled by AuthManager
        }
    }
}
```

### 6. App Integration

```swift
// Radar/App/RadarApp.swift
import SwiftUI
import RadarAuth
import Design

@main
struct RadarApp: App {
    @StateObject private var authManager = AuthManager.shared
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isAuthenticated {
                    ContentView()
                } else {
                    SignInView()
                }
            }
            .animation(.easeInOut, value: authManager.isAuthenticated)
        }
    }
}
```

### 7. Info.plist Configuration

```xml
<!-- Add to Info.plist -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to quickly and securely sign in to your Radar account</string>
```

## Dependencies

- Agent 1 must complete Design package first
- Clerk iOS SDK
- LocalAuthentication framework
- Security framework

## Testing Strategy

### Unit Tests
```swift
// RadarAuthTests/AuthManagerTests.swift
import XCTest
@testable import RadarAuth

final class AuthManagerTests: XCTestCase {
    func testSignInSuccess() async throws {
        // Mock Clerk responses
        // Test successful sign in
    }
    
    func testBiometricAuthentication() async throws {
        // Mock biometric responses
        // Test biometric flow
    }
    
    func testKeychainOperations() throws {
        // Test secure storage
    }
}
```

### UI Tests
- Sign in flow
- Sign up flow
- Biometric authentication flow
- Error handling

## Security Considerations

- All credentials stored in Keychain with device-only access
- Biometric authentication required for stored credentials
- Session tokens expire and refresh automatically
- No credentials logged or exposed in memory
- Certificate pinning for API requests
- Jailbreak detection (optional)

## Effort Estimate

2-3 developer days:
- Day 1: Auth package setup and Clerk integration
- Day 2: Biometric auth and Keychain implementation
- Day 3: UI components and testing

## Success Metrics

- [ ] Users can sign in with email/password
- [ ] Users can sign up and verify email
- [ ] Biometric authentication works on supported devices
- [ ] Credentials are securely stored in Keychain
- [ ] Session persistence across app launches
- [ ] Proper error handling and user feedback
- [ ] No security vulnerabilities in auth flow
- [ ] 100% test coverage for critical paths