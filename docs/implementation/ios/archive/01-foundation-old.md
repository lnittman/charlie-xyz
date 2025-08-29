# Agent 1: Project Foundation & Design System
*"Establish the iOS project structure and create a world-class design system"*

## Scope

This agent establishes the foundational iOS project structure and creates a comprehensive SwiftUI design system that mirrors the web app's aesthetic while embracing native iOS patterns. This includes setting up the Xcode project, creating Swift packages, and building reusable UI components.

## Directory Structure

```
radar-apple/
├── Radar.xcodeproj/
├── Radar/
│   ├── App/
│   │   ├── RadarApp.swift              # App entry point
│   │   └── ContentView.swift           # Root view
│   ├── Resources/
│   │   ├── Assets.xcassets/           # Images, colors, icons
│   │   └── Fonts/                     # Custom fonts
│   └── Info.plist
├── RadarWidget/                        # Widget extension (future)
└── Packages/
    └── Design/                         # Design system package
        ├── Package.swift
        └── Sources/
            └── Design/
                ├── Theme/
                │   ├── Colors.swift
                │   ├── Typography.swift
                │   ├── Spacing.swift
                │   └── Shadows.swift
                ├── Components/
                │   ├── Button.swift
                │   ├── Card.swift
                │   ├── TextField.swift
                │   ├── Badge.swift
                │   └── NavigationBar.swift
                ├── Effects/
                │   ├── GlassBackground.swift
                │   ├── HapticFeedback.swift
                │   └── Transitions.swift
                └── Design.swift
```

## Implementation Details

### 1. Xcode Project Setup

```bash
# Create project directory (outside turborepo)
cd ~/Developer/apps/radar
mkdir radar-apple
cd radar-apple

# Create Xcode project via command line or Xcode GUI
# - Product Name: Radar
# - Team: Your team
# - Organization Identifier: com.yourcompany
# - Interface: SwiftUI
# - Language: Swift
# - Use Core Data: No
# - Include Tests: Yes
```

### 2. Design Package Creation

```swift
// Packages/Design/Package.swift
// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "Design",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "Design",
            targets: ["Design"]
        ),
    ],
    targets: [
        .target(
            name: "Design",
            resources: [
                .process("Resources/Fonts")
            ]
        ),
        .testTarget(
            name: "DesignTests",
            dependencies: ["Design"]
        ),
    ]
)
```

### 3. Core Design System Components

```swift
// Sources/Design/Theme/Colors.swift
import SwiftUI

public extension Color {
    // Primary colors matching web app
    static let radarPrimary = Color(hex: "18181B") // stone-900
    static let radarSecondary = Color(hex: "57534E") // stone-600
    static let radarAccent = Color(hex: "DC2626") // red-600
    
    // Semantic colors
    static let radarBackground = Color(hex: "FAFAF9") // stone-50
    static let radarSurface = Color(hex: "FFFFFF")
    static let radarMuted = Color(hex: "A8A29E") // stone-400
    static let radarSubtle = Color(hex: "78716C") // stone-500
    
    // Dark mode variants
    static let radarBackgroundDark = Color(hex: "0C0A09") // stone-950
    static let radarSurfaceDark = Color(hex: "1C1917") // stone-900
}

// Sources/Design/Theme/Typography.swift
import SwiftUI

public struct RadarTypography {
    public static let largeTitle = Font.custom("YourFont-Bold", size: 34)
    public static let title1 = Font.custom("YourFont-Semibold", size: 28)
    public static let title2 = Font.custom("YourFont-Semibold", size: 22)
    public static let title3 = Font.custom("YourFont-Semibold", size: 20)
    public static let headline = Font.custom("YourFont-Semibold", size: 17)
    public static let body = Font.custom("YourFont-Regular", size: 17)
    public static let callout = Font.custom("YourFont-Regular", size: 16)
    public static let subheadline = Font.custom("YourFont-Regular", size: 15)
    public static let footnote = Font.custom("YourFont-Regular", size: 13)
    public static let caption1 = Font.custom("YourFont-Regular", size: 12)
    public static let caption2 = Font.custom("YourFont-Regular", size: 11)
}

// Sources/Design/Components/Card.swift
import SwiftUI

public struct RadarCard<Content: View>: View {
    let content: Content
    let padding: CGFloat
    
    public init(
        padding: CGFloat = 16,
        @ViewBuilder content: () -> Content
    ) {
        self.padding = padding
        self.content = content()
    }
    
    public var body: some View {
        content
            .padding(padding)
            .background(Color.radarSurface)
            .cornerRadius(12)
            .shadow(
                color: Color.black.opacity(0.04),
                radius: 8,
                x: 0,
                y: 2
            )
    }
}

// Sources/Design/Components/Button.swift
import SwiftUI

public struct RadarButton: View {
    public enum Style {
        case primary
        case secondary
        case ghost
    }
    
    let title: String
    let style: Style
    let action: () -> Void
    
    public init(
        _ title: String,
        style: Style = .primary,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.style = style
        self.action = action
    }
    
    public var body: some View {
        Button(action: {
            HapticManager.impact(.light)
            action()
        }) {
            Text(title)
                .font(RadarTypography.headline)
                .foregroundColor(foregroundColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(backgroundColor)
                .cornerRadius(8)
        }
    }
    
    private var backgroundColor: Color {
        switch style {
        case .primary: return .radarPrimary
        case .secondary: return .radarMuted.opacity(0.1)
        case .ghost: return .clear
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .primary: return .white
        case .secondary, .ghost: return .radarPrimary
        }
    }
}

// Sources/Design/Effects/GlassBackground.swift
import SwiftUI

public struct GlassBackground: ViewModifier {
    let cornerRadius: CGFloat
    
    public func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Base glass effect
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(.ultraThinMaterial)
                    
                    // Subtle gradient overlay
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.1),
                            Color.white.opacity(0.05)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .cornerRadius(cornerRadius)
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.3),
                                Color.white.opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
            )
    }
}

// Sources/Design/Effects/HapticFeedback.swift
import UIKit

public enum HapticManager {
    public static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    public static func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(type)
    }
    
    public static func selection() {
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        generator.selectionChanged()
    }
}
```

### 4. App Entry Point

```swift
// Radar/App/RadarApp.swift
import SwiftUI
import Design

@main
struct RadarApp: App {
    init() {
        setupAppearance()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.none) // Respect system setting
        }
    }
    
    private func setupAppearance() {
        // Configure navigation bar appearance
        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = UIColor(Color.radarBackground)
        navBarAppearance.titleTextAttributes = [
            .font: UIFont(name: "YourFont-Semibold", size: 17)!
        ]
        
        UINavigationBar.appearance().standardAppearance = navBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navBarAppearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = UIColor(Color.radarBackground)
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }
}

// Radar/App/ContentView.swift
import SwiftUI
import Design

struct ContentView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Placeholder content to test design system
                    RadarCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Welcome to Radar")
                                .font(RadarTypography.title2)
                            
                            Text("Track AI opinions on any topic")
                                .font(RadarTypography.body)
                                .foregroundColor(.radarMuted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal)
                    
                    HStack(spacing: 12) {
                        RadarButton("Get Started", style: .primary) {
                            // Action
                        }
                        
                        RadarButton("Learn More", style: .secondary) {
                            // Action
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.radarBackground)
            .navigationTitle("Radar")
        }
    }
}
```

### 5. Custom Navigation Components

```swift
// Sources/Design/Components/NavigationBar.swift
import SwiftUI

public struct RadarNavigationBar: View {
    let title: String
    let subtitle: String?
    @Binding var scrollOffset: CGFloat
    
    public init(
        title: String,
        subtitle: String? = nil,
        scrollOffset: Binding<CGFloat>
    ) {
        self.title = title
        self.subtitle = subtitle
        self._scrollOffset = scrollOffset
    }
    
    public var body: some View {
        ZStack {
            // Background with fade effect
            Color.radarBackground
                .opacity(fadeOpacity)
                .ignoresSafeArea()
                .modifier(GlassBackground(cornerRadius: 0))
            
            VStack(spacing: 4) {
                Text(title)
                    .font(titleFont)
                    .scaleEffect(titleScale)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(RadarTypography.footnote)
                        .foregroundColor(.radarMuted)
                        .opacity(subtitleOpacity)
                }
            }
            .animation(.interactiveSpring(), value: scrollOffset)
        }
        .frame(height: navigationBarHeight)
    }
    
    private var fadeOpacity: Double {
        min(max(scrollOffset / 100, 0), 1)
    }
    
    private var titleScale: CGFloat {
        let scale = 1 - (scrollOffset / 200)
        return min(max(scale, 0.8), 1)
    }
    
    private var titleFont: Font {
        scrollOffset > 50 ? RadarTypography.headline : RadarTypography.largeTitle
    }
    
    private var subtitleOpacity: Double {
        scrollOffset > 50 ? 0 : 1
    }
    
    private var navigationBarHeight: CGFloat {
        scrollOffset > 50 ? 44 : 96
    }
}
```

## Dependencies

- No external dependencies for initial setup
- Swift 5.9+ for package features
- iOS 17.0+ for latest SwiftUI features

## Testing Strategy

### Unit Tests
- Color system accuracy
- Typography scaling
- Component state management

### UI Tests
- Component visual regression tests
- Accessibility compliance
- Dark mode transitions

### Snapshot Tests
```swift
// DesignTests/ComponentSnapshotTests.swift
import XCTest
import SnapshotTesting
@testable import Design

final class ComponentSnapshotTests: XCTestCase {
    func testRadarCard() {
        let card = RadarCard {
            Text("Test Content")
        }
        
        assertSnapshot(matching: card, as: .image)
    }
    
    func testRadarButton() {
        let button = RadarButton("Test Button", style: .primary) {}
        
        assertSnapshot(matching: button, as: .image)
    }
}
```

## Security Considerations

- Use SF Symbols for system icons (no external assets)
- Validate all color inputs
- Ensure font loading is secure
- No network requests in design package

## Effort Estimate

3-4 developer days:
- Day 1: Project setup and structure
- Day 2: Core design system implementation
- Day 3: Component library creation
- Day 4: Testing and documentation

## Success Metrics

- [ ] Xcode project compiles and runs
- [ ] Design package builds independently
- [ ] All components match web app aesthetic
- [ ] Dark mode works correctly
- [ ] Components are fully accessible
- [ ] Haptic feedback enhances interactions
- [ ] No memory leaks or performance issues
- [ ] 100% documentation coverage for public APIs