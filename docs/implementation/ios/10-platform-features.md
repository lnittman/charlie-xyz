# Agent 10: Platform Features
*"iOS-specific features like widgets, shortcuts, and system integration"*

## Scope

This agent will implement iOS platform-specific features including home screen widgets, lock screen widgets, Siri shortcuts, share extensions, Spotlight search, handoff support, and deep linking. These features will make Radar feel like a native first-party iOS application with deep system integration.

## Packages to modify

- `RadarWidgets/` - New widget extension target
- `RadarIntents/` - Siri shortcuts and intents
- `RadarShare/` - Share extension
- `radar-ios/Integrations/` - System integration code
- `radar-ios/Info.plist` - URL schemes and capabilities

## Implementation Details

### 1. Home Screen Widgets

```swift
// RadarWidgets/RadarWidget.swift
import WidgetKit
import SwiftUI
import Intents

struct RadarWidgetProvider: IntentTimelineProvider {
    func placeholder(in context: Context) -> RadarEntry {
        RadarEntry(date: Date(), radar: .placeholder, configuration: ConfigurationIntent())
    }
    
    func getSnapshot(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (RadarEntry) -> ()) {
        let entry = RadarEntry(date: Date(), radar: .placeholder, configuration: configuration)
        completion(entry)
    }
    
    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        Task {
            do {
                let radars = try await fetchRadarsForWidget(configuration: configuration)
                let entries = createEntries(from: radars, configuration: configuration)
                
                let timeline = Timeline(entries: entries, policy: .atEnd)
                completion(timeline)
            } catch {
                let entry = RadarEntry(date: Date(), radar: nil, configuration: configuration)
                let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
                completion(timeline)
            }
        }
    }
    
    private func fetchRadarsForWidget(configuration: ConfigurationIntent) async throws -> [Radar] {
        // Fetch from shared container
        guard let sharedDefaults = UserDefaults(suiteName: "group.app.radar") else {
            throw WidgetError.noSharedContainer
        }
        
        // Get cached radars or fetch from API
        if let cachedData = sharedDefaults.data(forKey: "widget_radars"),
           let radars = try? JSONDecoder().decode([Radar].self, from: cachedData),
           !radars.isEmpty {
            return radars
        }
        
        // Fetch from API if needed
        return try await WidgetAPIClient.shared.fetchRecentRadars()
    }
}

struct RadarEntry: TimelineEntry {
    let date: Date
    let radar: Radar?
    let configuration: ConfigurationIntent
}

@main
struct RadarWidgetBundle: WidgetBundle {
    var body: some Widget {
        RadarWidget()
        RadarLockScreenWidget()
        RadarControlWidget()
    }
}

// Main Widget
struct RadarWidget: Widget {
    let kind: String = "RadarWidget"
    
    var body: some WidgetConfiguration {
        IntentConfiguration(
            kind: kind,
            intent: ConfigurationIntent.self,
            provider: RadarWidgetProvider()
        ) { entry in
            RadarWidgetView(entry: entry)
        }
        .configurationDisplayName("Radar Status")
        .description("View your latest radar opinions")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// Widget Views
struct RadarWidgetView: View {
    let entry: RadarEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallRadarWidget(radar: entry.radar)
        case .systemMedium:
            MediumRadarWidget(radar: entry.radar)
        case .systemLarge:
            LargeRadarWidget(radar: entry.radar)
        default:
            EmptyView()
        }
    }
}

struct SmallRadarWidget: View {
    let radar: Radar?
    
    var body: some View {
        if let radar = radar {
            Link(destination: URL(string: "radar://open/\(radar.id)")!) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .font(.caption)
                            .foregroundColor(.radarAccent)
                        
                        Spacer()
                        
                        if let position = radar.position {
                            Image(systemName: position.icon)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Text(radar.topic)
                        .font(.system(.footnote, design: .rounded))
                        .fontWeight(.medium)
                        .lineLimit(2)
                    
                    Spacer()
                    
                    if let latestOpinion = radar.opinions.first {
                        Text(latestOpinion.summary ?? "")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    HStack {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                        Text(radar.updatedAt.relativeTime)
                            .font(.system(size: 10))
                    }
                    .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(
                    LinearGradient(
                        colors: [
                            Color.radarBackground,
                            Color.radarBackground.opacity(0.8)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            }
        } else {
            VStack {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.title2)
                    .foregroundColor(.radarAccent)
                
                Text("No Radars")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.radarBackground)
        }
    }
}
```

### 2. Lock Screen Widgets

```swift
// RadarWidgets/LockScreenWidget.swift
import WidgetKit
import SwiftUI

struct RadarLockScreenWidget: Widget {
    let kind: String = "RadarLockScreenWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: LockScreenProvider()
        ) { entry in
            LockScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("Radar Quick Stats")
        .description("View radar stats on your lock screen")
        .supportedFamilies([
            .accessoryRectangular,
            .accessoryCircular,
            .accessoryInline
        ])
    }
}

struct LockScreenWidgetView: View {
    let entry: LockScreenEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .accessoryRectangular:
            RectangularLockScreenWidget(stats: entry.stats)
        case .accessoryCircular:
            CircularLockScreenWidget(stats: entry.stats)
        case .accessoryInline:
            InlineLockScreenWidget(stats: entry.stats)
        default:
            EmptyView()
        }
    }
}

struct RectangularLockScreenWidget: View {
    let stats: RadarStats
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "antenna.radiowaves.left.and.right")
                Text("\(stats.activeRadars) Active")
            }
            .font(.system(.footnote, design: .rounded))
            
            HStack(spacing: 12) {
                VStack(alignment: .leading) {
                    Text("\(stats.todayOpinions)")
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.semibold)
                    Text("Today")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading) {
                    Text("\(stats.weekOpinions)")
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.semibold)
                    Text("This Week")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }
        }
        .widgetAccentable()
    }
}

struct CircularLockScreenWidget: View {
    let stats: RadarStats
    
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            
            VStack(spacing: 2) {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.caption)
                
                Text("\(stats.activeRadars)")
                    .font(.system(.title3, design: .rounded))
                    .fontWeight(.bold)
                
                Text("Active")
                    .font(.system(size: 8))
            }
        }
        .widgetAccentable()
    }
}
```

### 3. Siri Shortcuts & App Intents

```swift
// RadarIntents/RadarIntents.swift
import AppIntents
import SwiftUI

// App Intent for creating radars
struct CreateRadarIntent: AppIntent {
    static var title: LocalizedStringResource = "Create Radar"
    static var description = IntentDescription("Create a new radar to track opinions")
    
    @Parameter(title: "Topic", requestValueDialog: "What would you like to track?")
    var topic: String
    
    @Parameter(title: "Position", default: .neutral)
    var position: RadarPosition
    
    static var parameterSummary: some ParameterSummary {
        Summary("Create radar about \(\.$topic)") {
            \.$position
        }
    }
    
    func perform() async throws -> some IntentResult & ShowsSnippetView {
        let radar = try await RadarService.shared.createRadar(
            CreateRadarRequest(
                topic: topic,
                position: position
            )
        )
        
        return .result(
            value: radar,
            view: RadarCreatedSnippet(radar: radar)
        )
    }
}

// App Intent for refreshing radars
struct RefreshRadarIntent: AppIntent {
    static var title: LocalizedStringResource = "Refresh Radar"
    static var description = IntentDescription("Get new opinions for a radar")
    
    @Parameter(title: "Radar")
    var radar: RadarEntity
    
    func perform() async throws -> some IntentResult & ShowsSnippetView {
        let updatedRadar = try await RadarService.shared.refreshRadar(radar.id)
        
        return .result(
            view: RadarRefreshedSnippet(radar: updatedRadar)
        )
    }
}

// App Shortcut Provider
struct RadarShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CreateRadarIntent(),
            phrases: [
                "Create a radar in \(.applicationName)",
                "Track something in \(.applicationName)",
                "New radar in \(.applicationName)"
            ],
            shortTitle: "Create Radar",
            systemImageName: "antenna.radiowaves.left.and.right"
        )
        
        AppShortcut(
            intent: RefreshAllRadarsIntent(),
            phrases: [
                "Refresh my radars in \(.applicationName)",
                "Update radars in \(.applicationName)",
                "Get new opinions in \(.applicationName)"
            ],
            shortTitle: "Refresh All",
            systemImageName: "arrow.clockwise"
        )
    }
}

// Entity for Siri integration
struct RadarEntity: AppEntity {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Radar")
    static var defaultQuery = RadarQuery()
    
    var id: String
    var topic: String
    var position: RadarPosition?
    
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(topic)",
            subtitle: position?.displayName ?? "No position"
        )
    }
}

struct RadarQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [RadarEntity] {
        let radars = try await RadarService.shared.fetchRadars(ids: identifiers)
        return radars.map { RadarEntity(from: $0) }
    }
    
    func suggestedEntities() async throws -> [RadarEntity] {
        let radars = try await RadarService.shared.fetchRecentRadars(limit: 5)
        return radars.map { RadarEntity(from: $0) }
    }
}
```

### 4. Share Extension

```swift
// RadarShare/ShareViewController.swift
import UIKit
import Social
import SwiftUI

class ShareViewController: UIViewController {
    private var hostingController: UIHostingController<ShareView>?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let shareView = ShareView { [weak self] result in
            switch result {
            case .success:
                self?.extensionContext?.completeRequest(returningItems: nil)
            case .cancelled:
                self?.extensionContext?.cancelRequest(withError: ShareError.cancelled)
            case .failure(let error):
                self?.extensionContext?.cancelRequest(withError: error)
            }
        }
        
        hostingController = UIHostingController(rootView: shareView)
        
        if let hostingController = hostingController {
            addChild(hostingController)
            view.addSubview(hostingController.view)
            
            hostingController.view.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
                hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
            ])
            
            hostingController.didMove(toParent: self)
        }
        
        // Extract shared content
        extractSharedContent()
    }
    
    private func extractSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else { return }
        
        for item in extensionItems {
            guard let attachments = item.attachments else { continue }
            
            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier("public.url") {
                    attachment.loadItem(forTypeIdentifier: "public.url") { [weak self] url, error in
                        if let url = url as? URL {
                            self?.handleSharedURL(url)
                        }
                    }
                } else if attachment.hasItemConformingToTypeIdentifier("public.text") {
                    attachment.loadItem(forTypeIdentifier: "public.text") { [weak self] text, error in
                        if let text = text as? String {
                            self?.handleSharedText(text)
                        }
                    }
                }
            }
        }
    }
}

struct ShareView: View {
    let onComplete: (ShareResult) -> Void
    @State private var topic = ""
    @State private var position: RadarPosition = .neutral
    @State private var isCreating = false
    @StateObject private var shareManager = ShareExtensionManager()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Create a Radar")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("What would you like to track?")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    TextField("Enter topic...", text: $topic)
                        .textFieldStyle(.roundedBorder)
                        .onAppear {
                            topic = shareManager.suggestedTopic
                        }
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your position")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Picker("Position", selection: $position) {
                        ForEach(RadarPosition.allCases, id: \.self) { pos in
                            Label(pos.displayName, systemImage: pos.icon)
                                .tag(pos)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                Spacer()
                
                HStack(spacing: 16) {
                    Button("Cancel") {
                        onComplete(.cancelled)
                    }
                    .buttonStyle(.bordered)
                    
                    Button("Create") {
                        createRadar()
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(topic.isEmpty || isCreating)
                }
            }
            .padding()
            .navigationBarHidden(true)
        }
    }
    
    private func createRadar() {
        isCreating = true
        
        Task {
            do {
                let radar = try await shareManager.createRadar(
                    topic: topic,
                    position: position
                )
                onComplete(.success(radar))
            } catch {
                onComplete(.failure(error))
            }
        }
    }
}
```

### 5. Spotlight Search

```swift
// radar-ios/Integrations/SpotlightManager.swift
import CoreSpotlight
import MobileCoreServices

class SpotlightManager {
    static let shared = SpotlightManager()
    private let domainIdentifier = "app.radar.searchable"
    
    func indexRadar(_ radar: Radar) {
        let attributeSet = CSSearchableItemAttributeSet(contentType: .content)
        
        // Configure attributes
        attributeSet.title = radar.topic
        attributeSet.contentDescription = radar.interpretation ?? "Track opinions about \(radar.topic)"
        attributeSet.keywords = [
            "radar",
            radar.topic,
            radar.position?.rawValue ?? "",
            "opinion",
            "ai"
        ]
        
        // Add thumbnail if available
        if let imageData = radar.thumbnailData {
            attributeSet.thumbnailData = imageData
        }
        
        // Dates
        attributeSet.contentCreationDate = radar.createdAt
        attributeSet.contentModificationDate = radar.updatedAt
        
        // Create searchable item
        let item = CSSearchableItem(
            uniqueIdentifier: "radar-\(radar.id)",
            domainIdentifier: domainIdentifier,
            attributeSet: attributeSet
        )
        
        // Set expiration
        item.expirationDate = Date().addingTimeInterval(30 * 24 * 60 * 60) // 30 days
        
        // Index item
        CSSearchableIndex.default().indexSearchableItems([item]) { error in
            if let error = error {
                print("Spotlight indexing error: \(error)")
            }
        }
    }
    
    func indexOpinion(_ opinion: Opinion, for radar: Radar) {
        let attributeSet = CSSearchableItemAttributeSet(contentType: .text)
        
        attributeSet.title = "Opinion: \(radar.topic)"
        attributeSet.contentDescription = opinion.content.prefix(200) + "..."
        attributeSet.keywords = [
            "opinion",
            radar.topic,
            opinion.model?.rawValue ?? "",
            opinion.position?.rawValue ?? ""
        ]
        
        let item = CSSearchableItem(
            uniqueIdentifier: "opinion-\(opinion.id)",
            domainIdentifier: domainIdentifier,
            attributeSet: attributeSet
        )
        
        CSSearchableIndex.default().indexSearchableItems([item]) { _ in }
    }
    
    func handleSpotlightAction(for identifier: String, completion: @escaping (Bool) -> Void) {
        if identifier.hasPrefix("radar-") {
            let radarId = String(identifier.dropFirst(6))
            DeepLinkManager.shared.handle(.radar(id: radarId))
            completion(true)
        } else if identifier.hasPrefix("opinion-") {
            let opinionId = String(identifier.dropFirst(8))
            DeepLinkManager.shared.handle(.opinion(id: opinionId))
            completion(true)
        } else {
            completion(false)
        }
    }
    
    func deleteAllSearchableItems() {
        CSSearchableIndex.default().deleteSearchableItems(
            withDomainIdentifiers: [domainIdentifier]
        ) { error in
            if let error = error {
                print("Error deleting searchable items: \(error)")
            }
        }
    }
}
```

### 6. Handoff Support

```swift
// radar-ios/Integrations/HandoffManager.swift
import UIKit

class HandoffManager {
    static let shared = HandoffManager()
    
    private let radarActivityType = "app.radar.view-radar"
    private let createActivityType = "app.radar.create-radar"
    
    private var currentActivity: NSUserActivity?
    
    func startRadarActivity(for radar: Radar) {
        let activity = NSUserActivity(activityType: radarActivityType)
        activity.title = radar.topic
        activity.userInfo = [
            "radarId": radar.id,
            "topic": radar.topic,
            "position": radar.position?.rawValue ?? ""
        ]
        
        // Web URL for handoff to web
        activity.webpageURL = URL(string: "https://radar.app/radar/\(radar.id)")
        
        // Search keywords
        activity.keywords = Set([radar.topic, "radar", "opinion"])
        activity.isEligibleForSearch = true
        activity.isEligibleForHandoff = true
        activity.isEligibleForPublicIndexing = true
        
        // Siri support
        activity.persistentIdentifier = radar.id
        activity.isEligibleForPrediction = true
        activity.suggestedInvocationPhrase = "Check \(radar.topic) radar"
        
        currentActivity = activity
        activity.becomeCurrent()
    }
    
    func startCreateActivity(topic: String? = nil) {
        let activity = NSUserActivity(activityType: createActivityType)
        activity.title = "Create Radar"
        
        if let topic = topic {
            activity.userInfo = ["topic": topic]
        }
        
        activity.webpageURL = URL(string: "https://radar.app/create")
        activity.isEligibleForHandoff = true
        
        currentActivity = activity
        activity.becomeCurrent()
    }
    
    func handleContinuation(of activity: NSUserActivity) -> Bool {
        switch activity.activityType {
        case radarActivityType:
            if let radarId = activity.userInfo?["radarId"] as? String {
                DeepLinkManager.shared.handle(.radar(id: radarId))
                return true
            }
        case createActivityType:
            if let topic = activity.userInfo?["topic"] as? String {
                DeepLinkManager.shared.handle(.create(topic: topic))
            } else {
                DeepLinkManager.shared.handle(.create(topic: nil))
            }
            return true
        default:
            break
        }
        
        return false
    }
}
```

### 7. Deep Linking

```swift
// radar-ios/Integrations/DeepLinkManager.swift
import Foundation
import SwiftUI

enum DeepLink {
    case radar(id: String)
    case opinion(id: String)
    case create(topic: String?)
    case explore
    case profile(userId: String?)
    case settings
    case subscription
}

@MainActor
class DeepLinkManager: ObservableObject {
    static let shared = DeepLinkManager()
    
    @Published var pendingDeepLink: DeepLink?
    
    private init() {}
    
    func handle(_ deepLink: DeepLink) {
        pendingDeepLink = deepLink
        
        // Navigate based on deep link
        switch deepLink {
        case .radar(let id):
            navigateToRadar(id: id)
        case .opinion(let id):
            navigateToOpinion(id: id)
        case .create(let topic):
            presentCreateRadar(topic: topic)
        case .explore:
            navigateToExplore()
        case .profile(let userId):
            navigateToProfile(userId: userId)
        case .settings:
            navigateToSettings()
        case .subscription:
            navigateToSubscription()
        }
    }
    
    func handleURL(_ url: URL) -> Bool {
        guard url.scheme == "radar" else { return false }
        
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        
        switch url.host {
        case "open":
            if let radarId = pathComponents.first {
                handle(.radar(id: radarId))
                return true
            }
        case "create":
            let topic = url.queryParameters["topic"]
            handle(.create(topic: topic))
            return true
        case "explore":
            handle(.explore)
            return true
        case "profile":
            let userId = pathComponents.first
            handle(.profile(userId: userId))
            return true
        case "settings":
            handle(.settings)
            return true
        case "subscription":
            handle(.subscription)
            return true
        default:
            break
        }
        
        return false
    }
    
    private func navigateToRadar(id: String) {
        // Post notification or use navigation coordinator
        NotificationCenter.default.post(
            name: .navigateToRadar,
            object: nil,
            userInfo: ["radarId": id]
        )
    }
    
    private func presentCreateRadar(topic: String?) {
        NotificationCenter.default.post(
            name: .presentCreateRadar,
            object: nil,
            userInfo: ["topic": topic ?? ""]
        )
    }
}

// URL Scheme Registration in Info.plist:
/*
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>radar</string>
        </array>
        <key>CFBundleURLName</key>
        <string>app.radar</string>
    </dict>
</array>
*/
```

### 8. Control Center Widget

```swift
// RadarWidgets/ControlWidget.swift
import WidgetKit
import SwiftUI
import AppIntents

struct RadarControlWidget: ControlWidget {
    static let kind: String = "RadarControlWidget"
    
    var body: some ControlWidgetConfiguration {
        AppIntentControlConfiguration(
            kind: Self.kind,
            intent: RefreshAllRadarsIntent.self
        ) { configuration in
            ControlWidgetButton(action: configuration) {
                Label("Refresh Radars", systemImage: "arrow.clockwise")
            }
        }
        .displayName("Refresh Radars")
        .description("Update all your radars")
    }
}

struct RefreshAllRadarsIntent: AppIntent {
    static var title: LocalizedStringResource = "Refresh All Radars"
    
    func perform() async throws -> some IntentResult {
        let count = try await RadarService.shared.refreshAllRadars()
        
        return .result(
            dialog: "Refreshed \(count) radars"
        )
    }
}
```

## Dependencies

- Agent 2 (API Integration) - For widget data
- Agent 6 (Notifications) - For widget updates
- Agent 8 (AI Features) - For Siri integration

## Testing Strategy

1. **Widget Tests**
   - Test timeline generation
   - Test widget updates
   - Test deep linking from widgets

2. **Siri Tests**
   - Test voice commands
   - Test shortcut execution
   - Test parameter handling

3. **Integration Tests**
   - Test share extension
   - Test Spotlight indexing
   - Test handoff between devices

## Security Considerations

1. **Widget Data**: Use app groups securely
2. **URL Schemes**: Validate deep links
3. **Siri**: Don't expose sensitive data
4. **Share Extension**: Validate shared content
5. **Keychain**: Share credentials securely

## Effort Estimate

10-12 developer days

## Success Metrics

- [ ] All widget sizes implemented
- [ ] Siri shortcuts working reliably
- [ ] Share extension functional
- [ ] Spotlight search accurate
- [ ] Handoff seamless between devices
- [ ] Deep links handled correctly
- [ ] < 1s widget refresh time
- [ ] 100% Siri intent success rate
- [ ] Zero crashes in extensions
- [ ] Full iOS 17+ feature adoption