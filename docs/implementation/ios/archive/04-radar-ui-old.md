# Agent 4: Core UI - Radar Management
*"Create the main radar list and creation flows with native iOS patterns"*

## Scope

This agent implements the core UI for radar management, including the main list view, creation flow, detail views, and native iOS interactions like swipe actions and pull-to-refresh. The implementation follows iOS design patterns while maintaining visual consistency with the web app.

## Packages to modify

- `radar-apple/Radar/Views` - Main UI views
- `radar-apple/Radar/ViewModels` - View models for state management
- `radar-apple/Packages/Design` - Additional UI components

## Implementation Details

### 1. Main Radar List View

```swift
// Radar/Views/Radars/RadarListView.swift
import SwiftUI
import Design
import RadarCore
import RadarAPI

struct RadarListView: View {
    @StateObject private var viewModel = RadarListViewModel()
    @State private var showCreateFlow = false
    @State private var searchText = ""
    @State private var selectedRadar: Radar?
    
    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.radars.isEmpty && !viewModel.isLoading {
                    EmptyStateView()
                } else {
                    radarList
                }
                
                // Floating action button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        CreateRadarButton {
                            showCreateFlow = true
                        }
                        .padding()
                    }
                }
            }
            .background(Color.radarBackground)
            .navigationTitle("Radars")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $searchText, prompt: "Search radars...")
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showCreateFlow) {
                CreateRadarFlow()
            }
            .navigationDestination(for: Radar.self) { radar in
                RadarDetailView(radar: radar)
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") { viewModel.error = nil }
            } message: {
                Text(viewModel.error?.localizedDescription ?? "An error occurred")
            }
        }
        .task {
            await viewModel.loadRadars()
        }
    }
    
    private var radarList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(filteredRadars) { radar in
                    NavigationLink(value: radar) {
                        RadarListItem(radar: radar)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .contextMenu {
                        radarContextMenu(for: radar)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        swipeActions(for: radar)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 80) // Space for FAB
        }
    }
    
    private var filteredRadars: [Radar] {
        if searchText.isEmpty {
            return viewModel.radars
        } else {
            return viewModel.radars.filter {
                $0.topic.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    @ViewBuilder
    private func radarContextMenu(for radar: Radar) -> some View {
        Button {
            Task {
                await viewModel.refreshRadar(radar)
            }
        } label: {
            Label("Refresh Opinions", systemImage: "arrow.clockwise")
        }
        
        Button {
            // Share radar
        } label: {
            Label("Share", systemImage: "square.and.arrow.up")
        }
        
        Divider()
        
        Button(role: .destructive) {
            Task {
                await viewModel.deleteRadar(radar)
            }
        } label: {
            Label("Delete", systemImage: "trash")
        }
    }
    
    @ViewBuilder
    private func swipeActions(for radar: Radar) -> some View {
        Button(role: .destructive) {
            Task {
                await viewModel.deleteRadar(radar)
            }
        } label: {
            Label("Delete", systemImage: "trash")
        }
        
        Button {
            Task {
                await viewModel.refreshRadar(radar)
            }
        } label: {
            Label("Refresh", systemImage: "arrow.clockwise")
        }
        .tint(.blue)
    }
}

// MARK: - List Item

struct RadarListItem: View {
    let radar: Radar
    
    var body: some View {
        RadarCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(radar.topic)
                            .font(RadarTypography.headline)
                            .foregroundColor(.radarPrimary)
                            .lineLimit(2)
                        
                        HStack(spacing: 4) {
                            Circle()
                                .fill(statusColor)
                                .frame(width: 6, height: 6)
                            
                            Text(statusText)
                                .font(RadarTypography.caption1)
                                .foregroundColor(.radarMuted)
                        }
                    }
                    
                    Spacer()
                    
                    // Position indicator
                    PositionBadge(position: radar.position)
                }
                
                // Stats
                HStack(spacing: 16) {
                    StatView(
                        icon: "bubble.left.and.bubble.right",
                        value: "\(radar.opinions.count)",
                        label: "opinions"
                    )
                    
                    StatView(
                        icon: "arrow.clockwise",
                        value: "\(radar.refreshCount)",
                        label: "refreshes"
                    )
                    
                    Spacer()
                }
                
                // Latest opinion preview
                if let latestOpinion = radar.opinions.first {
                    OpinionPreview(opinion: latestOpinion)
                }
            }
        }
    }
    
    private var statusColor: Color {
        let hoursSinceLastPoll = Date().timeIntervalSince(radar.lastPolledAt) / 3600
        return hoursSinceLastPoll < 24 ? .green : .radarMuted
    }
    
    private var statusText: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return "Updated \(formatter.localizedString(for: radar.lastPolledAt, relativeTo: Date()))"
    }
}

// MARK: - Supporting Views

struct StatView: View {
    let icon: String
    let value: String
    let label: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(.radarMuted)
            
            Text(value)
                .font(RadarTypography.footnote.bold())
                .foregroundColor(.radarPrimary)
            
            Text(label)
                .font(RadarTypography.caption2)
                .foregroundColor(.radarMuted)
        }
    }
}

struct PositionBadge: View {
    let position: Radar.Position
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(badgeColor)
                .frame(width: 8, height: 8)
            
            Text(position.displayName)
                .font(RadarTypography.caption1.bold())
                .foregroundColor(badgeColor)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(badgeColor.opacity(0.1))
        .cornerRadius(12)
    }
    
    private var badgeColor: Color {
        switch position {
        case .for: return .green
        case .against: return .red
        case .neutral: return .gray
        }
    }
}

struct OpinionPreview: View {
    let opinion: Opinion
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\"\(opinion.content)\"")
                .font(RadarTypography.caption1.italic())
                .foregroundColor(.radarSecondary)
                .lineLimit(2)
            
            Text("— \(opinion.author)")
                .font(RadarTypography.caption2)
                .foregroundColor(.radarMuted)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.radarMuted.opacity(0.05))
        .cornerRadius(8)
    }
}

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "antenna.radiowaves.left.and.right")
                .font(.system(size: 60))
                .foregroundColor(.radarMuted)
            
            VStack(spacing: 8) {
                Text("No radars yet")
                    .font(RadarTypography.title2)
                    .foregroundColor(.radarPrimary)
                
                Text("Create your first radar to start tracking AI opinions")
                    .font(RadarTypography.body)
                    .foregroundColor(.radarMuted)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(40)
    }
}

struct CreateRadarButton: View {
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            HapticManager.impact(.medium)
            action()
        }) {
            Image(systemName: "plus")
                .font(.system(size: 24, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(Color.radarPrimary)
                .clipShape(Circle())
                .shadow(radius: 8, x: 0, y: 4)
        }
        .scaleEffect(1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: true)
    }
}
```

### 2. Radar Creation Flow

```swift
// Radar/Views/Radars/CreateRadarFlow.swift
import SwiftUI
import Design
import RadarCore

struct CreateRadarFlow: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = CreateRadarViewModel()
    @FocusState private var isTopicFocused: Bool
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.radarBackground.ignoresSafeArea()
                
                VStack(spacing: 24) {
                    // Progress indicator
                    ProgressView(value: viewModel.progress)
                        .tint(.radarPrimary)
                        .padding(.horizontal)
                    
                    ScrollView {
                        VStack(spacing: 32) {
                            // Step indicator
                            StepIndicator(currentStep: viewModel.currentStep)
                            
                            // Content based on step
                            Group {
                                switch viewModel.currentStep {
                                case .topic:
                                    TopicInputStep(
                                        topic: $viewModel.topic,
                                        isLoading: viewModel.isLoading,
                                        isFocused: $isTopicFocused
                                    )
                                    
                                case .interpretation:
                                    InterpretationStep(
                                        interpretation: viewModel.interpretation,
                                        isLoading: viewModel.isLoading
                                    )
                                    
                                case .confirmation:
                                    ConfirmationStep(
                                        topic: viewModel.topic,
                                        interpretation: viewModel.interpretation
                                    )
                                }
                            }
                            .transition(.asymmetric(
                                insertion: .move(edge: .trailing).combined(with: .opacity),
                                removal: .move(edge: .leading).combined(with: .opacity)
                            ))
                            .animation(.spring(response: 0.5, dampingFraction: 0.8), value: viewModel.currentStep)
                        }
                        .padding()
                    }
                    
                    // Action buttons
                    HStack(spacing: 16) {
                        if viewModel.currentStep != .topic {
                            RadarButton("Back", style: .secondary) {
                                withAnimation {
                                    viewModel.previousStep()
                                }
                            }
                        }
                        
                        RadarButton(
                            viewModel.currentStep == .confirmation ? "Create Radar" : "Continue",
                            style: .primary
                        ) {
                            Task {
                                await handleNextAction()
                            }
                        }
                        .disabled(!viewModel.canProceed)
                    }
                    .padding()
                }
            }
            .navigationTitle("Create Radar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") { viewModel.error = nil }
            } message: {
                Text(viewModel.error?.localizedDescription ?? "An error occurred")
            }
            .onAppear {
                isTopicFocused = true
            }
        }
    }
    
    private func handleNextAction() async {
        if viewModel.currentStep == .confirmation {
            await viewModel.createRadar()
            if viewModel.createdRadar != nil {
                dismiss()
            }
        } else {
            await viewModel.nextStep()
        }
    }
}

// MARK: - Step Views

struct StepIndicator: View {
    let currentStep: CreateRadarViewModel.Step
    
    var body: some View {
        HStack(spacing: 8) {
            ForEach(CreateRadarViewModel.Step.allCases, id: \.self) { step in
                StepDot(
                    isActive: step.rawValue <= currentStep.rawValue,
                    isCurrent: step == currentStep
                )
                
                if step != CreateRadarViewModel.Step.allCases.last {
                    StepConnector(isActive: step.rawValue < currentStep.rawValue)
                }
            }
        }
        .padding(.horizontal, 40)
    }
}

struct StepDot: View {
    let isActive: Bool
    let isCurrent: Bool
    
    var body: some View {
        Circle()
            .fill(isActive ? Color.radarPrimary : Color.radarMuted.opacity(0.3))
            .frame(width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8)
            .overlay(
                Circle()
                    .stroke(Color.radarPrimary, lineWidth: 2)
                    .opacity(isCurrent ? 1 : 0)
                    .frame(width: 20, height: 20)
            )
            .animation(.spring(response: 0.3), value: isCurrent)
    }
}

struct StepConnector: View {
    let isActive: Bool
    
    var body: some View {
        Rectangle()
            .fill(isActive ? Color.radarPrimary : Color.radarMuted.opacity(0.3))
            .frame(height: 2)
            .frame(maxWidth: .infinity)
    }
}

struct TopicInputStep: View {
    @Binding var topic: String
    let isLoading: Bool
    var isFocused: FocusState<Bool>.Binding
    
    @State private var suggestions = [
        "Best programming languages for beginners",
        "Climate change solutions",
        "Future of remote work",
        "AI in healthcare",
        "Space exploration priorities"
    ]
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Image(systemName: "sparkles")
                    .font(.system(size: 48))
                    .foregroundColor(.radarPrimary)
                
                Text("What would you like AI opinions on?")
                    .font(RadarTypography.title2)
                    .multilineTextAlignment(.center)
                
                Text("Enter any topic, question, or statement")
                    .font(RadarTypography.body)
                    .foregroundColor(.radarMuted)
            }
            
            RadarTextField(
                text: $topic,
                placeholder: "e.g., Best coffee shops in SF",
                icon: "magnifyingglass"
            )
            .focused(isFocused)
            .disabled(isLoading)
            
            if topic.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Suggestions")
                        .font(RadarTypography.footnote)
                        .foregroundColor(.radarMuted)
                    
                    ForEach(suggestions, id: \.self) { suggestion in
                        Button {
                            topic = suggestion
                            HapticManager.selection()
                        } label: {
                            HStack {
                                Image(systemName: "lightbulb")
                                    .font(.system(size: 14))
                                    .foregroundColor(.radarMuted)
                                
                                Text(suggestion)
                                    .font(RadarTypography.body)
                                    .foregroundColor(.radarPrimary)
                                    .multilineTextAlignment(.leading)
                                
                                Spacer()
                                
                                Image(systemName: "arrow.right.circle")
                                    .font(.system(size: 16))
                                    .foregroundColor(.radarMuted)
                            }
                            .padding(12)
                            .background(Color.radarMuted.opacity(0.05))
                            .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.top)
            }
        }
    }
}

struct InterpretationStep: View {
    let interpretation: Interpretation?
    let isLoading: Bool
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Image(systemName: "brain")
                    .font(.system(size: 48))
                    .foregroundColor(.radarPrimary)
                
                Text("AI is analyzing your topic...")
                    .font(RadarTypography.title2)
                    .multilineTextAlignment(.center)
            }
            
            if isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .padding(40)
            } else if let interpretation = interpretation {
                VStack(alignment: .leading, spacing: 16) {
                    InterpretationCard(interpretation: interpretation)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Category", systemImage: "folder")
                            .font(RadarTypography.footnote)
                            .foregroundColor(.radarMuted)
                        
                        Text(interpretation.category)
                            .font(RadarTypography.body)
                            .foregroundColor(.radarPrimary)
                    }
                    
                    if !interpretation.tags.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("Tags", systemImage: "tag")
                                .font(RadarTypography.footnote)
                                .foregroundColor(.radarMuted)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(interpretation.tags, id: \.self) { tag in
                                    TagView(text: tag)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

struct ConfirmationStep: View {
    let topic: String
    let interpretation: Interpretation?
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.green)
                
                Text("Ready to create your radar!")
                    .font(RadarTypography.title2)
                    .multilineTextAlignment(.center)
            }
            
            VStack(alignment: .leading, spacing: 16) {
                SummaryRow(label: "Topic", value: topic)
                
                if let interpretation = interpretation {
                    SummaryRow(label: "Category", value: interpretation.category)
                    SummaryRow(label: "Sentiment", value: interpretation.sentiment.rawValue.capitalized)
                }
                
                Divider()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("What happens next?")
                        .font(RadarTypography.headline)
                    
                    BulletPoint("AI models will analyze your topic")
                    BulletPoint("Multiple perspectives will be collected")
                    BulletPoint("Opinions will update periodically")
                    BulletPoint("Track sentiment changes over time")
                }
            }
            .padding()
            .background(Color.radarMuted.opacity(0.05))
            .cornerRadius(12)
        }
    }
}

// MARK: - Supporting Components

struct InterpretationCard: View {
    let interpretation: Interpretation
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("AI Understanding")
                .font(RadarTypography.footnote)
                .foregroundColor(.radarMuted)
            
            Text(interpretation.text)
                .font(RadarTypography.body)
                .foregroundColor(.radarPrimary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    Color.radarPrimary.opacity(0.05),
                    Color.radarPrimary.opacity(0.02)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.radarPrimary.opacity(0.1), lineWidth: 1)
        )
    }
}

struct TagView: View {
    let text: String
    
    var body: some View {
        Text(text)
            .font(RadarTypography.caption1)
            .foregroundColor(.radarPrimary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.radarMuted.opacity(0.1))
            .cornerRadius(16)
    }
}

struct SummaryRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(RadarTypography.footnote)
                .foregroundColor(.radarMuted)
            
            Spacer()
            
            Text(value)
                .font(RadarTypography.body)
                .foregroundColor(.radarPrimary)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct BulletPoint: View {
    let text: String
    
    init(_ text: String) {
        self.text = text
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(Color.radarMuted)
                .frame(width: 4, height: 4)
                .offset(y: 8)
            
            Text(text)
                .font(RadarTypography.footnote)
                .foregroundColor(.radarSecondary)
        }
    }
}

// Custom flow layout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        return rows.reduce(CGSize.zero) { size, row in
            CGSize(
                width: max(size.width, row.width),
                height: size.height + row.height + (size.height > 0 ? spacing : 0)
            )
        }
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        var y = bounds.minY
        
        for row in rows {
            var x = bounds.minX
            
            for element in row.elements {
                let size = element.sizeThatFits(ProposedViewSize(width: nil, height: row.height))
                element.place(
                    at: CGPoint(x: x, y: y),
                    proposal: ProposedViewSize(size)
                )
                x += size.width + spacing
            }
            
            y += row.height + spacing
        }
    }
    
    private func computeRows(proposal: ProposedViewSize, subviews: Subviews) -> [Row] {
        var rows: [Row] = []
        var currentRow = Row()
        var x: CGFloat = 0
        
        for subview in subviews {
            let size = subview.sizeThatFits(ProposedViewSize(width: nil, height: nil))
            
            if x + size.width > (proposal.width ?? .infinity) && !currentRow.elements.isEmpty {
                rows.append(currentRow)
                currentRow = Row()
                x = 0
            }
            
            currentRow.elements.append(subview)
            currentRow.width = x + size.width
            currentRow.height = max(currentRow.height, size.height)
            x += size.width + spacing
        }
        
        if !currentRow.elements.isEmpty {
            rows.append(currentRow)
        }
        
        return rows
    }
    
    private struct Row {
        var elements: [LayoutSubview] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }
}
```

### 3. View Models

```swift
// Radar/ViewModels/RadarListViewModel.swift
import Foundation
import Combine
import RadarCore
import RadarAPI

@MainActor
class RadarListViewModel: ObservableObject {
    @Published var radars: [Radar] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var showError = false
    
    private let radarService = RadarService()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Observe service changes
        radarService.$radars
            .assign(to: &$radars)
        
        radarService.$error
            .compactMap { $0 }
            .sink { [weak self] error in
                self?.error = error
                self?.showError = true
            }
            .store(in: &cancellables)
    }
    
    func loadRadars() async {
        await radarService.loadRadars()
    }
    
    func refresh() async {
        await radarService.loadRadars(refresh: true)
    }
    
    func deleteRadar(_ radar: Radar) async {
        do {
            try await radarService.deleteRadar(radar)
            HapticManager.notification(.success)
        } catch {
            self.error = error
            self.showError = true
            HapticManager.notification(.error)
        }
    }
    
    func refreshRadar(_ radar: Radar) async {
        do {
            _ = try await radarService.refreshRadar(radar)
            HapticManager.notification(.success)
        } catch {
            self.error = error
            self.showError = true
            HapticManager.notification(.error)
        }
    }
}

// Radar/ViewModels/CreateRadarViewModel.swift
@MainActor
class CreateRadarViewModel: ObservableObject {
    enum Step: Int, CaseIterable {
        case topic
        case interpretation
        case confirmation
    }
    
    @Published var currentStep = Step.topic
    @Published var topic = ""
    @Published var interpretation: Interpretation?
    @Published var isLoading = false
    @Published var error: Error?
    @Published var showError = false
    @Published var createdRadar: Radar?
    
    private let apiClient = APIClient.shared
    private let radarService = RadarService()
    
    var progress: Double {
        Double(currentStep.rawValue + 1) / Double(Step.allCases.count)
    }
    
    var canProceed: Bool {
        switch currentStep {
        case .topic:
            return !topic.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isLoading
        case .interpretation:
            return interpretation != nil && !isLoading
        case .confirmation:
            return !isLoading
        }
    }
    
    func nextStep() async {
        switch currentStep {
        case .topic:
            await interpretTopic()
        case .interpretation:
            withAnimation {
                currentStep = .confirmation
            }
        case .confirmation:
            break
        }
    }
    
    func previousStep() {
        guard let previousStep = Step(rawValue: currentStep.rawValue - 1) else { return }
        currentStep = previousStep
    }
    
    private func interpretTopic() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let interpretation = try await apiClient.interpretTopic(topic)
            self.interpretation = interpretation
            
            withAnimation {
                currentStep = .interpretation
            }
            
            HapticManager.notification(.success)
        } catch {
            self.error = error
            self.showError = true
            HapticManager.notification(.error)
        }
    }
    
    func createRadar() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let radar = try await radarService.createRadar(topic: topic)
            self.createdRadar = radar
            
            HapticManager.notification(.success)
        } catch {
            self.error = error
            self.showError = true
            HapticManager.notification(.error)
        }
    }
}
```

### 4. Additional Design Components

```swift
// Packages/Design/Sources/Design/Components/TextField.swift
import SwiftUI

public struct RadarTextField: View {
    @Binding var text: String
    let placeholder: String
    var icon: String? = nil
    var keyboardType: UIKeyboardType = .default
    var textContentType: UITextContentType? = nil
    
    public init(
        text: Binding<String>,
        placeholder: String,
        icon: String? = nil,
        keyboardType: UIKeyboardType = .default,
        textContentType: UITextContentType? = nil
    ) {
        self._text = text
        self.placeholder = placeholder
        self.icon = icon
        self.keyboardType = keyboardType
        self.textContentType = textContentType
    }
    
    public var body: some View {
        HStack(spacing: 12) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(.radarMuted)
            }
            
            TextField(placeholder, text: $text)
                .font(RadarTypography.body)
                .foregroundColor(.radarPrimary)
                .keyboardType(keyboardType)
                .textContentType(textContentType)
                .autocapitalization(.none)
                .disableAutocorrection(true)
        }
        .padding(16)
        .background(Color.radarMuted.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.radarMuted.opacity(0.2), lineWidth: 1)
        )
    }
}

public struct RadarSecureField: View {
    @Binding var text: String
    let placeholder: String
    @State private var isSecure = true
    
    public init(text: Binding<String>, placeholder: String) {
        self._text = text
        self.placeholder = placeholder
    }
    
    public var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "lock")
                .font(.system(size: 18))
                .foregroundColor(.radarMuted)
            
            if isSecure {
                SecureField(placeholder, text: $text)
                    .font(RadarTypography.body)
                    .foregroundColor(.radarPrimary)
            } else {
                TextField(placeholder, text: $text)
                    .font(RadarTypography.body)
                    .foregroundColor(.radarPrimary)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
            }
            
            Button {
                isSecure.toggle()
            } label: {
                Image(systemName: isSecure ? "eye.slash" : "eye")
                    .font(.system(size: 18))
                    .foregroundColor(.radarMuted)
            }
        }
        .padding(16)
        .background(Color.radarMuted.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.radarMuted.opacity(0.2), lineWidth: 1)
        )
    }
}
```

## Dependencies

- Agent 1: Design system components
- Agent 2: Authentication for API access
- Agent 3: API client for data operations
- SwiftUI and Combine frameworks

## Testing Strategy

### UI Tests
```swift
// RadarUITests/RadarListTests.swift
import XCTest

final class RadarListTests: XCTestCase {
    func testCreateRadarFlow() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Test create button
        app.buttons["Create Radar"].tap()
        
        // Test topic input
        let topicField = app.textFields["Topic"]
        topicField.tap()
        topicField.typeText("Test topic")
        
        // Continue through flow
        app.buttons["Continue"].tap()
        
        // Verify interpretation step
        XCTAssert(app.staticTexts["AI is analyzing your topic..."].exists)
    }
    
    func testSwipeActions() throws {
        // Test swipe to delete
        // Test swipe to refresh
    }
}
```

### Snapshot Tests
- List view states (empty, loading, populated)
- Creation flow steps
- Error states

## Security Considerations

- No sensitive data in view models
- Secure API token handling
- Input validation for topics
- Rate limiting awareness

## Effort Estimate

3-4 developer days:
- Day 1: List view and interactions
- Day 2: Creation flow implementation
- Day 3: Polish, animations, and edge cases
- Day 4: Testing and refinement

## Success Metrics

- [ ] Smooth 60fps scrolling with 100+ radars
- [ ] < 100ms response to user interactions
- [ ] Gesture recognition works reliably
- [ ] Creation flow completion rate > 80%
- [ ] All animations feel native
- [ ] Accessibility fully supported
- [ ] Memory usage stays under 150MB
- [ ] No UI glitches or layout issues