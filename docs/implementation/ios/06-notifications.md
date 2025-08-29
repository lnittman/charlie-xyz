# Agent 6: Push Notifications & Background
*"Implement push notifications, background refresh, and offline support"*

## Scope

This agent will implement comprehensive push notification support, background refresh capabilities, and offline functionality. This includes local and remote notifications, background sync, offline data persistence, and intelligent notification management based on user preferences and subscription tiers.

## Packages to modify

- `radar-ios/Managers/NotificationManager.swift` - Core notification logic
- `radar-ios/Managers/BackgroundTaskManager.swift` - Background refresh
- `Packages/RadarSync` - New package for sync and offline support
- `radar-ios/AppDelegate.swift` - Notification and background setup

## Implementation Details

### 1. Push Notification Setup

```swift
// radar-ios/AppDelegate.swift
import UIKit
import UserNotifications
import Firebase

class AppDelegate: NSObject, UIApplicationDelegate {
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // Configure Firebase
        FirebaseApp.configure()
        
        // Setup notifications
        UNUserNotificationCenter.current().delegate = self
        
        // Register for remote notifications
        registerForPushNotifications()
        
        // Setup background tasks
        BackgroundTaskManager.shared.registerBackgroundTasks()
        
        return true
    }
    
    func registerForPushNotifications() {
        UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                print("Permission granted: \(granted)")
                
                guard granted else { return }
                
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        
        // Send token to backend
        Task {
            await NotificationManager.shared.registerDeviceToken(token)
        }
        
        // Also register with Firebase
        Messaging.messaging().apnsToken = deviceToken
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        // Handle foreground notifications
        let userInfo = notification.request.content.userInfo
        
        if let notificationType = userInfo["type"] as? String {
            switch notificationType {
            case "opinion_update":
                // Show banner for opinion updates
                return [.banner, .sound]
            case "new_follower":
                // Show badge only for social notifications
                return [.badge]
            default:
                return [.banner, .sound, .badge]
            }
        }
        
        return [.banner, .sound, .badge]
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        await NotificationManager.shared.handleNotificationResponse(userInfo)
    }
}
```

### 2. Notification Manager

```swift
// radar-ios/Managers/NotificationManager.swift
import Foundation
import UserNotifications
import Combine

@MainActor
final class NotificationManager: ObservableObject {
    static let shared = NotificationManager()
    
    @Published var pendingNotifications: [NotificationItem] = []
    @Published var notificationSettings: NotificationSettings = .default
    @Published var hasUnreadNotifications = false
    
    private var deviceToken: String?
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        setupBindings()
        loadNotificationSettings()
    }
    
    // MARK: - Device Token Management
    
    func registerDeviceToken(_ token: String) async {
        self.deviceToken = token
        
        do {
            try await APIClient.shared.request(
                endpoint: .registerDevice(
                    token: token,
                    platform: "ios",
                    appVersion: Bundle.main.appVersion
                )
            )
        } catch {
            print("Failed to register device token: \(error)")
        }
    }
    
    // MARK: - Notification Scheduling
    
    func scheduleLocalNotification(for radar: Radar, trigger: NotificationTrigger) async {
        guard notificationSettings.isEnabled(for: trigger.type) else { return }
        
        let content = UNMutableNotificationContent()
        content.title = trigger.title
        content.body = trigger.body
        content.sound = .default
        content.userInfo = [
            "type": trigger.type.rawValue,
            "radar_id": radar.id
        ]
        
        // Add action buttons
        content.categoryIdentifier = trigger.type.categoryIdentifier
        
        let trigger = createTrigger(for: trigger)
        let request = UNNotificationRequest(
            identifier: "\(radar.id)-\(trigger.type.rawValue)",
            content: content,
            trigger: trigger
        )
        
        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("Failed to schedule notification: \(error)")
        }
    }
    
    private func createTrigger(for notification: NotificationTrigger) -> UNNotificationTrigger {
        switch notification.triggerType {
        case .time(let interval):
            return UNTimeIntervalNotificationTrigger(
                timeInterval: interval,
                repeats: notification.repeats
            )
        case .calendar(let dateComponents):
            return UNCalendarNotificationTrigger(
                dateMatching: dateComponents,
                repeats: notification.repeats
            )
        case .location(let region):
            return UNLocationNotificationTrigger(
                region: region,
                repeats: notification.repeats
            )
        }
    }
    
    // MARK: - Rich Notifications
    
    func setupNotificationCategories() {
        let refreshAction = UNNotificationAction(
            identifier: "REFRESH_ACTION",
            title: "Refresh Now",
            options: [.foreground]
        )
        
        let viewAction = UNNotificationAction(
            identifier: "VIEW_ACTION",
            title: "View Radar",
            options: [.foreground]
        )
        
        let dismissAction = UNNotificationAction(
            identifier: "DISMISS_ACTION",
            title: "Dismiss",
            options: [.destructive]
        )
        
        // Opinion update category
        let opinionCategory = UNNotificationCategory(
            identifier: "OPINION_UPDATE",
            actions: [refreshAction, viewAction, dismissAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        // Social category
        let followAction = UNNotificationAction(
            identifier: "FOLLOW_BACK_ACTION",
            title: "Follow Back",
            options: []
        )
        
        let socialCategory = UNNotificationCategory(
            identifier: "SOCIAL",
            actions: [followAction, viewAction],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([
            opinionCategory,
            socialCategory
        ])
    }
    
    // MARK: - Notification Response Handling
    
    func handleNotificationResponse(_ userInfo: [AnyHashable: Any]) async {
        guard let type = userInfo["type"] as? String,
              let notificationType = NotificationType(rawValue: type) else { return }
        
        switch notificationType {
        case .opinionUpdate:
            if let radarId = userInfo["radar_id"] as? String {
                await handleRadarNotification(radarId: radarId)
            }
        case .newFollower:
            if let userId = userInfo["user_id"] as? String {
                await handleFollowerNotification(userId: userId)
            }
        case .trendingTopic:
            if let topic = userInfo["topic"] as? String {
                await handleTrendingNotification(topic: topic)
            }
        default:
            break
        }
    }
}

// MARK: - Notification Settings

struct NotificationSettings: Codable {
    var opinionUpdates: Bool = true
    var socialActivity: Bool = true
    var trendingTopics: Bool = true
    var marketingMessages: Bool = false
    var quietHoursEnabled: Bool = false
    var quietHoursStart: Date = Date()
    var quietHoursEnd: Date = Date()
    
    func isEnabled(for type: NotificationType) -> Bool {
        // Check quiet hours
        if quietHoursEnabled && isInQuietHours() {
            return false
        }
        
        switch type {
        case .opinionUpdate, .radarRefreshed:
            return opinionUpdates
        case .newFollower, .newComment, .newLike:
            return socialActivity
        case .trendingTopic:
            return trendingTopics
        case .marketing:
            return marketingMessages
        }
    }
    
    private func isInQuietHours() -> Bool {
        let now = Date()
        let calendar = Calendar.current
        let nowComponents = calendar.dateComponents([.hour, .minute], from: now)
        let startComponents = calendar.dateComponents([.hour, .minute], from: quietHoursStart)
        let endComponents = calendar.dateComponents([.hour, .minute], from: quietHoursEnd)
        
        // Handle overnight quiet hours
        if let startHour = startComponents.hour,
           let endHour = endComponents.hour,
           let nowHour = nowComponents.hour {
            if startHour > endHour {
                // Overnight (e.g., 22:00 - 07:00)
                return nowHour >= startHour || nowHour < endHour
            } else {
                // Same day (e.g., 09:00 - 17:00)
                return nowHour >= startHour && nowHour < endHour
            }
        }
        
        return false
    }
}
```

### 3. Background Refresh

```swift
// radar-ios/Managers/BackgroundTaskManager.swift
import BackgroundTasks
import Foundation

final class BackgroundTaskManager {
    static let shared = BackgroundTaskManager()
    
    // Task identifiers
    private let refreshTaskIdentifier = "app.radar.refresh"
    private let syncTaskIdentifier = "app.radar.sync"
    
    private init() {}
    
    func registerBackgroundTasks() {
        // Register refresh task
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: refreshTaskIdentifier,
            using: nil
        ) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
        
        // Register sync task
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: syncTaskIdentifier,
            using: nil
        ) { task in
            self.handleBackgroundSync(task: task as! BGProcessingTask)
        }
    }
    
    func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: refreshTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 3600) // 1 hour
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule app refresh: \(error)")
        }
    }
    
    func scheduleBackgroundSync() {
        let request = BGProcessingTaskRequest(identifier: syncTaskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 300) // 5 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule background sync: \(error)")
        }
    }
    
    private func handleAppRefresh(task: BGAppRefreshTask) {
        // Schedule next refresh
        scheduleAppRefresh()
        
        let refreshTask = Task {
            do {
                // Refresh radars based on subscription tier
                let radars = try await fetchRadarsToRefresh()
                
                for radar in radars {
                    try await refreshRadar(radar)
                    
                    // Check if we're running out of time
                    if task.expirationHandler != nil {
                        break
                    }
                }
                
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
        
        task.expirationHandler = {
            refreshTask.cancel()
        }
    }
    
    private func handleBackgroundSync(task: BGProcessingTask) {
        // Schedule next sync
        scheduleBackgroundSync()
        
        let syncTask = Task {
            do {
                // Sync offline changes
                try await OfflineSyncManager.shared.syncPendingChanges()
                
                // Update cached data
                try await CacheManager.shared.refreshStaleData()
                
                // Check for new notifications
                try await NotificationManager.shared.checkForNewNotifications()
                
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
        
        task.expirationHandler = {
            syncTask.cancel()
        }
    }
    
    private func fetchRadarsToRefresh() async throws -> [Radar] {
        let subscription = await SubscriptionManager.shared.currentPlan
        let refreshInterval = subscription.refreshRate
        
        // Get radars that need refresh
        return try await RadarService.shared.listRadars(
            ListRadarsRequest(
                page: 1,
                limit: 10,
                needsRefresh: true,
                lastRefreshedBefore: Date().addingTimeInterval(-refreshInterval)
            )
        ).data
    }
}
```

### 4. Offline Support

```swift
// Packages/RadarSync/Sources/RadarSync/OfflineSyncManager.swift
import Foundation
import CoreData
import Network

@MainActor
public final class OfflineSyncManager: ObservableObject {
    public static let shared = OfflineSyncManager()
    
    @Published public private(set) var isOnline = true
    @Published public private(set) var pendingChanges: [PendingChange] = []
    @Published public private(set) var syncStatus: SyncStatus = .idle
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "app.radar.network")
    private var syncTimer: Timer?
    
    private init() {
        setupNetworkMonitoring()
        loadPendingChanges()
    }
    
    private func setupNetworkMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                let wasOffline = !(self?.isOnline ?? true)
                self?.isOnline = path.status == .satisfied
                
                // Trigger sync when coming back online
                if wasOffline && self?.isOnline == true {
                    Task {
                        await self?.syncPendingChanges()
                    }
                }
            }
        }
        
        monitor.start(queue: queue)
    }
    
    // MARK: - Offline Operations
    
    public func createRadarOffline(_ request: CreateRadarRequest) async throws -> Radar {
        // Create local radar with temporary ID
        let tempId = "temp_\(UUID().uuidString)"
        let radar = Radar(
            id: tempId,
            topic: request.topic,
            position: request.position,
            isPublic: request.isPublic,
            status: .pending,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        // Store in local database
        try await CoreDataManager.shared.save(radar)
        
        // Queue for sync
        let change = PendingChange(
            id: UUID().uuidString,
            type: .create,
            entityType: .radar,
            entityId: tempId,
            data: try JSONEncoder().encode(request),
            createdAt: Date()
        )
        
        try await queueChange(change)
        
        return radar
    }
    
    public func updateRadarOffline(id: String, _ request: UpdateRadarRequest) async throws {
        // Update local copy
        try await CoreDataManager.shared.updateRadar(id: id, request: request)
        
        // Queue for sync
        let change = PendingChange(
            id: UUID().uuidString,
            type: .update,
            entityType: .radar,
            entityId: id,
            data: try JSONEncoder().encode(request),
            createdAt: Date()
        )
        
        try await queueChange(change)
    }
    
    public func deleteRadarOffline(id: String) async throws {
        // Mark as deleted locally
        try await CoreDataManager.shared.markRadarDeleted(id: id)
        
        // Queue for sync
        let change = PendingChange(
            id: UUID().uuidString,
            type: .delete,
            entityType: .radar,
            entityId: id,
            data: nil,
            createdAt: Date()
        )
        
        try await queueChange(change)
    }
    
    // MARK: - Sync Operations
    
    public func syncPendingChanges() async throws {
        guard isOnline else { return }
        
        syncStatus = .syncing
        
        do {
            let changes = pendingChanges.sorted { $0.createdAt < $1.createdAt }
            
            for change in changes {
                try await processChange(change)
                try await removePendingChange(change)
            }
            
            syncStatus = .success
            
            // Post sync notification
            NotificationCenter.default.post(
                name: .offlineSyncCompleted,
                object: nil
            )
        } catch {
            syncStatus = .failed(error)
            throw error
        }
    }
    
    private func processChange(_ change: PendingChange) async throws {
        switch change.type {
        case .create:
            try await processCreateChange(change)
        case .update:
            try await processUpdateChange(change)
        case .delete:
            try await processDeleteChange(change)
        }
    }
    
    private func processCreateChange(_ change: PendingChange) async throws {
        guard let data = change.data else { return }
        
        switch change.entityType {
        case .radar:
            let request = try JSONDecoder().decode(CreateRadarRequest.self, from: data)
            let newRadar = try await RadarService.shared.createRadar(request)
            
            // Update local ID mapping
            try await CoreDataManager.shared.updateRadarId(
                from: change.entityId,
                to: newRadar.id
            )
        case .opinion:
            // Handle opinion creation
            break
        case .comment:
            // Handle comment creation
            break
        }
    }
    
    // MARK: - Conflict Resolution
    
    private func resolveConflict(local: Any, remote: Any) async throws -> ConflictResolution {
        // Implement conflict resolution strategy
        // For now, last-write-wins
        return .useRemote
    }
}

// MARK: - Models

public struct PendingChange: Identifiable, Codable {
    public let id: String
    public let type: ChangeType
    public let entityType: EntityType
    public let entityId: String
    public let data: Data?
    public let createdAt: Date
    
    public enum ChangeType: String, Codable {
        case create, update, delete
    }
    
    public enum EntityType: String, Codable {
        case radar, opinion, comment
    }
}

public enum SyncStatus: Equatable {
    case idle
    case syncing
    case success
    case failed(Error)
    
    public static func == (lhs: SyncStatus, rhs: SyncStatus) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle), (.syncing, .syncing), (.success, .success):
            return true
        case (.failed(let e1), .failed(let e2)):
            return e1.localizedDescription == e2.localizedDescription
        default:
            return false
        }
    }
}
```

### 5. Smart Notification Delivery

```swift
// radar-ios/Managers/SmartNotificationManager.swift
import Foundation
import UserNotifications

extension NotificationManager {
    
    // MARK: - Intelligent Delivery
    
    func scheduleSmartNotification(_ notification: NotificationPayload) async {
        // Check user engagement patterns
        let bestTime = await calculateBestDeliveryTime(for: notification)
        
        // Check notification fatigue
        let recentCount = await getRecentNotificationCount()
        if recentCount > notificationSettings.maxDailyNotifications {
            // Queue for later or skip low-priority notifications
            if notification.priority < .medium {
                return
            }
        }
        
        // Group similar notifications
        if let existingGroup = await findNotificationGroup(for: notification) {
            await updateNotificationGroup(existingGroup, with: notification)
        } else {
            await scheduleNotification(notification, at: bestTime)
        }
    }
    
    private func calculateBestDeliveryTime(for notification: NotificationPayload) async -> Date {
        // Get user's typical active hours
        let activeHours = await AnalyticsManager.shared.getUserActiveHours()
        
        // For immediate notifications
        if notification.priority == .critical {
            return Date()
        }
        
        // Find next active window
        let calendar = Calendar.current
        var components = calendar.dateComponents([.hour, .minute], from: Date())
        
        // Find next hour in active window
        for hour in activeHours {
            if hour > components.hour ?? 0 {
                components.hour = hour
                components.minute = 0
                return calendar.date(from: components) ?? Date()
            }
        }
        
        // Default to next morning
        components.hour = 9
        components.minute = 0
        return calendar.date(from: components)?.addingTimeInterval(86400) ?? Date()
    }
    
    // MARK: - Notification Grouping
    
    private func updateNotificationGroup(_ group: NotificationGroup, with notification: NotificationPayload) async {
        let content = UNMutableNotificationContent()
        
        switch group.type {
        case .opinions:
            content.title = "Multiple radars updated"
            content.body = "\(group.count + 1) of your radars have new opinions"
            content.badge = NSNumber(value: group.count + 1)
        case .social:
            content.title = "New activity"
            content.body = "You have \(group.count + 1) new followers and comments"
        case .trending:
            content.title = "Trending topics"
            content.body = "\(group.count + 1) topics are trending in your interests"
        }
        
        content.threadIdentifier = group.id
        content.userInfo = [
            "group_id": group.id,
            "count": group.count + 1
        ]
        
        // Update existing notification
        let request = UNNotificationRequest(
            identifier: group.id,
            content: content,
            trigger: nil
        )
        
        try? await UNUserNotificationCenter.current().add(request)
    }
}
```

## Dependencies

- Agent 1 (Authentication) - For user identification
- Agent 2 (API Integration) - For sync operations

## Testing Strategy

1. **Unit Tests**
   - Test notification scheduling
   - Test offline operations
   - Test sync conflict resolution

2. **Integration Tests**
   - Test push notification delivery
   - Test background refresh
   - Test offline/online transitions

3. **Device Tests**
   - Test on real devices
   - Test different iOS versions
   - Test low power mode

## Security Considerations

1. **Token Security**: Store device tokens securely
2. **Data Encryption**: Encrypt offline data
3. **Certificate Pinning**: For push notification endpoints
4. **Privacy**: Respect notification permissions
5. **Data Sync**: Validate data integrity

## Effort Estimate

6-8 developer days

## Success Metrics

- [ ] Push notifications working
- [ ] Background refresh functional
- [ ] Offline mode seamless
- [ ] Smart delivery working
- [ ] < 1% notification delivery failure
- [ ] < 5s sync time when online
- [ ] Zero data loss offline
- [ ] Battery impact < 5%
- [ ] 95%+ notification engagement
- [ ] Conflict resolution accurate