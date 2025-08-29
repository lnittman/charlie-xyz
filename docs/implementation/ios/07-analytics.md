# Agent 7: Analytics & Insights
*"Create comprehensive analytics dashboard with charts and metrics"*

## Scope

This agent will implement a comprehensive analytics system including usage metrics, radar performance tracking, opinion distribution charts, trend analysis, and insights generation. The implementation will use native SwiftUI Charts for visualizations and provide actionable insights based on user data.

## Packages to modify

- `radar-ios/Views/Analytics/` - New analytics views
- `radar-ios/ViewModels/AnalyticsViewModel.swift` - Analytics logic
- `Packages/RadarAnalytics` - New analytics package
- `Packages/Design/Components/Charts/` - Chart components

## Implementation Details

### 1. Analytics Dashboard

```swift
// radar-ios/Views/Analytics/AnalyticsDashboardView.swift
import SwiftUI
import Charts

struct AnalyticsDashboardView: View {
    @StateObject private var viewModel = AnalyticsViewModel()
    @State private var selectedTimeRange: TimeRange = .week
    @State private var selectedMetric: MetricType = .overview
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Time range selector
                    TimeRangePicker(selectedRange: $selectedTimeRange)
                        .padding(.horizontal)
                    
                    // Key metrics cards
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            MetricCard(
                                title: "Total Radars",
                                value: viewModel.metrics.totalRadars,
                                change: viewModel.metrics.radarChange,
                                icon: "antenna.radiowaves.left.and.right"
                            )
                            
                            MetricCard(
                                title: "Opinions Generated",
                                value: viewModel.metrics.totalOpinions,
                                change: viewModel.metrics.opinionChange,
                                icon: "bubble.left.and.bubble.right"
                            )
                            
                            MetricCard(
                                title: "Active Rate",
                                value: viewModel.metrics.activeRate,
                                format: .percentage,
                                change: viewModel.metrics.activeRateChange,
                                icon: "chart.line.uptrend.xyaxis"
                            )
                            
                            MetricCard(
                                title: "Avg. Engagement",
                                value: viewModel.metrics.avgEngagement,
                                format: .decimal,
                                change: viewModel.metrics.engagementChange,
                                icon: "heart.circle"
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // Main chart section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Activity Overview")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ActivityChart(
                            data: viewModel.activityData,
                            timeRange: selectedTimeRange
                        )
                        .frame(height: 250)
                        .padding(.horizontal)
                    }
                    
                    // Insights section
                    if !viewModel.insights.isEmpty {
                        InsightsSection(insights: viewModel.insights)
                    }
                    
                    // Detailed metrics
                    VStack(spacing: 20) {
                        // Opinion distribution
                        OpinionDistributionView(
                            distribution: viewModel.opinionDistribution
                        )
                        
                        // Top performing radars
                        TopRadarsView(
                            radars: viewModel.topRadars
                        )
                        
                        // Engagement patterns
                        EngagementPatternsView(
                            patterns: viewModel.engagementPatterns
                        )
                    }
                    .padding(.horizontal)
                }
            }
            .navigationTitle("Analytics")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.exportAnalytics() }) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh(timeRange: selectedTimeRange)
            }
        }
        .task {
            await viewModel.loadAnalytics(timeRange: selectedTimeRange)
        }
        .onChange(of: selectedTimeRange) { newRange in
            Task {
                await viewModel.loadAnalytics(timeRange: newRange)
            }
        }
    }
}

struct MetricCard: View {
    let title: String
    let value: Double
    var format: MetricFormat = .number
    let change: Double?
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.radarAccent)
                
                Spacer()
                
                if let change = change {
                    ChangeBadge(value: change)
                }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(formattedValue)
                    .font(.title2)
                    .fontWeight(.bold)
            }
        }
        .padding()
        .frame(width: 160)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.radarSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.radarBorder, lineWidth: 1)
        )
    }
    
    private var formattedValue: String {
        switch format {
        case .number:
            return NumberFormatter.abbreviated.string(from: NSNumber(value: value)) ?? "0"
        case .percentage:
            return "\(Int(value * 100))%"
        case .decimal:
            return String(format: "%.2f", value)
        }
    }
}
```

### 2. Interactive Charts

```swift
// Packages/Design/Components/Charts/ActivityChart.swift
import SwiftUI
import Charts

struct ActivityChart: View {
    let data: [ActivityDataPoint]
    let timeRange: TimeRange
    
    @State private var selectedPoint: ActivityDataPoint?
    @State private var showingTooltip = false
    
    var body: some View {
        Chart(data) { point in
            // Area chart for overall activity
            AreaMark(
                x: .value("Date", point.date),
                y: .value("Activity", point.totalActivity)
            )
            .foregroundStyle(
                LinearGradient(
                    colors: [
                        Color.radarAccent.opacity(0.3),
                        Color.radarAccent.opacity(0.1)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .interpolationMethod(.catmullRom)
            
            // Line for activity
            LineMark(
                x: .value("Date", point.date),
                y: .value("Activity", point.totalActivity)
            )
            .foregroundStyle(Color.radarAccent)
            .lineStyle(StrokeStyle(lineWidth: 3))
            .interpolationMethod(.catmullRom)
            
            // Points for interaction
            if selectedPoint?.id == point.id {
                PointMark(
                    x: .value("Date", point.date),
                    y: .value("Activity", point.totalActivity)
                )
                .foregroundStyle(Color.radarAccent)
                .symbolSize(100)
                
                // Vertical rule
                RuleMark(x: .value("Date", point.date))
                    .foregroundStyle(Color.radarMuted.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
            }
        }
        .chartXAxis {
            AxisMarks(position: .bottom, values: .stride(by: .day)) { value in
                AxisGridLine()
                    .foregroundStyle(Color.radarBorder.opacity(0.3))
                AxisValueLabel(
                    format: dateFormat(for: timeRange),
                    centered: true
                )
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisGridLine()
                    .foregroundStyle(Color.radarBorder.opacity(0.3))
                AxisValueLabel()
            }
        }
        .chartBackground { chartProxy in
            GeometryReader { geometry in
                Rectangle()
                    .fill(Color.clear)
                    .contentShape(Rectangle())
                    .onContinuousHover { phase in
                        handleHover(phase, geometry: geometry, chartProxy: chartProxy)
                    }
            }
        }
        .overlay(alignment: .topLeading) {
            if showingTooltip, let selectedPoint = selectedPoint {
                ChartTooltip(dataPoint: selectedPoint)
                    .offset(tooltipOffset(for: selectedPoint))
            }
        }
    }
    
    private func handleHover(_ phase: HoverPhase, geometry: GeometryProxy, chartProxy: ChartProxy) {
        switch phase {
        case .active(let location):
            if let plotFrame = chartProxy.plotAreaFrame {
                let xPosition = location.x - geometry[plotFrame].origin.x
                let date = chartProxy.value(atX: xPosition, as: Date.self)
                
                // Find closest data point
                if let date = date,
                   let closest = data.min(by: { abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date)) }) {
                    selectedPoint = closest
                    showingTooltip = true
                }
            }
        case .ended:
            selectedPoint = nil
            showingTooltip = false
        }
    }
}

struct ChartTooltip: View {
    let dataPoint: ActivityDataPoint
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(dataPoint.date, style: .date)
                .font(.caption)
                .fontWeight(.semibold)
            
            HStack(spacing: 16) {
                TooltipMetric(
                    label: "Radars",
                    value: dataPoint.radarCount,
                    color: .blue
                )
                
                TooltipMetric(
                    label: "Opinions",
                    value: dataPoint.opinionCount,
                    color: .green
                )
                
                TooltipMetric(
                    label: "Engagement",
                    value: dataPoint.engagementCount,
                    color: .orange
                )
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.radarSurface)
                .shadow(radius: 8)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.radarBorder, lineWidth: 1)
        )
    }
}
```

### 3. Opinion Distribution

```swift
// radar-ios/Views/Analytics/OpinionDistributionView.swift
import SwiftUI
import Charts

struct OpinionDistributionView: View {
    let distribution: OpinionDistribution
    @State private var selectedSegment: OpinionSegment?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Opinion Distribution")
                .font(.headline)
            
            // Pie chart
            ZStack {
                Chart(distribution.segments) { segment in
                    SectorMark(
                        angle: .value("Count", segment.count),
                        innerRadius: .ratio(0.6),
                        angularInset: 2
                    )
                    .foregroundStyle(segment.color)
                    .opacity(selectedSegment == nil || selectedSegment?.id == segment.id ? 1 : 0.5)
                }
                .frame(height: 200)
                .chartAngleSelection(value: .constant(nil))
                .chartBackground { chartProxy in
                    GeometryReader { geometry in
                        let frame = geometry.frame(in: .local)
                        
                        VStack {
                            Text("\(distribution.totalCount)")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                            Text("Total Opinions")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .position(x: frame.midX, y: frame.midY)
                    }
                }
                
                // Segment labels
                ForEach(distribution.segments) { segment in
                    SegmentLabel(
                        segment: segment,
                        totalCount: distribution.totalCount,
                        isSelected: selectedSegment?.id == segment.id
                    )
                }
            }
            
            // Legend
            VStack(alignment: .leading, spacing: 12) {
                ForEach(distribution.segments) { segment in
                    HStack {
                        Circle()
                            .fill(segment.color)
                            .frame(width: 12, height: 12)
                        
                        Text(segment.label)
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Text("\(segment.count)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        Text("(\(Int(segment.percentage))%)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation(.spring()) {
                            selectedSegment = selectedSegment?.id == segment.id ? nil : segment
                        }
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.radarSurface.opacity(0.5))
            )
        }
    }
}

struct OpinionSegment: Identifiable {
    let id = UUID()
    let label: String
    let count: Int
    let percentage: Double
    let color: Color
    let position: RadarPosition?
    let model: String?
}
```

### 4. Insights Generation

```swift
// Packages/RadarAnalytics/Sources/RadarAnalytics/InsightsEngine.swift
import Foundation

public class InsightsEngine {
    
    public func generateInsights(from analytics: AnalyticsData) async -> [Insight] {
        var insights: [Insight] = []
        
        // Performance insights
        if let performanceInsight = analyzePerformance(analytics) {
            insights.append(performanceInsight)
        }
        
        // Engagement insights
        if let engagementInsight = analyzeEngagement(analytics) {
            insights.append(engagementInsight)
        }
        
        // Trend insights
        if let trendInsight = analyzeTrends(analytics) {
            insights.append(trendInsight)
        }
        
        // Optimization insights
        insights.append(contentsOf: generateOptimizationSuggestions(analytics))
        
        // Sort by priority
        return insights.sorted { $0.priority.rawValue > $1.priority.rawValue }
    }
    
    private func analyzePerformance(_ data: AnalyticsData) -> Insight? {
        let recentActivity = data.activityData.suffix(7)
        let previousActivity = data.activityData.dropLast(7).suffix(7)
        
        guard !recentActivity.isEmpty, !previousActivity.isEmpty else { return nil }
        
        let recentAvg = recentActivity.map(\.totalActivity).reduce(0, +) / Double(recentActivity.count)
        let previousAvg = previousActivity.map(\.totalActivity).reduce(0, +) / Double(previousActivity.count)
        
        let change = (recentAvg - previousAvg) / previousAvg
        
        if change > 0.3 {
            return Insight(
                id: UUID().uuidString,
                type: .performance,
                priority: .high,
                title: "Activity Surge Detected",
                message: "Your radar activity has increased by \(Int(change * 100))% this week!",
                icon: "arrow.up.circle.fill",
                color: .green,
                action: .viewDetails("activity")
            )
        } else if change < -0.3 {
            return Insight(
                id: UUID().uuidString,
                type: .performance,
                priority: .medium,
                title: "Activity Decline",
                message: "Your radar activity has decreased by \(Int(abs(change) * 100))% this week.",
                icon: "arrow.down.circle.fill",
                color: .orange,
                action: .suggestion("Consider refreshing your most popular radars")
            )
        }
        
        return nil
    }
    
    private func analyzeEngagement(_ data: AnalyticsData) -> Insight? {
        let topRadars = data.topRadars.prefix(3)
        guard !topRadars.isEmpty else { return nil }
        
        let avgEngagement = topRadars.map(\.engagementRate).reduce(0, +) / Double(topRadars.count)
        
        if avgEngagement > 0.7 {
            return Insight(
                id: UUID().uuidString,
                type: .engagement,
                priority: .high,
                title: "High Engagement",
                message: "Your top radars are generating exceptional engagement!",
                icon: "heart.circle.fill",
                color: .purple,
                action: .viewDetails("top-radars")
            )
        }
        
        return nil
    }
    
    private func generateOptimizationSuggestions(_ data: AnalyticsData) -> [Insight] {
        var suggestions: [Insight] = []
        
        // Inactive radars
        let inactiveRadars = data.radars.filter { radar in
            radar.lastRefreshed.timeIntervalSinceNow < -604800 // 7 days
        }
        
        if !inactiveRadars.isEmpty {
            suggestions.append(Insight(
                id: UUID().uuidString,
                type: .optimization,
                priority: .low,
                title: "Inactive Radars",
                message: "You have \(inactiveRadars.count) radars that haven't been updated in over a week.",
                icon: "exclamationmark.triangle",
                color: .yellow,
                action: .action("Review Inactive", "review-inactive")
            ))
        }
        
        // Position balance
        let positionCounts = Dictionary(grouping: data.radars, by: { $0.position })
            .mapValues { $0.count }
        
        if let maxPosition = positionCounts.max(by: { $0.value < $1.value }),
           let minPosition = positionCounts.min(by: { $0.value < $1.value }),
           Double(maxPosition.value) / Double(minPosition.value) > 3 {
            suggestions.append(Insight(
                id: UUID().uuidString,
                type: .optimization,
                priority: .low,
                title: "Position Imbalance",
                message: "Consider diversifying your radar positions for more balanced insights.",
                icon: "scale.3d",
                color: .blue,
                action: .suggestion("Create radars with different positions")
            ))
        }
        
        return suggestions
    }
}
```

### 5. Engagement Patterns

```swift
// radar-ios/Views/Analytics/EngagementPatternsView.swift
import SwiftUI
import Charts

struct EngagementPatternsView: View {
    let patterns: EngagementPatterns
    @State private var selectedMetric: EngagementMetric = .views
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Engagement Patterns")
                    .font(.headline)
                
                Spacer()
                
                Picker("Metric", selection: $selectedMetric) {
                    ForEach(EngagementMetric.allCases, id: \.self) { metric in
                        Text(metric.displayName)
                            .tag(metric)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 200)
            }
            
            // Heatmap
            EngagementHeatmap(
                data: patterns.heatmapData(for: selectedMetric),
                metric: selectedMetric
            )
            .frame(height: 200)
            
            // Best times
            if let bestTimes = patterns.bestTimes(for: selectedMetric) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Best Times")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    HStack {
                        ForEach(bestTimes.prefix(3), id: \.self) { time in
                            TimeChip(time: time)
                        }
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.radarSurface.opacity(0.5))
                )
            }
        }
    }
}

struct EngagementHeatmap: View {
    let data: [[Double]]
    let metric: EngagementMetric
    
    private let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    private let hours = Array(0...23)
    
    var body: some View {
        GeometryReader { geometry in
            let cellWidth = geometry.size.width / 24
            let cellHeight = geometry.size.height / 7
            
            ZStack {
                // Grid
                ForEach(0..<7, id: \.self) { dayIndex in
                    ForEach(0..<24, id: \.self) { hourIndex in
                        let value = data[dayIndex][hourIndex]
                        let intensity = normalizedValue(value)
                        
                        Rectangle()
                            .fill(heatColor(intensity: intensity))
                            .frame(width: cellWidth - 2, height: cellHeight - 2)
                            .position(
                                x: CGFloat(hourIndex) * cellWidth + cellWidth / 2,
                                y: CGFloat(dayIndex) * cellHeight + cellHeight / 2
                            )
                            .overlay(
                                Group {
                                    if value > 0 {
                                        Text("\(Int(value))")
                                            .font(.system(size: 8))
                                            .foregroundColor(intensity > 0.5 ? .white : .primary)
                                    }
                                }
                                .position(
                                    x: CGFloat(hourIndex) * cellWidth + cellWidth / 2,
                                    y: CGFloat(dayIndex) * cellHeight + cellHeight / 2
                                )
                            )
                    }
                }
                
                // Day labels
                ForEach(0..<7, id: \.self) { dayIndex in
                    Text(days[dayIndex])
                        .font(.caption)
                        .position(
                            x: -20,
                            y: CGFloat(dayIndex) * cellHeight + cellHeight / 2
                        )
                }
                
                // Hour labels
                ForEach([0, 6, 12, 18], id: \.self) { hour in
                    Text("\(hour)")
                        .font(.caption)
                        .position(
                            x: CGFloat(hour) * cellWidth + cellWidth / 2,
                            y: geometry.size.height + 10
                        )
                }
            }
        }
    }
    
    private func normalizedValue(_ value: Double) -> Double {
        let maxValue = data.flatMap { $0 }.max() ?? 1
        return value / maxValue
    }
    
    private func heatColor(intensity: Double) -> Color {
        if intensity == 0 {
            return Color.radarSurface
        }
        
        return Color.radarAccent.opacity(0.2 + intensity * 0.8)
    }
}
```

### 6. Export & Sharing

```swift
// radar-ios/ViewModels/AnalyticsExporter.swift
import Foundation
import SwiftUI
import UniformTypeIdentifiers

class AnalyticsExporter {
    
    func exportAnalytics(_ data: AnalyticsData, format: ExportFormat) async throws -> URL {
        switch format {
        case .csv:
            return try await exportAsCSV(data)
        case .json:
            return try await exportAsJSON(data)
        case .pdf:
            return try await exportAsPDF(data)
        }
    }
    
    private func exportAsCSV(_ data: AnalyticsData) async throws -> URL {
        var csvContent = "Date,Radars Created,Opinions Generated,Engagement Rate,Active Radars\n"
        
        for point in data.activityData {
            csvContent += "\(point.date),\(point.radarCount),\(point.opinionCount),\(point.engagementRate),\(point.activeRadarCount)\n"
        }
        
        let fileName = "radar-analytics-\(Date().ISO8601Format()).csv"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        try csvContent.write(to: url, atomically: true, encoding: .utf8)
        
        return url
    }
    
    private func exportAsPDF(_ data: AnalyticsData) async throws -> URL {
        // Create PDF document
        let renderer = ImageRenderer(content: AnalyticsReportView(data: data))
        
        renderer.render { size, context in
            var box = CGRect(origin: .zero, size: size)
            
            guard let pdf = CGContext(
                FileManager.default.temporaryDirectory
                    .appendingPathComponent("analytics-report.pdf")
                    .path,
                mediaBox: &box,
                nil
            ) else { return }
            
            pdf.beginPDFPage(nil)
            context(pdf)
            pdf.endPDFPage()
            pdf.closePDF()
        }
        
        return FileManager.default.temporaryDirectory
            .appendingPathComponent("analytics-report.pdf")
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
```

## Dependencies

- Agent 2 (API Integration) - For fetching analytics data
- Agent 4 (UI/UX) - For chart components and animations

## Testing Strategy

1. **Unit Tests**
   - Test insight generation logic
   - Test data aggregation
   - Test export formats

2. **Integration Tests**
   - Test chart rendering
   - Test real-time updates
   - Test data accuracy

3. **Performance Tests**
   - Test with large datasets
   - Test chart rendering performance
   - Test memory usage

## Security Considerations

1. **Data Privacy**: Anonymize shared analytics
2. **Export Security**: Encrypt exported files
3. **Access Control**: Limit analytics based on subscription
4. **Data Retention**: Follow privacy policies

## Effort Estimate

8-10 developer days

## Success Metrics

- [ ] All chart types implemented
- [ ] Insights generation accurate
- [ ] Export functionality working
- [ ] Real-time updates smooth
- [ ] < 1s load time for dashboard
- [ ] 60 fps chart animations
- [ ] Accurate data visualization
- [ ] Actionable insights provided
- [ ] Export formats complete
- [ ] Mobile-optimized charts