# Agent 4: Advanced UI/UX Features
*"Implement sophisticated UI patterns including animations, suggestions, and chat interface"*

## Scope

This agent will implement advanced UI/UX features to match the web application's polished interface, including dynamic suggestions with typing animations, chat-first interface, emoji gradient tiles, sophisticated transitions, interactive gestures, and real-time streaming UI updates. Focus on creating a motion-rich, responsive interface that feels native to iOS.

## Packages to modify

- `radar-ios/Views/Home/ChatHomeView.swift` - Enhance chat interface
- `radar-ios/Views/Components/` - Create advanced UI components
- `radar-ios/Animations/` - New animation utilities
- `Packages/Design` - Extend design system with new components

## Implementation Details

### 1. Dynamic Suggestions with Typing Animation

```swift
// radar-ios/Views/Components/DynamicSuggestionsView.swift
import SwiftUI
import Combine

struct DynamicSuggestionsView: View {
    @Binding var searchText: String
    @State private var suggestions: [Suggestion] = []
    @State private var visibleSuggestions: [Suggestion] = []
    @State private var isTyping = false
    
    let onSelect: (Suggestion) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(visibleSuggestions) { suggestion in
                SuggestionRow(
                    suggestion: suggestion,
                    isTyping: isTyping,
                    onTap: {
                        animateSelection(suggestion)
                    }
                )
                .transition(
                    .asymmetric(
                        insertion: .move(edge: .trailing)
                            .combined(with: .opacity),
                        removal: .move(edge: .leading)
                            .combined(with: .opacity)
                    )
                )
                .animation(
                    .spring(response: 0.4, dampingFraction: 0.8)
                        .delay(Double(visibleSuggestions.firstIndex(of: suggestion) ?? 0) * 0.05),
                    value: visibleSuggestions
                )
            }
        }
        .onChange(of: searchText) { newValue in
            updateSuggestions(for: newValue)
        }
    }
    
    private func updateSuggestions(for text: String) {
        guard text.count >= 2 else {
            withAnimation(.spring()) {
                visibleSuggestions = []
            }
            return
        }
        
        // Filter suggestions based on text
        let filtered = suggestions
            .filter { suggestion in
                suggestion.text.localizedCaseInsensitiveContains(text) ||
                suggestion.category.rawValue.localizedCaseInsensitiveContains(text)
            }
            .prefix(4)
        
        withAnimation(.spring()) {
            visibleSuggestions = Array(filtered)
        }
    }
    
    private func animateSelection(_ suggestion: Suggestion) {
        isTyping = true
        
        // Clear search text
        searchText = ""
        
        // Animate typing effect
        let text = suggestion.text
        var currentIndex = 0
        
        Timer.scheduledTimer(withTimeInterval: 0.02, repeats: true) { timer in
            if currentIndex < text.count {
                let index = text.index(text.startIndex, offsetBy: currentIndex)
                searchText.append(text[index])
                currentIndex += 1
            } else {
                timer.invalidate()
                isTyping = false
                
                // Auto-submit after typing animation
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    onSelect(suggestion)
                }
            }
        }
    }
}

struct SuggestionRow: View {
    let suggestion: Suggestion
    let isTyping: Bool
    let onTap: () -> Void
    
    @State private var isHovered = false
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Text(suggestion.emoji)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(suggestion.text)
                        .font(.subheadline)
                        .foregroundColor(.primary)
                    
                    Text(suggestion.category.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "arrow.right.circle")
                    .foregroundColor(.secondary)
                    .opacity(isHovered ? 1 : 0.5)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.radarSurface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.radarBorder, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isHovered ? 1.02 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isHovered)
        .onHover { hovering in
            isHovered = hovering
        }
        .disabled(isTyping)
    }
}
```

### 2. Emoji Gradient Suggestion Tiles

```swift
// radar-ios/Views/Components/SuggestionTilesView.swift
import SwiftUI

struct SuggestionTilesView: View {
    @State private var tiles: [[SuggestionTile]] = [[], []]
    @State private var scrollOffset1: CGFloat = 0
    @State private var scrollOffset2: CGFloat = 0
    
    let onSelect: (SuggestionTile) -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // First row
            SuggestionMarqueeRow(
                tiles: tiles[0],
                scrollOffset: $scrollOffset1,
                duration: 30,
                onSelect: onSelect
            )
            
            // Second row with offset
            SuggestionMarqueeRow(
                tiles: tiles[1],
                scrollOffset: $scrollOffset2,
                duration: 35,
                initialOffset: 100,
                onSelect: onSelect
            )
        }
        .onAppear {
            loadSuggestions()
            startScrolling()
        }
    }
    
    private func loadSuggestions() {
        tiles[0] = [
            SuggestionTile(
                emoji: "🤖",
                title: "AI breakthroughs",
                gradient: [Color(hex: "667EEA"), Color(hex: "764BA2")]
            ),
            SuggestionTile(
                emoji: "🎬",
                title: "Movie reviews",
                gradient: [Color(hex: "F093FB"), Color(hex: "F5576C")]
            ),
            SuggestionTile(
                emoji: "🍔",
                title: "Food trends",
                gradient: [Color(hex: "4FACFE"), Color(hex: "00F2FE")]
            ),
            SuggestionTile(
                emoji: "💼",
                title: "Career advice",
                gradient: [Color(hex: "FA709A"), Color(hex: "FEE140")]
            )
        ]
        
        tiles[1] = [
            SuggestionTile(
                emoji: "🏃",
                title: "Fitness tips",
                gradient: [Color(hex: "30CDF4"), Color(hex: "667EEA")]
            ),
            SuggestionTile(
                emoji: "📰",
                title: "Breaking news",
                gradient: [Color(hex: "FF6B6B"), Color(hex: "FFB366")]
            ),
            SuggestionTile(
                emoji: "🌱",
                title: "Sustainability",
                gradient: [Color(hex: "A8E6CF"), Color(hex: "DCEDC1")]
            ),
            SuggestionTile(
                emoji: "🎨",
                title: "Design trends",
                gradient: [Color(hex: "FFD3B6"), Color(hex: "FFAAA5")]
            )
        ]
    }
    
    private func startScrolling() {
        withAnimation(.linear(duration: 30).repeatForever(autoreverses: false)) {
            scrollOffset1 = -1000
        }
        
        withAnimation(.linear(duration: 35).repeatForever(autoreverses: false)) {
            scrollOffset2 = -1000
        }
    }
}

struct SuggestionMarqueeRow: View {
    let tiles: [SuggestionTile]
    @Binding var scrollOffset: CGFloat
    let duration: Double
    var initialOffset: CGFloat = 0
    let onSelect: (SuggestionTile) -> Void
    
    @State private var isPaused = false
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                ForEach(tiles) { tile in
                    SuggestionTileView(
                        tile: tile,
                        onTap: { onSelect(tile) }
                    )
                }
                
                // Duplicate for seamless loop
                ForEach(tiles) { tile in
                    SuggestionTileView(
                        tile: tile,
                        onTap: { onSelect(tile) }
                    )
                }
            }
            .offset(x: scrollOffset + initialOffset)
        }
        .onHover { hovering in
            isPaused = hovering
            if hovering {
                withAnimation(.easeOut(duration: 0.3)) {
                    // Pause animation
                }
            } else {
                // Resume animation
                startScrolling()
            }
        }
    }
}

struct SuggestionTileView: View {
    let tile: SuggestionTile
    let onTap: () -> Void
    
    @State private var isPressed = false
    @State private var isHovered = false
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                Text(tile.emoji)
                    .font(.system(size: 48))
                    .scaleEffect(isPressed ? 0.9 : 1.0)
                
                Text(tile.title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 120, height: 120)
            .background(
                LinearGradient(
                    colors: tile.gradient,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .overlay(
                    LinearGradient(
                        colors: [Color.white.opacity(0.2), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .opacity(isHovered ? 1 : 0)
                )
            )
            .cornerRadius(20)
            .shadow(
                color: tile.gradient.first?.opacity(0.3) ?? .clear,
                radius: isHovered ? 12 : 8,
                y: isHovered ? 6 : 4
            )
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isHovered ? 1.05 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isHovered)
        .onHover { hovering in
            isHovered = hovering
        }
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}
```

### 3. Chat-First Interface

```swift
// radar-ios/Views/Home/EnhancedChatHomeView.swift
import SwiftUI

struct EnhancedChatHomeView: View {
    @StateObject private var viewModel = ChatHomeViewModel()
    @State private var inputText = ""
    @State private var isCreating = false
    @State private var messages: [ChatMessage] = []
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.radarBackground, Color.radarBackground.opacity(0.95)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                ChatHeaderView()
                
                // Messages/Content Area
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 16) {
                            if messages.isEmpty {
                                // Empty state with suggestions
                                EmptyStateView(
                                    suggestions: viewModel.suggestions,
                                    onSelectSuggestion: { suggestion in
                                        animateTyping(suggestion.text)
                                    }
                                )
                                .transition(.opacity.combined(with: .scale))
                            } else {
                                // Chat messages
                                ForEach(messages) { message in
                                    ChatMessageView(message: message)
                                        .transition(
                                            .asymmetric(
                                                insertion: .push(from: .bottom),
                                                removal: .push(from: .top)
                                            )
                                        )
                                }
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _ in
                        withAnimation {
                            proxy.scrollTo(messages.last?.id, anchor: .bottom)
                        }
                    }
                }
                
                // Input Bar
                ChatInputBar(
                    text: $inputText,
                    isCreating: $isCreating,
                    onSubmit: handleSubmit
                )
                .focused($isInputFocused)
            }
        }
    }
    
    private func animateTyping(_ text: String) {
        inputText = ""
        isInputFocused = true
        
        for (index, character) in text.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * 0.02) {
                inputText.append(character)
                
                if index == text.count - 1 {
                    // Submit after typing
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        handleSubmit()
                    }
                }
            }
        }
    }
    
    private func handleSubmit() {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        // Add user message
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            content: inputText,
            type: .user,
            timestamp: Date()
        )
        
        withAnimation(.spring()) {
            messages.append(userMessage)
        }
        
        // Clear input
        let query = inputText
        inputText = ""
        
        // Start creating radar
        isCreating = true
        
        Task {
            await viewModel.createRadar(from: query)
            isCreating = false
        }
    }
}

struct ChatInputBar: View {
    @Binding var text: String
    @Binding var isCreating: Bool
    let onSubmit: () -> Void
    
    @State private var height: CGFloat = 44
    
    var body: some View {
        HStack(alignment: .bottom, spacing: 12) {
            // Expanding text field
            ExpandingTextEditor(
                text: $text,
                height: $height,
                placeholder: "What do you want to track?"
            )
            
            // Submit button
            Button(action: onSubmit) {
                ZStack {
                    Circle()
                        .fill(submitButtonColor)
                        .frame(width: 36, height: 36)
                    
                    if isCreating {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.7)
                    } else {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            .disabled(text.isEmpty || isCreating)
            .animation(.spring(), value: isCreating)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.radarSurface)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(Color.radarBorder, lineWidth: 1)
                )
        )
        .padding()
        .shadow(color: Color.black.opacity(0.1), radius: 10, y: -5)
    }
    
    private var submitButtonColor: Color {
        if text.isEmpty || isCreating {
            return Color.gray.opacity(0.3)
        } else {
            return Color.radarAccent
        }
    }
}
```

### 4. Streaming Response UI

```swift
// radar-ios/Views/Components/StreamingTextView.swift
import SwiftUI

struct StreamingTextView: View {
    @State private var displayedText = ""
    @State private var fullText: String
    @State private var currentIndex = 0
    @State private var cursorVisible = true
    
    let streamSpeed: Double
    
    init(text: String, streamSpeed: Double = 0.01) {
        self._fullText = State(initialValue: text)
        self.streamSpeed = streamSpeed
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 2) {
            Text(displayedText)
                .font(.body)
                .foregroundColor(.primary)
                .animation(nil, value: displayedText)
            
            if currentIndex < fullText.count {
                Rectangle()
                    .fill(Color.radarAccent)
                    .frame(width: 2, height: 18)
                    .opacity(cursorVisible ? 1 : 0)
                    .animation(.easeInOut(duration: 0.5).repeatForever(), value: cursorVisible)
            }
        }
        .onAppear {
            startStreaming()
            animateCursor()
        }
        .onChange(of: fullText) { newValue in
            if newValue != displayedText {
                // Continue streaming from current position
                startStreaming()
            }
        }
    }
    
    private func startStreaming() {
        Timer.scheduledTimer(withTimeInterval: streamSpeed, repeats: true) { timer in
            if currentIndex < fullText.count {
                let index = fullText.index(fullText.startIndex, offsetBy: currentIndex)
                displayedText.append(fullText[index])
                currentIndex += 1
            } else {
                timer.invalidate()
            }
        }
    }
    
    private func animateCursor() {
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            cursorVisible.toggle()
        }
    }
}

// Usage in streaming opinions
struct StreamingOpinionView: View {
    @StateObject private var streamer = OpinionStreamer()
    @State private var opinion = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.radarAccent)
                Text("AI Opinion")
                    .font(.headline)
            }
            
            StreamingTextView(text: opinion)
                .onAppear {
                    Task {
                        for await chunk in streamer.streamOpinion() {
                            opinion += chunk
                        }
                    }
                }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.radarSurface)
        )
    }
}
```

### 5. Advanced Transitions & Animations

```swift
// radar-ios/Animations/AdvancedTransitions.swift
import SwiftUI

struct GlassyTransition: ViewModifier {
    let isPresented: Bool
    let edge: Edge
    
    func body(content: Content) -> some View {
        content
            .blur(radius: isPresented ? 0 : 20)
            .opacity(isPresented ? 1 : 0)
            .scaleEffect(isPresented ? 1 : 0.95)
            .offset(offset)
            .animation(.spring(response: 0.5, dampingFraction: 0.8), value: isPresented)
    }
    
    private var offset: CGSize {
        guard !isPresented else { return .zero }
        
        switch edge {
        case .leading:
            return CGSize(width: -80, height: 0)
        case .trailing:
            return CGSize(width: 80, height: 0)
        case .top:
            return CGSize(width: 0, height: -80)
        case .bottom:
            return CGSize(width: 0, height: 80)
        }
    }
}

// Spring-based card animation
struct SpringCardModifier: ViewModifier {
    @State private var dragAmount = CGSize.zero
    @State private var isDragging = false
    
    func body(content: Content) -> some View {
        content
            .offset(dragAmount)
            .scaleEffect(isDragging ? 0.95 : 1.0)
            .animation(.interactiveSpring(response: 0.4, dampingFraction: 0.6), value: dragAmount)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        isDragging = true
                        dragAmount = value.translation
                    }
                    .onEnded { value in
                        isDragging = false
                        
                        // Spring back or dismiss
                        if abs(value.translation.width) > 100 {
                            // Dismiss
                            withAnimation(.spring()) {
                                dragAmount = CGSize(
                                    width: value.translation.width > 0 ? 500 : -500,
                                    height: 0
                                )
                            }
                        } else {
                            // Spring back
                            withAnimation(.spring()) {
                                dragAmount = .zero
                            }
                        }
                    }
            )
    }
}

// Morphing shape animation
struct MorphingButton: View {
    @State private var isExpanded = false
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            withAnimation(.spring()) {
                isExpanded.toggle()
            }
            action()
        }) {
            ZStack {
                // Background shape
                RoundedRectangle(cornerRadius: isExpanded ? 28 : 56)
                    .fill(Color.radarAccent)
                    .frame(
                        width: isExpanded ? 200 : 56,
                        height: 56
                    )
                
                // Content
                if isExpanded {
                    HStack {
                        Image(systemName: "plus")
                        Text("Create Radar")
                    }
                    .foregroundColor(.white)
                    .transition(.opacity.combined(with: .scale))
                } else {
                    Image(systemName: "plus")
                        .foregroundColor(.white)
                        .font(.title2)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

### 6. Interactive Gestures

```swift
// radar-ios/Views/Components/InteractiveRadarCard.swift
import SwiftUI

struct InteractiveRadarCard: View {
    let radar: Radar
    @State private var offset = CGSize.zero
    @State private var scale: CGFloat = 1.0
    @State private var rotation: Double = 0
    @GestureState private var dragState = DragState.inactive
    
    enum DragState {
        case inactive
        case dragging(translation: CGSize)
        
        var translation: CGSize {
            switch self {
            case .inactive:
                return .zero
            case .dragging(let translation):
                return translation
            }
        }
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Card content
                RadarCardContent(radar: radar)
                    .frame(width: geometry.size.width - 40, height: 200)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.radarSurface)
                            .shadow(
                                color: shadowColor,
                                radius: 20,
                                x: 0,
                                y: 10
                            )
                    )
                    .offset(
                        x: offset.width + dragState.translation.width,
                        y: offset.height + dragState.translation.height
                    )
                    .scaleEffect(scale)
                    .rotationEffect(.degrees(rotation))
                    .gesture(
                        DragGesture()
                            .updating($dragState) { value, state, _ in
                                state = .dragging(translation: value.translation)
                            }
                            .onChanged { value in
                                withAnimation(.interactiveSpring()) {
                                    scale = 0.95
                                    rotation = Double(value.translation.width / 20)
                                }
                            }
                            .onEnded { value in
                                withAnimation(.spring()) {
                                    scale = 1.0
                                    rotation = 0
                                    
                                    // Snap to action or return
                                    if abs(value.translation.width) > 150 {
                                        handleSwipe(direction: value.translation.width > 0 ? .right : .left)
                                    } else {
                                        offset = .zero
                                    }
                                }
                            }
                    )
                
                // Action hints
                if dragState.translation.width > 50 {
                    ActionHint(icon: "arrow.clockwise", color: .green)
                        .offset(x: -geometry.size.width / 2 + 60)
                        .transition(.scale.combined(with: .opacity))
                } else if dragState.translation.width < -50 {
                    ActionHint(icon: "trash", color: .red)
                        .offset(x: geometry.size.width / 2 - 60)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
    
    private var shadowColor: Color {
        if dragState.translation.width > 50 {
            return Color.green.opacity(0.3)
        } else if dragState.translation.width < -50 {
            return Color.red.opacity(0.3)
        } else {
            return Color.black.opacity(0.1)
        }
    }
    
    private func handleSwipe(direction: SwipeDirection) {
        switch direction {
        case .left:
            // Delete action
            HapticManager.shared.impact(.medium)
        case .right:
            // Refresh action
            HapticManager.shared.impact(.light)
        }
    }
}
```

## Dependencies

- Agent 2 (API Integration) - For fetching suggestions and streaming

## Testing Strategy

1. **Animation Tests**
   - Test animation performance
   - Test gesture responsiveness
   - Test transition smoothness

2. **UI Tests**
   - Test typing animation
   - Test suggestion selection
   - Test chat interface
   - Test streaming text

3. **Performance Tests**
   - Ensure 60 fps animations
   - Test memory usage with many animations
   - Test scroll performance

## Security Considerations

- No significant security concerns for UI components

## Effort Estimate

12-15 developer days

## Success Metrics

- [ ] All animations run at 60 fps
- [ ] Typing animation smooth and natural
- [ ] Suggestion tiles interactive and responsive
- [ ] Chat interface fully functional
- [ ] Streaming text displays correctly
- [ ] Gestures feel native and responsive
- [ ] Transitions match web quality
- [ ] No UI glitches or artifacts
- [ ] Accessibility support maintained
- [ ] Dark mode support complete