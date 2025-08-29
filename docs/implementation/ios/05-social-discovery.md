# Agent 5: Social & Discovery
*"Build explore, trending, and social features for community engagement"*

## Scope

This agent will implement social and discovery features including trending topics, public radar exploration, user profiles, following system, activity feeds, and community engagement features. The goal is to create a vibrant community experience that encourages users to discover and engage with public radars.

## Packages to modify

- `radar-ios/Views/Explore/` - New explore interface
- `radar-ios/Views/Profile/` - Enhanced profile with social features
- `Packages/RadarCore/Sources/RadarCore/Models/Social/` - Social models
- `Packages/RadarAPI/Sources/RadarAPI/Endpoints/Social/` - Social endpoints

## Implementation Details

### 1. Trending Topics View

```swift
// radar-ios/Views/Explore/TrendingView.swift
import SwiftUI
import Charts

struct TrendingView: View {
    @StateObject private var viewModel = TrendingViewModel()
    @State private var selectedTimeframe: Timeframe = .day
    @State private var selectedCategory: TrendingCategory = .all
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header with filters
                TrendingHeaderView(
                    selectedTimeframe: $selectedTimeframe,
                    selectedCategory: $selectedCategory
                )
                
                // Featured trending topic
                if let featured = viewModel.featuredTopic {
                    FeaturedTrendingCard(topic: featured)
                        .padding(.horizontal)
                }
                
                // Trending list
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.trendingTopics) { topic in
                        TrendingTopicRow(
                            topic: topic,
                            rank: viewModel.trendingTopics.firstIndex(of: topic)! + 1
                        )
                        .transition(.asymmetric(
                            insertion: .push(from: .trailing),
                            removal: .push(from: .leading)
                        ))
                    }
                }
                .padding(.horizontal)
            }
        }
        .refreshable {
            await viewModel.refresh()
        }
        .onChange(of: selectedTimeframe) { _ in
            Task { await viewModel.loadTrending(timeframe: selectedTimeframe, category: selectedCategory) }
        }
        .onChange(of: selectedCategory) { _ in
            Task { await viewModel.loadTrending(timeframe: selectedTimeframe, category: selectedCategory) }
        }
    }
}

struct FeaturedTrendingCard: View {
    let topic: TrendingTopic
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Label("Trending Now", systemImage: "flame.fill")
                    .font(.caption)
                    .foregroundColor(.orange)
                
                Spacer()
                
                TrendBadge(change: topic.changePercent)
            }
            
            // Topic
            Text(topic.title)
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.leading)
            
            // Metrics
            HStack(spacing: 24) {
                MetricView(
                    value: topic.radarCount,
                    label: "Radars",
                    icon: "antenna.radiowaves.left.and.right"
                )
                
                MetricView(
                    value: topic.opinionCount,
                    label: "Opinions",
                    icon: "bubble.left.and.bubble.right"
                )
                
                MetricView(
                    value: topic.engagementScore,
                    label: "Engagement",
                    icon: "chart.line.uptrend.xyaxis"
                )
            }
            
            // Mini chart
            if isExpanded {
                TrendChartView(data: topic.trendData)
                    .frame(height: 120)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
            
            // Action buttons
            HStack(spacing: 12) {
                Button(action: { createRadar(for: topic) }) {
                    Label("Create Radar", systemImage: "plus.circle")
                }
                .buttonStyle(RadarPrimaryButtonStyle())
                
                Button(action: { isExpanded.toggle() }) {
                    Label(
                        isExpanded ? "Show Less" : "Show Trend",
                        systemImage: isExpanded ? "chevron.up" : "chart.line.uptrend.xyaxis"
                    )
                }
                .buttonStyle(RadarSecondaryButtonStyle())
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(
                    LinearGradient(
                        colors: [
                            Color.radarAccent.opacity(0.1),
                            Color.radarBackground
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.radarBorder, lineWidth: 1)
        )
    }
}

struct TrendChartView: View {
    let data: [TrendDataPoint]
    
    var body: some View {
        Chart(data) { point in
            LineMark(
                x: .value("Time", point.timestamp),
                y: .value("Activity", point.value)
            )
            .foregroundStyle(Color.radarAccent)
            .interpolationMethod(.catmullRom)
            
            AreaMark(
                x: .value("Time", point.timestamp),
                y: .value("Activity", point.value)
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
        }
        .chartXAxis {
            AxisMarks(position: .bottom) { _ in
                AxisGridLine()
                    .foregroundStyle(Color.radarBorder.opacity(0.3))
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { _ in
                AxisGridLine()
                    .foregroundStyle(Color.radarBorder.opacity(0.3))
            }
        }
    }
}
```

### 2. Public Radars Exploration

```swift
// radar-ios/Views/Explore/ExploreView.swift
import SwiftUI

struct ExploreView: View {
    @StateObject private var viewModel = ExploreViewModel()
    @State private var searchText = ""
    @State private var selectedFilter: ExploreFilter = .trending
    @State private var showingFilterSheet = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Search bar
                    ExploreSearchBar(
                        text: $searchText,
                        onFilterTap: { showingFilterSheet = true }
                    )
                    .padding()
                    
                    // Category pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(ExploreCategory.allCases, id: \.self) { category in
                                CategoryPill(
                                    category: category,
                                    isSelected: viewModel.selectedCategory == category,
                                    action: { viewModel.selectedCategory = category }
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.bottom)
                    
                    // Content
                    switch selectedFilter {
                    case .trending:
                        TrendingRadarsSection(radars: viewModel.trendingRadars)
                    case .recent:
                        RecentRadarsSection(radars: viewModel.recentRadars)
                    case .popular:
                        PopularRadarsSection(radars: viewModel.popularRadars)
                    case .following:
                        FollowingRadarsSection(radars: viewModel.followingRadars)
                    }
                }
            }
            .navigationTitle("Explore")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingFilterSheet) {
                FilterSheet(
                    selectedFilter: $selectedFilter,
                    sortOrder: $viewModel.sortOrder,
                    timeRange: $viewModel.timeRange
                )
            }
        }
        .searchable(text: $searchText, prompt: "Search radars...")
        .onChange(of: searchText) { newValue in
            viewModel.search(query: newValue)
        }
    }
}

struct PublicRadarCard: View {
    let radar: PublicRadar
    @State private var isLiked = false
    @State private var showingProfile = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Author header
            HStack {
                AsyncImage(url: radar.author.avatarURL) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(Color.radarMuted.opacity(0.3))
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                .onTapGesture {
                    showingProfile = true
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(radar.author.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Text("@\(radar.author.username)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(radar.createdAt.relativeTime)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Content
            VStack(alignment: .leading, spacing: 8) {
                Text(radar.topic)
                    .font(.headline)
                    .lineLimit(2)
                
                if let interpretation = radar.interpretation {
                    Text(interpretation)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(3)
                }
                
                // Position badge
                if let position = radar.position {
                    HStack {
                        PositionBadge(position: position)
                        Spacer()
                    }
                }
            }
            
            // Engagement metrics
            HStack(spacing: 20) {
                // Likes
                Button(action: toggleLike) {
                    HStack(spacing: 4) {
                        Image(systemName: isLiked ? "heart.fill" : "heart")
                            .foregroundColor(isLiked ? .red : .secondary)
                        
                        Text("\(radar.likeCount)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .buttonStyle(PlainButtonStyle())
                
                // Comments
                HStack(spacing: 4) {
                    Image(systemName: "bubble.left")
                        .foregroundColor(.secondary)
                    
                    Text("\(radar.commentCount)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Opinions
                HStack(spacing: 4) {
                    Image(systemName: "lightbulb")
                        .foregroundColor(.secondary)
                    
                    Text("\(radar.opinionCount)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Share
                Button(action: share) {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.radarSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.radarBorder, lineWidth: 1)
        )
        .sheet(isPresented: $showingProfile) {
            UserProfileView(userId: radar.author.id)
        }
    }
    
    private func toggleLike() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            isLiked.toggle()
            HapticManager.shared.impact(.light)
        }
        
        Task {
            await viewModel.toggleLike(radarId: radar.id)
        }
    }
}
```

### 3. User Profiles & Following

```swift
// radar-ios/Views/Profile/PublicProfileView.swift
import SwiftUI

struct PublicProfileView: View {
    let userId: String
    @StateObject private var viewModel = ProfileViewModel()
    @State private var selectedTab: ProfileTab = .radars
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Profile header
                ProfileHeaderView(user: viewModel.user)
                
                // Stats
                ProfileStatsView(stats: viewModel.stats)
                    .padding()
                
                // Follow/Following button
                if viewModel.user?.id != AuthManager.shared.currentUserId {
                    FollowButton(
                        isFollowing: viewModel.isFollowing,
                        action: { await viewModel.toggleFollow() }
                    )
                    .padding(.horizontal)
                }
                
                // Tab selector
                ProfileTabSelector(selectedTab: $selectedTab)
                    .padding(.top)
                
                // Content
                switch selectedTab {
                case .radars:
                    UserRadarsGrid(radars: viewModel.radars)
                case .likes:
                    UserLikesGrid(likes: viewModel.likes)
                case .following:
                    FollowingList(users: viewModel.following)
                case .followers:
                    FollowersList(users: viewModel.followers)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadProfile(userId: userId)
        }
    }
}

struct ProfileStatsView: View {
    let stats: UserStats
    
    var body: some View {
        HStack(spacing: 0) {
            StatItem(value: stats.radarCount, label: "Radars")
            Divider().frame(height: 40)
            StatItem(value: stats.followerCount, label: "Followers")
            Divider().frame(height: 40)
            StatItem(value: stats.followingCount, label: "Following")
        }
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.radarSurface)
        )
    }
}

struct FollowButton: View {
    let isFollowing: Bool
    let action: () async -> Void
    @State private var isLoading = false
    
    var body: some View {
        Button {
            Task {
                isLoading = true
                await action()
                isLoading = false
            }
        } label: {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: isFollowing ? "person.crop.circle.badge.checkmark" : "person.crop.circle.badge.plus")
                    Text(isFollowing ? "Following" : "Follow")
                }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(isFollowing ? RadarSecondaryButtonStyle() : RadarPrimaryButtonStyle())
        .disabled(isLoading)
    }
}
```

### 4. Activity Feed

```swift
// radar-ios/Views/Activity/ActivityFeedView.swift
import SwiftUI

struct ActivityFeedView: View {
    @StateObject private var viewModel = ActivityFeedViewModel()
    @State private var selectedFilter: ActivityFilter = .all
    
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.activities) { activity in
                        ActivityRow(activity: activity)
                            .transition(.opacity)
                        
                        Divider()
                            .padding(.leading, 60)
                    }
                    
                    if viewModel.isLoading {
                        ProgressView()
                            .padding()
                    }
                }
            }
            .navigationTitle("Activity")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        ForEach(ActivityFilter.allCases, id: \.self) { filter in
                            Button(action: { selectedFilter = filter }) {
                                Label(filter.displayName, systemImage: filter.icon)
                            }
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .onAppear {
                viewModel.startRealTimeUpdates()
            }
            .onDisappear {
                viewModel.stopRealTimeUpdates()
            }
        }
    }
}

struct ActivityRow: View {
    let activity: Activity
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar
            AsyncImage(url: activity.actor.avatarURL) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Circle()
                    .fill(Color.radarMuted.opacity(0.3))
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                // Activity text
                Text(activity.attributedText)
                    .font(.subheadline)
                
                // Timestamp
                Text(activity.timestamp.relativeTime)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Context card if applicable
                if let context = activity.context {
                    ActivityContextCard(context: context)
                        .padding(.top, 8)
                }
            }
            
            Spacer()
            
            // Action button if applicable
            if let action = activity.suggestedAction {
                ActivityActionButton(action: action)
            }
        }
        .padding()
    }
}

struct ActivityContextCard: View {
    let context: ActivityContext
    
    var body: some View {
        switch context {
        case .radar(let radar):
            MiniRadarCard(radar: radar)
        case .opinion(let opinion):
            MiniOpinionCard(opinion: opinion)
        case .user(let user):
            MiniUserCard(user: user)
        }
    }
}
```

### 5. Community Engagement

```swift
// radar-ios/Views/Community/CommunityEngagementView.swift
import SwiftUI

struct RadarCommentsView: View {
    let radarId: String
    @StateObject private var viewModel = CommentsViewModel()
    @State private var newComment = ""
    @FocusState private var isCommentFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Comments list
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    ForEach(viewModel.comments) { comment in
                        CommentView(
                            comment: comment,
                            onReply: { replyTo in
                                viewModel.replyingTo = replyTo
                                isCommentFocused = true
                            }
                        )
                    }
                }
                .padding()
            }
            
            Divider()
            
            // Comment input
            HStack(alignment: .bottom, spacing: 12) {
                // User avatar
                if let currentUser = AuthManager.shared.currentUser {
                    AsyncImage(url: currentUser.avatarURL) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Circle()
                            .fill(Color.radarMuted.opacity(0.3))
                    }
                    .frame(width: 32, height: 32)
                    .clipShape(Circle())
                }
                
                // Input field
                VStack(alignment: .leading, spacing: 4) {
                    if let replyingTo = viewModel.replyingTo {
                        HStack {
                            Text("Replying to @\(replyingTo.author.username)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Button(action: { viewModel.replyingTo = nil }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                        }
                    }
                    
                    TextField("Add a comment...", text: $newComment, axis: .vertical)
                        .textFieldStyle(.plain)
                        .focused($isCommentFocused)
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.radarSurface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.radarBorder, lineWidth: 1)
                        )
                )
                
                // Send button
                Button(action: postComment) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(newComment.isEmpty ? .secondary : .radarAccent)
                }
                .disabled(newComment.isEmpty)
            }
            .padding()
        }
        .task {
            await viewModel.loadComments(for: radarId)
        }
    }
    
    private func postComment() {
        Task {
            await viewModel.postComment(newComment)
            newComment = ""
            isCommentFocused = false
        }
    }
}

struct CommentView: View {
    let comment: Comment
    let onReply: (Comment) -> Void
    @State private var isLiked = false
    @State private var showingReplies = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                AsyncImage(url: comment.author.avatarURL) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(Color.radarMuted.opacity(0.3))
                }
                .frame(width: 32, height: 32)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(comment.author.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Text(comment.timestamp.relativeTime)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            // Content
            Text(comment.content)
                .font(.subheadline)
                .fixedSize(horizontal: false, vertical: true)
            
            // Actions
            HStack(spacing: 20) {
                // Like
                Button(action: { toggleLike() }) {
                    HStack(spacing: 4) {
                        Image(systemName: isLiked ? "heart.fill" : "heart")
                            .font(.caption)
                        Text("\(comment.likeCount)")
                            .font(.caption)
                    }
                    .foregroundColor(isLiked ? .red : .secondary)
                }
                .buttonStyle(PlainButtonStyle())
                
                // Reply
                Button(action: { onReply(comment) }) {
                    Text("Reply")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .buttonStyle(PlainButtonStyle())
                
                // Show replies
                if comment.replyCount > 0 {
                    Button(action: { showingReplies.toggle() }) {
                        HStack(spacing: 4) {
                            Text("\(comment.replyCount) \(comment.replyCount == 1 ? "reply" : "replies")")
                            Image(systemName: showingReplies ? "chevron.up" : "chevron.down")
                        }
                        .font(.caption)
                        .foregroundColor(.radarAccent)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            
            // Replies
            if showingReplies {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(comment.replies) { reply in
                        CommentView(comment: reply, onReply: onReply)
                            .padding(.leading, 32)
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
    
    private func toggleLike() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            isLiked.toggle()
            HapticManager.shared.impact(.light)
        }
    }
}
```

## Dependencies

- Agent 2 (API Integration) - For fetching social data
- Agent 4 (UI/UX) - For UI components and animations

## Testing Strategy

1. **Unit Tests**
   - Test social data models
   - Test engagement calculations
   - Test filtering logic

2. **Integration Tests**
   - Test following/unfollowing
   - Test activity feed updates
   - Test comment posting

3. **UI Tests**
   - Test explore navigation
   - Test profile interactions
   - Test real-time updates

## Security Considerations

1. **Privacy**: Respect user privacy settings
2. **Content Moderation**: Implement reporting system
3. **Rate Limiting**: Prevent spam and abuse
4. **Data Validation**: Sanitize user-generated content

## Effort Estimate

8-10 developer days

## Success Metrics

- [ ] Trending topics functional
- [ ] Public radar exploration working
- [ ] User profiles complete
- [ ] Following system implemented
- [ ] Activity feed real-time
- [ ] Comments and engagement working
- [ ] Search functionality accurate
- [ ] < 500ms load time for feeds
- [ ] Smooth infinite scrolling
- [ ] No privacy leaks