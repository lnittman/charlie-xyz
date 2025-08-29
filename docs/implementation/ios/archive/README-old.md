# Radar iOS - Native SwiftUI Implementation Plan

## Overview

Transform the placeholder React Native app (`apps/native`) into a world-class native SwiftUI iOS application that mirrors the Radar web app functionality while optimizing for iOS design patterns and native capabilities.

### Project Structure Decision

Based on your convention and the reference apps, the recommended structure is:
- **Keep Xcode project OUTSIDE the turborepo**: `radar/radar-apple/` 
- **Maintain separation**: Xcode projects have different build systems and dependencies that don't play well with Node.js tooling
- **Share what makes sense**: Types, API schemas, and business logic can be shared via Swift packages

### Architecture Overview

```
radar/
├── radar-apple/                    # Native iOS app (outside turborepo)
│   ├── Radar.xcodeproj/
│   ├── Radar/                      # Main app target
│   ├── RadarWidget/               # Widget extension
│   └── Packages/                  # Swift packages
│       ├── Design/                # UI components & design system
│       ├── RadarCore/             # Business logic
│       ├── RadarAPI/              # API client
│       └── RadarAuth/             # Authentication
└── radar-web/                     # Existing turborepo
    ├── apps/
    │   └── app/                   # Web app (reference)
    └── packages/
```

## Core Features to Implement

### 1. Authentication
- Clerk SDK integration for iOS
- Biometric authentication (Face ID/Touch ID)
- Secure token storage in Keychain
- Sign in/up flows matching web app

### 2. Radar Management
- Create new radars with elegant animations
- List view with SwiftUI's native List
- Detail view with opinion cards
- Pull-to-refresh for manual updates
- Swipe actions (delete, refresh)

### 3. Opinion Display
- Beautiful card-based UI inspired by reference apps
- Smooth transitions and animations
- Native share sheets
- Haptic feedback for interactions

### 4. Trend Visualization
- Swift Charts for trend analysis
- Interactive touch gestures
- Real-time updates with Combine

### 5. Native iOS Features
- Widget for home screen (show latest opinions)
- Spotlight search integration
- Siri Shortcuts for quick radar checks
- Push notifications for opinion changes
- App Clips for sharing radars

## Design System Alignment

Following the patterns from your reference apps:

### From Margins iOS
- Modular package structure
- Clean separation of UI and business logic
- Comprehensive design system package
- Focus on typography and spacing

### From Kumori Apple
- Shared Design package with reusable components
- Glass morphism and blur effects
- Custom navigation patterns
- Attention to micro-interactions

### From Any Distance iOS
- Performance-focused architecture
- Smooth animations and transitions
- Native feel with platform conventions

## Implementation Timeline

| Phase | Duration | Focus Areas |
|-------|----------|-------------|
| Phase 1: Foundation | 3-4 days | Project setup, Design package, Core models |
| Phase 2: Authentication | 2-3 days | Clerk integration, Auth flows, Keychain |
| Phase 3: Core Features | 5-6 days | Radar CRUD, Opinion display, API integration |
| Phase 4: Polish | 3-4 days | Animations, Widgets, Native features |
| Phase 5: Testing | 2-3 days | Unit tests, UI tests, Performance |
| **Total** | **15-20 days** | Complete iOS app |

## Agent Task Breakdown

### Agent 1: Project Foundation & Design System
*"Establish the iOS project structure and create a world-class design system"*

### Agent 2: Authentication & Security
*"Implement Clerk authentication with biometric support and secure storage"*

### Agent 3: API Client & Networking
*"Build a robust API client that mirrors the web app's service layer"*

### Agent 4: Core UI - Radar Management
*"Create the main radar list and creation flows with native iOS patterns"*

### Agent 5: Opinion Display & Interactions
*"Build beautiful opinion cards with animations and gesture support"*

### Agent 6: Trend Visualization
*"Implement Swift Charts for opinion trends with interactive features"*

### Agent 7: Native iOS Features
*"Add widgets, shortcuts, and iOS-specific enhancements"*

### Agent 8: Testing & Performance
*"Ensure reliability with comprehensive tests and optimize performance"*

## Key Technical Decisions

### Why Native SwiftUI over React Native
1. **Performance**: Native rendering, no bridge overhead
2. **Platform Features**: Full access to latest iOS APIs
3. **Design Fidelity**: Perfect adherence to iOS design language
4. **Maintenance**: Single language, better tooling
5. **User Experience**: Smoother animations, better gestures

### API Integration Strategy
- Use URLSession with async/await
- Share API types via code generation from TypeScript
- Implement proper offline support with Core Data
- Real-time updates via WebSocket when available

### State Management
- SwiftUI's `@State` and `@StateObject` for local state
- Combine framework for reactive updates
- Repository pattern for data access
- MVVM architecture for clean separation

## Development Principles

### From Your Reference Apps
1. **Modular Architecture**: Small, focused packages
2. **Type Safety**: Leverage Swift's type system
3. **Performance First**: Profile early and often
4. **Native Conventions**: Follow iOS HIG
5. **Accessibility**: Full VoiceOver support

### Code Quality
- SwiftLint for consistent style
- Unit tests for business logic
- UI tests for critical flows
- Performance tests for animations
- Documentation for public APIs

## Next Steps

1. **Create Project Structure**
   ```bash
   mkdir radar-apple
   cd radar-apple
   # Create Xcode project
   # Set up package structure
   ```

2. **Review Reference Apps**
   - Study margins-ios UI patterns
   - Analyze kumori Design package
   - Understand navigation patterns

3. **Begin Implementation**
   - Start with Agent 1 tasks
   - Set up CI/CD with Xcode Cloud
   - Configure code signing

## Success Metrics

### MVP (Phase 1-3)
- ✅ Users can sign in with Clerk
- ✅ View and create radars
- ✅ See opinions with basic UI
- ✅ Manual refresh works

### Polish (Phase 4-5)
- ✅ Smooth animations throughout
- ✅ Widget shows latest opinions
- ✅ Haptic feedback enhances UX
- ✅ Performance meets 60fps
- ✅ App Store ready

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Swift Documentation](https://docs.swift.org)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Clerk iOS SDK](https://clerk.com/docs/quickstarts/ios)