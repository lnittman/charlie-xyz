# Agent 9: Settings & Preferences
*"Complete settings implementation with all preferences and configuration options"*

## Scope

This agent will implement a comprehensive settings system including user preferences, app configuration, notification settings, privacy controls, data management, appearance customization, and account management. The implementation will provide a native iOS settings experience with proper persistence and synchronization.

## Packages to modify

- `radar-ios/Views/Settings/` - Settings UI implementation
- `radar-ios/Managers/SettingsManager.swift` - Settings persistence
- `Packages/RadarCore/Sources/RadarCore/UserDefaults/` - Settings storage
- `radar-ios/Views/Account/` - Account management views

## Implementation Details

### 1. Settings Architecture

```swift
// radar-ios/Managers/SettingsManager.swift
import Foundation
import Combine
import SwiftUI

@MainActor
final class SettingsManager: ObservableObject {
    static let shared = SettingsManager()
    
    // MARK: - General Settings
    @AppStorage("defaultRadarPosition") var defaultRadarPosition: RadarPosition = .neutral
    @AppStorage("autoRefreshEnabled") var autoRefreshEnabled = true
    @AppStorage("autoRefreshInterval") var autoRefreshInterval: TimeInterval = 3600
    @AppStorage("soundsEnabled") var soundsEnabled = true
    @AppStorage("hapticsEnabled") var hapticsEnabled = true
    
    // MARK: - Appearance
    @AppStorage("appTheme") var appTheme: AppTheme = .system
    @AppStorage("appIcon") var appIcon: AppIcon = .default
    @AppStorage("accentColor") var accentColor: AccentColor = .blue
    @AppStorage("useSystemFont") var useSystemFont = true
    @AppStorage("fontSize") var fontSize: FontSize = .medium
    
    // MARK: - Privacy
    @AppStorage("analyticsEnabled") var analyticsEnabled = true
    @AppStorage("crashReportingEnabled") var crashReportingEnabled = true
    @AppStorage("personalizedAdsEnabled") var personalizedAdsEnabled = false
    @AppStorage("shareUsageData") var shareUsageData = false
    
    // MARK: - Notifications
    @Published var notificationSettings = NotificationSettings()
    
    // MARK: - Data & Storage
    @AppStorage("cacheSize") private var _cacheSize: Double = 0
    @AppStorage("offlineStorageEnabled") var offlineStorageEnabled = true
    @AppStorage("autoDeleteOldData") var autoDeleteOldData = true
    @AppStorage("dataRetentionDays") var dataRetentionDays = 30
    
    // MARK: - Advanced
    @AppStorage("developerModeEnabled") var developerModeEnabled = false
    @AppStorage("betaFeaturesEnabled") var betaFeaturesEnabled = false
    @AppStorage("debugLoggingEnabled") var debugLoggingEnabled = false
    
    var cacheSize: Int64 {
        get { Int64(_cacheSize) }
        set { _cacheSize = Double(newValue) }
    }
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        setupObservers()
        loadNotificationSettings()
    }
    
    private func setupObservers() {
        // Sync settings changes to backend
        objectWillChange
            .debounce(for: .seconds(1), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.syncSettingsToBackend()
            }
            .store(in: &cancellables)
    }
    
    func resetToDefaults() {
        defaultRadarPosition = .neutral
        autoRefreshEnabled = true
        autoRefreshInterval = 3600
        soundsEnabled = true
        hapticsEnabled = true
        appTheme = .system
        analyticsEnabled = true
        crashReportingEnabled = true
        personalizedAdsEnabled = false
    }
}

// MARK: - Models

enum AppTheme: String, CaseIterable {
    case system = "System"
    case light = "Light"
    case dark = "Dark"
    
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

enum AppIcon: String, CaseIterable {
    case `default` = "Default"
    case dark = "Dark"
    case gradient = "Gradient"
    case minimal = "Minimal"
    case pride = "Pride"
    
    var iconName: String? {
        switch self {
        case .default: return nil
        default: return "AppIcon-\(rawValue)"
        }
    }
}

enum AccentColor: String, CaseIterable {
    case blue = "Blue"
    case purple = "Purple"
    case pink = "Pink"
    case red = "Red"
    case orange = "Orange"
    case yellow = "Yellow"
    case green = "Green"
    case teal = "Teal"
    
    var color: Color {
        switch self {
        case .blue: return .blue
        case .purple: return .purple
        case .pink: return .pink
        case .red: return .red
        case .orange: return .orange
        case .yellow: return .yellow
        case .green: return .green
        case .teal: return .teal
        }
    }
}

enum FontSize: String, CaseIterable {
    case small = "Small"
    case medium = "Medium"
    case large = "Large"
    case extraLarge = "Extra Large"
    
    var scaleFactor: CGFloat {
        switch self {
        case .small: return 0.85
        case .medium: return 1.0
        case .large: return 1.15
        case .extraLarge: return 1.3
        }
    }
}
```

### 2. Main Settings View

```swift
// radar-ios/Views/Settings/SettingsView.swift
import SwiftUI

struct SettingsView: View {
    @StateObject private var settingsManager = SettingsManager.shared
    @State private var showingAccountDeletion = false
    @State private var showingDataExport = false
    
    var body: some View {
        NavigationStack {
            List {
                // Account Section
                Section {
                    NavigationLink(destination: AccountSettingsView()) {
                        HStack {
                            if let user = AuthManager.shared.currentUser {
                                AsyncImage(url: user.avatarURL) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Circle()
                                        .fill(Color.radarMuted.opacity(0.3))
                                }
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                                
                                VStack(alignment: .leading) {
                                    Text(user.displayName)
                                        .font(.headline)
                                    Text(user.email)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                // General Settings
                Section("General") {
                    NavigationLink(destination: GeneralSettingsView()) {
                        SettingsRow(
                            icon: "gearshape",
                            title: "General",
                            subtitle: "Default settings and behavior"
                        )
                    }
                    
                    NavigationLink(destination: NotificationSettingsView()) {
                        SettingsRow(
                            icon: "bell",
                            title: "Notifications",
                            subtitle: "Alerts and reminders"
                        )
                    }
                    
                    NavigationLink(destination: AppearanceSettingsView()) {
                        SettingsRow(
                            icon: "paintbrush",
                            title: "Appearance",
                            subtitle: "Theme, colors, and fonts"
                        )
                    }
                }
                
                // Data & Privacy
                Section("Data & Privacy") {
                    NavigationLink(destination: PrivacySettingsView()) {
                        SettingsRow(
                            icon: "lock.shield",
                            title: "Privacy",
                            subtitle: "Data collection and sharing"
                        )
                    }
                    
                    NavigationLink(destination: DataStorageSettingsView()) {
                        SettingsRow(
                            icon: "internaldrive",
                            title: "Storage",
                            subtitle: "Cache and offline data"
                        )
                    }
                    
                    Button(action: { showingDataExport = true }) {
                        SettingsRow(
                            icon: "square.and.arrow.up",
                            title: "Export Data",
                            subtitle: "Download all your data"
                        )
                    }
                }
                
                // Support
                Section("Support") {
                    NavigationLink(destination: HelpCenterView()) {
                        SettingsRow(
                            icon: "questionmark.circle",
                            title: "Help Center",
                            subtitle: "FAQs and tutorials"
                        )
                    }
                    
                    NavigationLink(destination: ContactSupportView()) {
                        SettingsRow(
                            icon: "envelope",
                            title: "Contact Support",
                            subtitle: "Get help from our team"
                        )
                    }
                    
                    Button(action: sendFeedback) {
                        SettingsRow(
                            icon: "bubble.left",
                            title: "Send Feedback",
                            subtitle: "Help us improve Radar"
                        )
                    }
                }
                
                // Advanced
                Section("Advanced") {
                    NavigationLink(destination: DeveloperSettingsView()) {
                        SettingsRow(
                            icon: "hammer",
                            title: "Developer",
                            subtitle: "Advanced options"
                        )
                    }
                }
                
                // About
                Section("About") {
                    NavigationLink(destination: AboutView()) {
                        SettingsRow(
                            icon: "info.circle",
                            title: "About Radar",
                            subtitle: "Version \(Bundle.main.appVersion)"
                        )
                    }
                    
                    Link(destination: URL(string: "https://radar.app/terms")!) {
                        SettingsRow(
                            icon: "doc.text",
                            title: "Terms of Service",
                            subtitle: nil
                        )
                    }
                    
                    Link(destination: URL(string: "https://radar.app/privacy")!) {
                        SettingsRow(
                            icon: "hand.raised",
                            title: "Privacy Policy",
                            subtitle: nil
                        )
                    }
                }
                
                // Account Actions
                Section {
                    Button(action: signOut) {
                        Text("Sign Out")
                            .foregroundColor(.red)
                    }
                    
                    Button(action: { showingAccountDeletion = true }) {
                        Text("Delete Account")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showingDataExport) {
            DataExportView()
        }
        .alert("Delete Account", isPresented: $showingAccountDeletion) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                deleteAccount()
            }
        } message: {
            Text("This will permanently delete your account and all associated data. This action cannot be undone.")
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String?
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(.radarAccent)
                .frame(width: 28)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}
```

### 3. General Settings

```swift
// radar-ios/Views/Settings/GeneralSettingsView.swift
import SwiftUI

struct GeneralSettingsView: View {
    @StateObject private var settings = SettingsManager.shared
    
    var body: some View {
        Form {
            Section("Defaults") {
                Picker("Default Position", selection: $settings.defaultRadarPosition) {
                    ForEach(RadarPosition.allCases, id: \.self) { position in
                        HStack {
                            Image(systemName: position.icon)
                            Text(position.displayName)
                        }
                        .tag(position)
                    }
                }
                
                Toggle("Auto-refresh Radars", isOn: $settings.autoRefreshEnabled)
                
                if settings.autoRefreshEnabled {
                    Picker("Refresh Interval", selection: $settings.autoRefreshInterval) {
                        Text("Every 30 minutes").tag(TimeInterval(1800))
                        Text("Every hour").tag(TimeInterval(3600))
                        Text("Every 2 hours").tag(TimeInterval(7200))
                        Text("Every 6 hours").tag(TimeInterval(21600))
                        Text("Daily").tag(TimeInterval(86400))
                    }
                }
            }
            
            Section("Behavior") {
                Toggle("Sound Effects", isOn: $settings.soundsEnabled)
                Toggle("Haptic Feedback", isOn: $settings.hapticsEnabled)
            }
            
            Section("Export/Import") {
                Button("Export Settings") {
                    exportSettings()
                }
                
                Button("Import Settings") {
                    importSettings()
                }
            }
            
            Section {
                Button("Reset to Defaults") {
                    settings.resetToDefaults()
                }
                .foregroundColor(.red)
            }
        }
        .navigationTitle("General")
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

### 4. Appearance Settings

```swift
// radar-ios/Views/Settings/AppearanceSettingsView.swift
import SwiftUI

struct AppearanceSettingsView: View {
    @StateObject private var settings = SettingsManager.shared
    @State private var showingIconPicker = false
    @Environment(\.colorScheme) private var systemColorScheme
    
    var body: some View {
        Form {
            Section("Theme") {
                Picker("App Theme", selection: $settings.appTheme) {
                    ForEach(AppTheme.allCases, id: \.self) { theme in
                        Text(theme.rawValue).tag(theme)
                    }
                }
                .pickerStyle(.segmented)
                
                // Theme preview
                ThemePreview(theme: settings.appTheme)
                    .frame(height: 120)
                    .listRowInsets(EdgeInsets())
            }
            
            Section("App Icon") {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(AppIcon.allCases, id: \.self) { icon in
                            AppIconOption(
                                icon: icon,
                                isSelected: settings.appIcon == icon,
                                onSelect: {
                                    settings.appIcon = icon
                                    updateAppIcon(icon)
                                }
                            )
                        }
                    }
                    .padding(.vertical, 8)
                }
                .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
            }
            
            Section("Colors") {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Accent Color")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 16) {
                        ForEach(AccentColor.allCases, id: \.self) { color in
                            AccentColorOption(
                                color: color,
                                isSelected: settings.accentColor == color,
                                onSelect: { settings.accentColor = color }
                            )
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            
            Section("Typography") {
                Toggle("Use System Font", isOn: $settings.useSystemFont)
                
                Picker("Font Size", selection: $settings.fontSize) {
                    ForEach(FontSize.allCases, id: \.self) { size in
                        Text(size.rawValue).tag(size)
                    }
                }
                
                // Font preview
                FontPreview(
                    useSystemFont: settings.useSystemFont,
                    fontSize: settings.fontSize
                )
            }
        }
        .navigationTitle("Appearance")
        .navigationBarTitleDisplayMode(.inline)
        .preferredColorScheme(settings.appTheme.colorScheme)
    }
    
    private func updateAppIcon(_ icon: AppIcon) {
        UIApplication.shared.setAlternateIconName(icon.iconName) { error in
            if let error = error {
                print("Error changing app icon: \(error)")
            }
        }
    }
}

struct AppIconOption: View {
    let icon: AppIcon
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 8) {
                Image("\(icon.rawValue)Icon")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 60, height: 60)
                    .cornerRadius(13.5)
                    .overlay(
                        RoundedRectangle(cornerRadius: 13.5)
                            .stroke(
                                isSelected ? Color.radarAccent : Color.clear,
                                lineWidth: 3
                            )
                    )
                
                Text(icon.rawValue)
                    .font(.caption)
                    .foregroundColor(isSelected ? .radarAccent : .secondary)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct AccentColorOption: View {
    let color: AccentColor
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            Circle()
                .fill(color.color)
                .frame(width: 44, height: 44)
                .overlay(
                    Circle()
                        .stroke(Color.primary.opacity(0.2), lineWidth: 1)
                )
                .overlay(
                    Image(systemName: "checkmark")
                        .font(.caption)
                        .foregroundColor(.white)
                        .opacity(isSelected ? 1 : 0)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

### 5. Privacy Settings

```swift
// radar-ios/Views/Settings/PrivacySettingsView.swift
import SwiftUI

struct PrivacySettingsView: View {
    @StateObject private var settings = SettingsManager.shared
    @State private var showingPrivacyDetails = false
    
    var body: some View {
        Form {
            Section {
                Text("We respect your privacy. Learn more about how we collect and use your data.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Button("Privacy Policy") {
                    showingPrivacyDetails = true
                }
            }
            
            Section("Analytics") {
                Toggle(isOn: $settings.analyticsEnabled) {
                    VStack(alignment: .leading) {
                        Text("Usage Analytics")
                        Text("Help us improve Radar by sharing anonymous usage data")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Toggle(isOn: $settings.crashReportingEnabled) {
                    VStack(alignment: .leading) {
                        Text("Crash Reports")
                        Text("Automatically send crash reports to help us fix issues")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Section("Personalization") {
                Toggle(isOn: $settings.personalizedAdsEnabled) {
                    VStack(alignment: .leading) {
                        Text("Personalized Ads")
                        Text("Show ads based on your interests")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Toggle(isOn: $settings.shareUsageData) {
                    VStack(alignment: .leading) {
                        Text("Share with Partners")
                        Text("Share anonymous data with our partners")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Section("Data Management") {
                NavigationLink(destination: DataPermissionsView()) {
                    HStack {
                        Text("App Permissions")
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Button("Clear All Data") {
                    clearAllData()
                }
                .foregroundColor(.red)
                
                Button("Request Data Deletion") {
                    requestDataDeletion()
                }
                .foregroundColor(.red)
            }
        }
        .navigationTitle("Privacy")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingPrivacyDetails) {
            SafariView(url: URL(string: "https://radar.app/privacy")!)
        }
    }
}
```

### 6. Storage Settings

```swift
// radar-ios/Views/Settings/DataStorageSettingsView.swift
import SwiftUI

struct DataStorageSettingsView: View {
    @StateObject private var settings = SettingsManager.shared
    @State private var isCalculatingCache = false
    @State private var cacheSize: Int64 = 0
    
    var body: some View {
        Form {
            Section("Storage Usage") {
                HStack {
                    Text("Cache Size")
                    Spacer()
                    if isCalculatingCache {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else {
                        Text(ByteCountFormatter.string(fromByteCount: cacheSize, countStyle: .file))
                            .foregroundColor(.secondary)
                    }
                }
                
                Button("Clear Cache") {
                    clearCache()
                }
                .disabled(isCalculatingCache || cacheSize == 0)
                
                StorageBreakdownView()
                    .frame(height: 200)
                    .listRowInsets(EdgeInsets())
            }
            
            Section("Offline Storage") {
                Toggle("Enable Offline Storage", isOn: $settings.offlineStorageEnabled)
                
                if settings.offlineStorageEnabled {
                    Toggle("Auto-delete Old Data", isOn: $settings.autoDeleteOldData)
                    
                    if settings.autoDeleteOldData {
                        Stepper(
                            "Keep data for \(settings.dataRetentionDays) days",
                            value: $settings.dataRetentionDays,
                            in: 7...90,
                            step: 7
                        )
                    }
                }
            }
            
            Section("Download Settings") {
                Toggle("Download Images", isOn: .constant(true))
                Toggle("Download over Cellular", isOn: .constant(false))
                
                Picker("Image Quality", selection: .constant("High")) {
                    Text("Low").tag("Low")
                    Text("Medium").tag("Medium")
                    Text("High").tag("High")
                }
            }
        }
        .navigationTitle("Storage")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            calculateCacheSize()
        }
    }
    
    private func calculateCacheSize() {
        isCalculatingCache = true
        
        Task {
            let size = await CacheManager.shared.calculateCacheSize()
            await MainActor.run {
                cacheSize = size
                settings.cacheSize = size
                isCalculatingCache = false
            }
        }
    }
    
    private func clearCache() {
        Task {
            await CacheManager.shared.clearCache()
            calculateCacheSize()
        }
    }
}

struct StorageBreakdownView: View {
    @State private var storageData: [StorageCategory] = []
    
    var body: some View {
        Chart(storageData) { category in
            SectorMark(
                angle: .value("Size", category.size),
                innerRadius: .ratio(0.6),
                angularInset: 2
            )
            .foregroundStyle(category.color)
            .annotation(position: .overlay) {
                VStack {
                    Text(category.name)
                        .font(.caption)
                        .fontWeight(.medium)
                    Text(ByteCountFormatter.string(fromByteCount: category.size, countStyle: .file))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .onAppear {
            loadStorageData()
        }
    }
    
    private func loadStorageData() {
        Task {
            let breakdown = await StorageManager.shared.getStorageBreakdown()
            storageData = breakdown
        }
    }
}
```

### 7. Developer Settings

```swift
// radar-ios/Views/Settings/DeveloperSettingsView.swift
import SwiftUI

struct DeveloperSettingsView: View {
    @StateObject private var settings = SettingsManager.shared
    @State private var showingAPIEndpoint = false
    @State private var customAPIEndpoint = ""
    
    var body: some View {
        Form {
            Section("Features") {
                Toggle("Developer Mode", isOn: $settings.developerModeEnabled)
                
                if settings.developerModeEnabled {
                    Toggle("Beta Features", isOn: $settings.betaFeaturesEnabled)
                    Toggle("Debug Logging", isOn: $settings.debugLoggingEnabled)
                }
            }
            
            if settings.developerModeEnabled {
                Section("API") {
                    HStack {
                        Text("API Endpoint")
                        Spacer()
                        Text(APIClient.shared.baseURL.absoluteString)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Button("Change API Endpoint") {
                        showingAPIEndpoint = true
                    }
                    
                    Button("Reset to Production") {
                        APIClient.shared.resetToProduction()
                    }
                }
                
                Section("Debug Tools") {
                    NavigationLink("View Logs") {
                        LogViewerView()
                    }
                    
                    NavigationLink("Network Inspector") {
                        NetworkInspectorView()
                    }
                    
                    Button("Export Debug Info") {
                        exportDebugInfo()
                    }
                    
                    Button("Trigger Test Crash") {
                        fatalError("Test crash triggered")
                    }
                    .foregroundColor(.red)
                }
                
                Section("Feature Flags") {
                    ForEach(FeatureFlag.allCases, id: \.self) { flag in
                        Toggle(flag.displayName, isOn: flag.binding)
                    }
                }
            }
        }
        .navigationTitle("Developer")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Custom API Endpoint", isPresented: $showingAPIEndpoint) {
            TextField("https://api.radar.app", text: $customAPIEndpoint)
            Button("Cancel", role: .cancel) {}
            Button("Save") {
                if let url = URL(string: customAPIEndpoint) {
                    APIClient.shared.setCustomEndpoint(url)
                }
            }
        }
    }
}
```

## Dependencies

- Agent 1 (Authentication) - For account management
- Agent 6 (Notifications) - For notification settings

## Testing Strategy

1. **Unit Tests**
   - Test settings persistence
   - Test default values
   - Test import/export

2. **Integration Tests**
   - Test settings sync
   - Test app icon changes
   - Test theme switching

3. **UI Tests**
   - Test navigation flow
   - Test toggle states
   - Test form validation

## Security Considerations

1. **Data Export**: Encrypt exported data
2. **Account Deletion**: Require authentication
3. **API Endpoints**: Validate custom endpoints
4. **Debug Info**: Sanitize sensitive data
5. **Privacy Settings**: Respect user choices

## Effort Estimate

6-8 developer days

## Success Metrics

- [ ] All settings persisted properly
- [ ] Theme switching smooth
- [ ] App icon change working
- [ ] Privacy settings respected
- [ ] Data export functional
- [ ] Settings sync reliable
- [ ] Developer tools hidden by default
- [ ] < 100ms settings load time
- [ ] Zero data loss on app updates
- [ ] Accessibility compliant