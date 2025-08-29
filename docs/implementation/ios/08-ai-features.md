# Agent 8: AI & Opinion Features
*"Enhanced AI model selection and streaming capabilities"*

## Scope

This agent will implement advanced AI features including model selection (GPT-4, Claude, Gemini), streaming responses, opinion regeneration, custom prompts, and AI-powered insights. The implementation will focus on providing a seamless experience for generating and managing AI opinions with real-time updates.

## Packages to modify

- `Packages/RadarAI` - New AI features package
- `radar-ios/Views/Opinion/` - Enhanced opinion views
- `radar-ios/ViewModels/OpinionViewModel.swift` - Opinion generation logic
- `Packages/RadarAPI/Sources/RadarAPI/Streaming/` - SSE support

## Implementation Details

### 1. AI Model Selection

```swift
// Packages/RadarAI/Sources/RadarAI/Models/AIModel.swift
import Foundation

public enum AIModel: String, CaseIterable, Codable {
    case gpt4 = "gpt-4"
    case gpt4Turbo = "gpt-4-turbo"
    case claude3Opus = "claude-3-opus"
    case claude3Sonnet = "claude-3-sonnet"
    case geminiPro = "gemini-pro"
    case geminiUltra = "gemini-ultra"
    
    public var displayName: String {
        switch self {
        case .gpt4: return "GPT-4"
        case .gpt4Turbo: return "GPT-4 Turbo"
        case .claude3Opus: return "Claude 3 Opus"
        case .claude3Sonnet: return "Claude 3 Sonnet"
        case .geminiPro: return "Gemini Pro"
        case .geminiUltra: return "Gemini Ultra"
        }
    }
    
    public var provider: AIProvider {
        switch self {
        case .gpt4, .gpt4Turbo: return .openai
        case .claude3Opus, .claude3Sonnet: return .anthropic
        case .geminiPro, .geminiUltra: return .google
        }
    }
    
    public var capabilities: ModelCapabilities {
        switch self {
        case .gpt4, .claude3Opus, .geminiUltra:
            return ModelCapabilities(
                maxTokens: 8192,
                supportsStreaming: true,
                supportsVision: true,
                supportsFunctionCalling: true,
                contextWindow: 128000
            )
        case .gpt4Turbo:
            return ModelCapabilities(
                maxTokens: 4096,
                supportsStreaming: true,
                supportsVision: true,
                supportsFunctionCalling: true,
                contextWindow: 128000
            )
        case .claude3Sonnet:
            return ModelCapabilities(
                maxTokens: 4096,
                supportsStreaming: true,
                supportsVision: true,
                supportsFunctionCalling: false,
                contextWindow: 200000
            )
        case .geminiPro:
            return ModelCapabilities(
                maxTokens: 2048,
                supportsStreaming: true,
                supportsVision: false,
                supportsFunctionCalling: true,
                contextWindow: 32000
            )
        }
    }
    
    public var estimatedCost: String {
        switch self {
        case .gpt4: return "$0.03/1K tokens"
        case .gpt4Turbo: return "$0.01/1K tokens"
        case .claude3Opus: return "$0.015/1K tokens"
        case .claude3Sonnet: return "$0.003/1K tokens"
        case .geminiPro: return "$0.001/1K tokens"
        case .geminiUltra: return "$0.02/1K tokens"
        }
    }
}

public struct ModelCapabilities {
    public let maxTokens: Int
    public let supportsStreaming: Bool
    public let supportsVision: Bool
    public let supportsFunctionCalling: Bool
    public let contextWindow: Int
}
```

### 2. Model Selection UI

```swift
// radar-ios/Views/Opinion/ModelSelectionView.swift
import SwiftUI
import RadarAI

struct ModelSelectionView: View {
    @Binding var selectedModel: AIModel
    @State private var showingDetails = false
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(AIProvider.allCases, id: \.self) { provider in
                    Section(provider.displayName) {
                        ForEach(provider.availableModels, id: \.self) { model in
                            ModelRow(
                                model: model,
                                isSelected: selectedModel == model,
                                onSelect: {
                                    selectedModel = model
                                    dismiss()
                                }
                            )
                        }
                    }
                }
                
                Section {
                    Button(action: { showingDetails = true }) {
                        Label("Compare Models", systemImage: "chart.bar")
                    }
                }
            }
            .navigationTitle("Select AI Model")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $showingDetails) {
                ModelComparisonView()
            }
        }
    }
}

struct ModelRow: View {
    let model: AIModel
    let isSelected: Bool
    let onSelect: () -> Void
    
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: onSelect) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(model.displayName)
                                .font(.headline)
                            
                            if model.capabilities.supportsStreaming {
                                Image(systemName: "dot.radiowaves.left.and.right")
                                    .font(.caption)
                                    .foregroundColor(.green)
                            }
                        }
                        
                        Text(model.estimatedCost)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.radarAccent)
                    }
                    
                    Button(action: { isExpanded.toggle() }) {
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            if isExpanded {
                ModelCapabilitiesView(capabilities: model.capabilities)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(.vertical, 4)
        .animation(.spring(response: 0.3), value: isExpanded)
    }
}
```

### 3. Streaming Opinion Generation

```swift
// Packages/RadarAI/Sources/RadarAI/OpinionStreamer.swift
import Foundation
import Combine

public class OpinionStreamer: ObservableObject {
    @Published public private(set) var streamingText = ""
    @Published public private(set) var isStreaming = false
    @Published public private(set) var error: Error?
    
    private var eventSource: EventSource?
    private var cancellables = Set<AnyCancellable>()
    
    public init() {}
    
    public func streamOpinion(
        for radar: Radar,
        model: AIModel,
        position: RadarPosition? = nil,
        customPrompt: String? = nil
    ) async throws -> AsyncThrowingStream<String, Error> {
        streamingText = ""
        isStreaming = true
        error = nil
        
        let request = GenerateOpinionRequest(
            radarId: radar.id,
            topic: radar.topic,
            model: model,
            position: position,
            customPrompt: customPrompt,
            stream: true
        )
        
        let endpoint = APIEndpoint.generateOpinion(request)
        
        return AsyncThrowingStream { continuation in
            Task {
                do {
                    let url = try APIClient.shared.buildURL(for: endpoint)
                    var urlRequest = URLRequest(url: url)
                    urlRequest.httpMethod = "POST"
                    urlRequest.setValue("text/event-stream", forHTTPHeaderField: "Accept")
                    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    urlRequest.httpBody = try JSONEncoder().encode(request)
                    
                    // Add auth headers
                    if let token = await AuthManager.shared.accessToken {
                        urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                    }
                    
                    self.eventSource = EventSource(request: urlRequest)
                    
                    self.eventSource?.onMessage = { [weak self] message in
                        guard let data = message.data else { return }
                        
                        if data == "[DONE]" {
                            continuation.finish()
                            self?.isStreaming = false
                            return
                        }
                        
                        do {
                            let chunk = try JSONDecoder().decode(OpinionChunk.self, from: Data(data.utf8))
                            self?.streamingText += chunk.text
                            continuation.yield(chunk.text)
                        } catch {
                            continuation.finish(throwing: error)
                        }
                    }
                    
                    self.eventSource?.onError = { [weak self] error in
                        self?.error = error
                        self?.isStreaming = false
                        continuation.finish(throwing: error)
                    }
                    
                    self.eventSource?.connect()
                    
                } catch {
                    self.error = error
                    self.isStreaming = false
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    public func stopStreaming() {
        eventSource?.disconnect()
        eventSource = nil
        isStreaming = false
    }
}

// Server-Sent Events support
class EventSource {
    private let request: URLRequest
    private var task: URLSessionDataTask?
    private var session: URLSession
    
    var onMessage: ((SSEMessage) -> Void)?
    var onError: ((Error) -> Void)?
    
    init(request: URLRequest) {
        self.request = request
        self.session = URLSession(configuration: .default, delegate: nil, delegateQueue: nil)
    }
    
    func connect() {
        task = session.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                self?.onError?(error)
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                self?.onError?(APIError.invalidResponse)
                return
            }
        }
        
        task?.resume()
        
        // Start reading stream
        readStream()
    }
    
    private func readStream() {
        // Implementation for parsing SSE stream
        // Parse "data: {...}\n\n" format
    }
    
    func disconnect() {
        task?.cancel()
    }
}
```

### 4. Opinion Management UI

```swift
// radar-ios/Views/Opinion/OpinionDetailView.swift
import SwiftUI
import RadarAI

struct OpinionDetailView: View {
    let opinion: Opinion
    @StateObject private var streamer = OpinionStreamer()
    @State private var isRegenerating = false
    @State private var selectedModel: AIModel
    @State private var showingModelSelection = false
    @State private var customPrompt = ""
    @State private var showingCustomPrompt = false
    
    init(opinion: Opinion) {
        self.opinion = opinion
        self._selectedModel = State(initialValue: opinion.model ?? .gpt4Turbo)
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                OpinionHeaderView(
                    opinion: opinion,
                    model: selectedModel,
                    onModelTap: { showingModelSelection = true }
                )
                
                // Content
                if streamer.isStreaming {
                    StreamingOpinionView(text: streamer.streamingText)
                        .transition(.opacity)
                } else {
                    OpinionContentView(opinion: opinion)
                }
                
                // Actions
                OpinionActionsView(
                    isRegenerating: isRegenerating,
                    onRegenerate: regenerateOpinion,
                    onCustomPrompt: { showingCustomPrompt = true },
                    onShare: shareOpinion
                )
                
                // Metadata
                OpinionMetadataView(opinion: opinion)
            }
            .padding()
        }
        .navigationTitle("AI Opinion")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingModelSelection) {
            ModelSelectionView(selectedModel: $selectedModel)
        }
        .sheet(isPresented: $showingCustomPrompt) {
            CustomPromptView(
                prompt: $customPrompt,
                onGenerate: { generateWithCustomPrompt() }
            )
        }
    }
    
    private func regenerateOpinion() {
        Task {
            isRegenerating = true
            defer { isRegenerating = false }
            
            do {
                let stream = try await streamer.streamOpinion(
                    for: opinion.radar,
                    model: selectedModel,
                    position: opinion.position
                )
                
                for try await _ in stream {
                    // UI updates automatically via @Published
                }
                
                // Save the new opinion
                await saveOpinion()
            } catch {
                // Handle error
            }
        }
    }
    
    private func generateWithCustomPrompt() {
        Task {
            isRegenerating = true
            defer { isRegenerating = false }
            
            do {
                let stream = try await streamer.streamOpinion(
                    for: opinion.radar,
                    model: selectedModel,
                    position: opinion.position,
                    customPrompt: customPrompt
                )
                
                for try await _ in stream {
                    // UI updates automatically
                }
                
                await saveOpinion()
            } catch {
                // Handle error
            }
        }
    }
}
```

### 5. AI-Powered Insights

```swift
// Packages/RadarAI/Sources/RadarAI/InsightsGenerator.swift
import Foundation

public class AIInsightsGenerator {
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    public func generateInsights(
        from opinions: [Opinion],
        using model: AIModel = .gpt4Turbo
    ) async throws -> RadarInsights {
        let request = GenerateInsightsRequest(
            opinions: opinions.map { OpinionSummary(from: $0) },
            model: model,
            insightTypes: [.trends, .consensus, .outliers, .predictions]
        )
        
        let response = try await apiClient.request(
            endpoint: .generateInsights(request),
            responseType: RadarInsights.self
        )
        
        return response
    }
    
    public func generateComparison(
        opinions: [Opinion],
        compareBy: ComparisonType
    ) async throws -> OpinionComparison {
        let request = CompareOpinionsRequest(
            opinions: opinions,
            comparisonType: compareBy,
            includeVisualization: true
        )
        
        return try await apiClient.request(
            endpoint: .compareOpinions(request),
            responseType: OpinionComparison.self
        )
    }
}

public struct RadarInsights: Codable {
    public let summary: String
    public let keyTrends: [Trend]
    public let consensus: ConsensusAnalysis?
    public let outliers: [OutlierOpinion]
    public let predictions: [Prediction]
    public let confidence: Double
    
    public struct Trend: Codable, Identifiable {
        public let id: String
        public let description: String
        public let strength: Double
        public let direction: TrendDirection
        public let affectedPositions: [RadarPosition]
    }
    
    public struct ConsensusAnalysis: Codable {
        public let overallAgreement: Double
        public let mainPoints: [String]
        public let disagreements: [String]
    }
    
    public struct OutlierOpinion: Codable, Identifiable {
        public let id: String
        public let opinionId: String
        public let reason: String
        public let deviationScore: Double
    }
    
    public struct Prediction: Codable, Identifiable {
        public let id: String
        public let statement: String
        public let likelihood: Double
        public let timeframe: String
        public let confidence: Double
    }
}
```

### 6. Enhanced Opinion UI Components

```swift
// radar-ios/Views/Opinion/Components/InsightsView.swift
import SwiftUI
import Charts

struct InsightsView: View {
    let insights: RadarInsights
    @State private var selectedTab: InsightTab = .summary
    
    enum InsightTab: String, CaseIterable {
        case summary = "Summary"
        case trends = "Trends"
        case consensus = "Consensus"
        case predictions = "Predictions"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Tab selector
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    ForEach(InsightTab.allCases, id: \.self) { tab in
                        TabButton(
                            title: tab.rawValue,
                            isSelected: selectedTab == tab,
                            action: { selectedTab = tab }
                        )
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 12)
            
            Divider()
            
            // Content
            ScrollView {
                VStack(spacing: 20) {
                    switch selectedTab {
                    case .summary:
                        SummaryInsightView(summary: insights.summary)
                    case .trends:
                        TrendsInsightView(trends: insights.keyTrends)
                    case .consensus:
                        if let consensus = insights.consensus {
                            ConsensusInsightView(consensus: consensus)
                        }
                    case .predictions:
                        PredictionsInsightView(predictions: insights.predictions)
                    }
                }
                .padding()
            }
        }
    }
}

struct TrendsInsightView: View {
    let trends: [RadarInsights.Trend]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(trends) { trend in
                TrendCard(trend: trend)
            }
        }
    }
}

struct TrendCard: View {
    let trend: RadarInsights.Trend
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Direction indicator
                Image(systemName: trend.direction.icon)
                    .font(.title2)
                    .foregroundColor(trend.direction.color)
                    .rotationEffect(.degrees(trend.direction.rotation))
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(trend.description)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    // Affected positions
                    HStack {
                        ForEach(trend.affectedPositions, id: \.self) { position in
                            PositionChip(position: position)
                        }
                    }
                }
                
                Spacer()
                
                // Strength indicator
                StrengthIndicator(strength: trend.strength)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.radarSurface)
        )
    }
}

struct StrengthIndicator: View {
    let strength: Double
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(Int(strength * 100))%")
                .font(.caption)
                .fontWeight(.bold)
            
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.radarMuted.opacity(0.3))
                    .frame(width: 40, height: 60)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(strengthColor)
                    .frame(width: 40, height: 60 * strength)
            }
        }
    }
    
    private var strengthColor: Color {
        if strength > 0.7 {
            return .green
        } else if strength > 0.4 {
            return .orange
        } else {
            return .red
        }
    }
}
```

## Dependencies

- Agent 2 (API Integration) - For streaming support
- Agent 4 (UI/UX) - For streaming UI components

## Testing Strategy

1. **Unit Tests**
   - Test model capabilities
   - Test streaming parser
   - Test insights generation

2. **Integration Tests**
   - Test model switching
   - Test streaming reliability
   - Test error recovery

3. **Performance Tests**
   - Test streaming latency
   - Test UI responsiveness
   - Test memory usage during streaming

## Security Considerations

1. **API Keys**: Never expose provider API keys
2. **Content Filtering**: Implement safety filters
3. **Rate Limiting**: Respect provider limits
4. **Data Privacy**: Don't log sensitive content
5. **Model Access**: Validate user permissions

## Effort Estimate

8-10 developer days

## Success Metrics

- [ ] All AI models integrated
- [ ] Streaming working smoothly
- [ ] Model selection UI intuitive
- [ ] Custom prompts functional
- [ ] Insights generation accurate
- [ ] < 200ms streaming latency
- [ ] Zero data loss during streaming
- [ ] Model switching seamless
- [ ] Error handling robust
- [ ] UI remains responsive