# Agent 3: Subscription & Payments
*"Integrate Stripe for subscription management and in-app purchases"*

## Scope

This agent will implement a complete subscription system using Stripe iOS SDK and StoreKit 2, handling payment processing, subscription management, receipt validation, and plan enforcement. It includes tiered pricing (Free, Pro, Enterprise), usage tracking, billing management, and App Store compliance.

## Packages to modify

- `Packages/RadarSubscription` - New package for subscription management
- `Packages/RadarAPI` - Add subscription endpoints
- `radar-ios/Views/Subscription/` - Subscription UI components
- `radar-ios/Managers/SubscriptionManager.swift` - Core subscription logic

## Implementation Details

### 1. Stripe SDK Setup

```swift
// Packages/RadarSubscription/Sources/RadarSubscription/StripeManager.swift
import Foundation
import StripePaymentSheet
import PassKit

@MainActor
public final class StripeManager: ObservableObject {
    public static let shared = StripeManager()
    
    @Published public private(set) var isInitialized = false
    @Published public private(set) var paymentSheet: PaymentSheet?
    
    private let publishableKey: String
    private let merchantIdentifier: String
    
    private init() {
        self.publishableKey = ProcessInfo.processInfo.environment["STRIPE_PUBLISHABLE_KEY"] ?? ""
        self.merchantIdentifier = "merchant.app.radar"
        
        configure()
    }
    
    private func configure() {
        StripeAPI.defaultPublishableKey = publishableKey
        
        // Configure Apple Pay
        let configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "Radar"
        configuration.applePay = .init(
            merchantId: merchantIdentifier,
            merchantCountryCode: "US"
        )
        configuration.returnURL = "radar://stripe-redirect"
        
        isInitialized = true
    }
    
    public func createPaymentSheet(
        for subscription: SubscriptionPlan,
        customerId: String
    ) async throws -> PaymentSheet {
        // Fetch payment intent from backend
        let paymentIntent = try await fetchPaymentIntent(
            plan: subscription,
            customerId: customerId
        )
        
        var configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "Radar"
        configuration.customer = .init(
            id: customerId,
            ephemeralKeySecret: paymentIntent.ephemeralKey
        )
        configuration.applePay = .init(
            merchantId: merchantIdentifier,
            merchantCountryCode: "US"
        )
        
        return PaymentSheet(
            paymentIntentClientSecret: paymentIntent.clientSecret,
            configuration: configuration
        )
    }
}
```

### 2. StoreKit 2 Integration

```swift
// Packages/RadarSubscription/Sources/RadarSubscription/StoreKitManager.swift
import StoreKit
import SwiftUI

@MainActor
public final class StoreKitManager: ObservableObject {
    @Published public private(set) var products: [Product] = []
    @Published public private(set) var purchasedSubscriptions: [Product] = []
    @Published public private(set) var subscriptionStatus: Product.SubscriptionInfo.Status?
    
    private var updateListenerTask: Task<Void, Error>?
    
    // Product IDs matching App Store Connect
    private let productIds = [
        "app.radar.subscription.pro.monthly",
        "app.radar.subscription.pro.yearly",
        "app.radar.subscription.enterprise.monthly"
    ]
    
    public init() {
        updateListenerTask = listenForTransactions()
        
        Task {
            await loadProducts()
            await updateSubscriptionStatus()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    private func listenForTransactions() -> Task<Void, Error> {
        Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await self.updateSubscriptionStatus()
                    await transaction.finish()
                } catch {
                    print("Transaction failed verification: \(error)")
                }
            }
        }
    }
    
    @MainActor
    private func loadProducts() async {
        do {
            products = try await Product.products(for: productIds)
                .sorted { $0.price < $1.price }
        } catch {
            print("Failed to load products: \(error)")
        }
    }
    
    public func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updateSubscriptionStatus()
            await transaction.finish()
            return transaction
            
        case .userCancelled:
            return nil
            
        case .pending:
            return nil
            
        @unknown default:
            return nil
        }
    }
    
    public func restorePurchases() async {
        do {
            try await AppStore.sync()
            await updateSubscriptionStatus()
        } catch {
            print("Restore failed: \(error)")
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    @MainActor
    private func updateSubscriptionStatus() async {
        var validSubscription: Product?
        
        for product in products {
            guard let status = try? await product.subscription?.status else {
                continue
            }
            
            let renewable = status.filter { $0.state == .subscribed }
            
            if !renewable.isEmpty {
                validSubscription = product
                subscriptionStatus = renewable.first
                break
            }
        }
        
        purchasedSubscriptions = validSubscription.map { [$0] } ?? []
    }
}
```

### 3. Subscription Plans & Tiers

```swift
// Packages/RadarSubscription/Sources/RadarSubscription/Models/SubscriptionPlan.swift
import Foundation

public enum SubscriptionPlan: String, CaseIterable, Codable {
    case free = "free"
    case pro = "pro"
    case enterprise = "enterprise"
    
    public var displayName: String {
        switch self {
        case .free: return "Free"
        case .pro: return "Pro"
        case .enterprise: return "Enterprise"
        }
    }
    
    public var price: String {
        switch self {
        case .free: return "$0"
        case .pro: return "$29/month"
        case .enterprise: return "$99/month"
        }
    }
    
    public var features: [Feature] {
        switch self {
        case .free:
            return [
                .init(name: "3 radars per month", included: true),
                .init(name: "Basic AI opinions", included: true),
                .init(name: "24-hour refresh rate", included: true),
                .init(name: "Community support", included: true),
                .init(name: "Unlimited radars", included: false),
                .init(name: "Advanced AI models", included: false),
                .init(name: "Real-time updates", included: false),
                .init(name: "API access", included: false)
            ]
        case .pro:
            return [
                .init(name: "Unlimited radars", included: true),
                .init(name: "Advanced AI models", included: true),
                .init(name: "Hourly refresh rate", included: true),
                .init(name: "Priority support", included: true),
                .init(name: "Export data", included: true),
                .init(name: "Custom integrations", included: false),
                .init(name: "Dedicated account manager", included: false),
                .init(name: "SLA guarantee", included: false)
            ]
        case .enterprise:
            return [
                .init(name: "Everything in Pro", included: true),
                .init(name: "Real-time updates", included: true),
                .init(name: "API access", included: true),
                .init(name: "Custom integrations", included: true),
                .init(name: "Dedicated account manager", included: true),
                .init(name: "99.9% SLA guarantee", included: true),
                .init(name: "Advanced analytics", included: true),
                .init(name: "White-label options", included: true)
            ]
        }
    }
    
    // Usage limits
    public var radarLimit: Int? {
        switch self {
        case .free: return 3
        case .pro, .enterprise: return nil
        }
    }
    
    public var refreshRate: TimeInterval {
        switch self {
        case .free: return 86400 // 24 hours
        case .pro: return 3600 // 1 hour
        case .enterprise: return 300 // 5 minutes
        }
    }
}

public struct Feature {
    public let name: String
    public let included: Bool
}
```

### 4. Subscription UI

```swift
// radar-ios/Views/Subscription/SubscriptionView.swift
import SwiftUI
import RadarSubscription

struct SubscriptionView: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @StateObject private var stripeManager = StripeManager.shared
    @StateObject private var storeKitManager = StoreKitManager()
    
    @State private var selectedPlan: SubscriptionPlan = .pro
    @State private var isProcessing = false
    @State private var showingPaymentSheet = false
    @State private var useApplePay = true
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                SubscriptionHeaderView(
                    currentPlan: subscriptionManager.currentPlan
                )
                
                // Plan Selection
                VStack(spacing: 16) {
                    ForEach(SubscriptionPlan.allCases, id: \.self) { plan in
                        PlanCard(
                            plan: plan,
                            isSelected: selectedPlan == plan,
                            isCurrentPlan: subscriptionManager.currentPlan == plan
                        ) {
                            selectedPlan = plan
                        }
                    }
                }
                .padding(.horizontal)
                
                // Payment Method Toggle
                if selectedPlan != .free {
                    PaymentMethodToggle(useApplePay: $useApplePay)
                        .padding(.horizontal)
                }
                
                // Subscribe Button
                if selectedPlan != subscriptionManager.currentPlan {
                    Button(action: subscribe) {
                        HStack {
                            if isProcessing {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text(subscribeButtonText)
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(RadarPrimaryButtonStyle())
                    .disabled(isProcessing)
                    .padding(.horizontal)
                }
                
                // Features Comparison
                FeaturesComparisonView()
                    .padding(.top)
            }
        }
        .paymentSheet(
            isPresented: $showingPaymentSheet,
            paymentSheet: stripeManager.paymentSheet!
        )
    }
    
    private var subscribeButtonText: String {
        if selectedPlan == .free {
            return "Downgrade to Free"
        } else if useApplePay {
            return "Subscribe with Apple Pay"
        } else {
            return "Subscribe with Card"
        }
    }
    
    private func subscribe() {
        Task {
            isProcessing = true
            defer { isProcessing = false }
            
            do {
                if useApplePay {
                    // Use StoreKit for Apple Pay
                    guard let product = storeKitManager.products.first(where: { 
                        $0.id.contains(selectedPlan.rawValue) 
                    }) else {
                        throw SubscriptionError.productNotFound
                    }
                    
                    _ = try await storeKitManager.purchase(product)
                } else {
                    // Use Stripe for card payments
                    let paymentSheet = try await stripeManager.createPaymentSheet(
                        for: selectedPlan,
                        customerId: subscriptionManager.stripeCustomerId ?? ""
                    )
                    
                    stripeManager.paymentSheet = paymentSheet
                    showingPaymentSheet = true
                }
                
                // Update subscription status
                await subscriptionManager.refreshSubscriptionStatus()
            } catch {
                // Handle error
                print("Subscription error: \(error)")
            }
        }
    }
}
```

### 5. Usage Tracking & Enforcement

```swift
// radar-ios/Managers/SubscriptionManager.swift
import Foundation
import Combine

@MainActor
public final class SubscriptionManager: ObservableObject {
    public static let shared = SubscriptionManager()
    
    @Published public private(set) var currentPlan: SubscriptionPlan = .free
    @Published public private(set) var usage: UsageStats = .init()
    @Published public private(set) var canCreateRadar = true
    @Published public private(set) var stripeCustomerId: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        setupSubscriptions()
    }
    
    private func setupSubscriptions() {
        // Monitor usage changes
        $usage
            .combineLatest($currentPlan)
            .map { usage, plan in
                guard let limit = plan.radarLimit else { return true }
                return usage.radarsCreatedThisMonth < limit
            }
            .assign(to: &$canCreateRadar)
    }
    
    public func checkCanCreateRadar() async throws {
        // Refresh usage stats
        await refreshUsage()
        
        guard canCreateRadar else {
            throw SubscriptionError.limitExceeded(
                limit: currentPlan.radarLimit ?? 0,
                used: usage.radarsCreatedThisMonth
            )
        }
    }
    
    public func checkCanRefreshRadar(lastRefreshed: Date) throws {
        let timeSinceRefresh = Date().timeIntervalSince(lastRefreshed)
        let requiredInterval = currentPlan.refreshRate
        
        guard timeSinceRefresh >= requiredInterval else {
            let remainingTime = requiredInterval - timeSinceRefresh
            throw SubscriptionError.refreshRateLimited(
                nextAvailable: Date().addingTimeInterval(remainingTime)
            )
        }
    }
    
    public func refreshSubscriptionStatus() async {
        do {
            // Check with backend for source of truth
            let status = try await APIClient.shared.request(
                endpoint: .getSubscriptionStatus,
                responseType: SubscriptionStatus.self
            )
            
            currentPlan = status.plan
            stripeCustomerId = status.stripeCustomerId
            
            // Sync with StoreKit if needed
            if status.source == .appStore {
                await StoreKitManager().updateSubscriptionStatus()
            }
        } catch {
            print("Failed to refresh subscription: \(error)")
        }
    }
    
    private func refreshUsage() async {
        do {
            usage = try await APIClient.shared.request(
                endpoint: .getUsageStats,
                responseType: UsageStats.self
            )
        } catch {
            print("Failed to refresh usage: \(error)")
        }
    }
}

public struct UsageStats: Codable {
    public let radarsCreatedThisMonth: Int
    public let totalRadars: Int
    public let apiCallsThisMonth: Int
    public let lastResetDate: Date
}
```

### 6. Billing Management

```swift
// radar-ios/Views/Subscription/BillingView.swift
import SwiftUI

struct BillingView: View {
    @StateObject private var billingManager = BillingManager()
    @State private var showingUpdatePayment = false
    
    var body: some View {
        List {
            // Current Plan Section
            Section("Current Plan") {
                HStack {
                    VStack(alignment: .leading) {
                        Text(billingManager.currentPlan.displayName)
                            .font(.headline)
                        Text(billingManager.currentPlan.price)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if billingManager.isActive {
                        Label("Active", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    }
                }
                
                if let nextBillingDate = billingManager.nextBillingDate {
                    HStack {
                        Text("Next billing date")
                        Spacer()
                        Text(nextBillingDate, style: .date)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Payment Method Section
            Section("Payment Method") {
                if let paymentMethod = billingManager.paymentMethod {
                    PaymentMethodRow(paymentMethod: paymentMethod)
                    
                    Button("Update Payment Method") {
                        showingUpdatePayment = true
                    }
                } else {
                    Button("Add Payment Method") {
                        showingUpdatePayment = true
                    }
                }
            }
            
            // Billing History Section
            Section("Billing History") {
                if billingManager.invoices.isEmpty {
                    Text("No invoices yet")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(billingManager.invoices) { invoice in
                        InvoiceRow(invoice: invoice)
                    }
                }
            }
            
            // Subscription Actions
            Section {
                if billingManager.currentPlan != .free {
                    Button("Cancel Subscription") {
                        cancelSubscription()
                    }
                    .foregroundColor(.red)
                }
            }
        }
        .refreshable {
            await billingManager.refresh()
        }
        .sheet(isPresented: $showingUpdatePayment) {
            UpdatePaymentMethodView()
        }
    }
    
    private func cancelSubscription() {
        // Handle subscription cancellation
    }
}
```

### 7. Receipt Validation

```swift
// Packages/RadarSubscription/Sources/RadarSubscription/ReceiptValidator.swift
import Foundation
import StoreKit

public class ReceiptValidator {
    public static func validateReceipt() async throws -> ReceiptInfo {
        // Get receipt data
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              let receiptData = try? Data(contentsOf: receiptURL) else {
            throw ReceiptError.noReceipt
        }
        
        let receiptString = receiptData.base64EncodedString()
        
        // Validate with backend (never validate on device)
        let response = try await APIClient.shared.request(
            endpoint: .validateReceipt(receipt: receiptString),
            responseType: ReceiptValidationResponse.self
        )
        
        guard response.isValid else {
            throw ReceiptError.invalid
        }
        
        return response.receiptInfo
    }
}

public struct ReceiptInfo: Codable {
    public let bundleId: String
    public let originalPurchaseDate: Date
    public let subscriptions: [SubscriptionInfo]
    
    public struct SubscriptionInfo: Codable {
        public let productId: String
        public let expiresDate: Date
        public let isActive: Bool
        public let isInBillingRetry: Bool
        public let autoRenewStatus: Bool
    }
}
```

## Dependencies

- Agent 1 (Authentication) - For user identification
- Agent 2 (API Integration) - For backend communication

## Testing Strategy

1. **Unit Tests**
   - Test plan limits and features
   - Test usage tracking
   - Test subscription state management

2. **Integration Tests**
   - Test Stripe payment flow
   - Test StoreKit purchases
   - Test receipt validation
   - Test webhook handling

3. **UI Tests**
   - Test subscription flow
   - Test payment sheet
   - Test error states

## Security Considerations

1. **Payment Security**: Use Stripe's PCI-compliant SDK
2. **Receipt Validation**: Always validate on server
3. **Subscription Status**: Server as source of truth
4. **PII Protection**: Never log payment information
5. **Webhook Security**: Verify Stripe signatures

## Effort Estimate

10-12 developer days

## Success Metrics

- [ ] Stripe SDK integrated and configured
- [ ] StoreKit 2 subscription flow working
- [ ] All three tiers implemented
- [ ] Usage tracking and enforcement
- [ ] Payment method management
- [ ] Billing history display
- [ ] Receipt validation secure
- [ ] App Store compliance met
- [ ] < 2% payment failure rate
- [ ] Zero security vulnerabilities