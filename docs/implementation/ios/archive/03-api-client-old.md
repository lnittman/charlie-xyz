# Agent 3: API Client & Networking
*"Build a robust API client that mirrors the web app's service layer"*

## Scope

This agent creates a comprehensive networking layer that communicates with the Radar API, implementing proper error handling, caching, offline support, and real-time updates. The API client mirrors the service patterns from the web app while leveraging native iOS networking capabilities.

## Packages to modify

- `radar-apple/Packages/RadarAPI` - New API client package
- `radar-apple/Packages/RadarCore` - Core models and business logic
- `radar-apple/Radar/App` - Integration points

## Implementation Details

### 1. Package Structure

```swift
// Packages/RadarAPI/Package.swift
// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "RadarAPI",
    platforms: [.iOS(.v17)],
    products: [
        .library(
            name: "RadarAPI",
            targets: ["RadarAPI"]
        ),
    ],
    dependencies: [
        .package(path: "../RadarCore"),
        .package(path: "../RadarAuth")
    ],
    targets: [
        .target(
            name: "RadarAPI",
            dependencies: ["RadarCore", "RadarAuth"]
        ),
        .testTarget(
            name: "RadarAPITests",
            dependencies: ["RadarAPI"]
        ),
    ]
)

// Packages/RadarCore/Package.swift
let package = Package(
    name: "RadarCore",
    platforms: [.iOS(.v17)],
    products: [
        .library(
            name: "RadarCore",
            targets: ["RadarCore"]
        ),
    ],
    targets: [
        .target(name: "RadarCore"),
        .testTarget(
            name: "RadarCoreTests",
            dependencies: ["RadarCore"]
        ),
    ]
)
```

### 2. Core Models

```swift
// Packages/RadarCore/Sources/RadarCore/Models/Radar.swift
import Foundation

public struct Radar: Codable, Identifiable, Hashable {
    public let id: String
    public let userId: String
    public let topic: String
    public let interpretation: Interpretation
    public let position: Position
    public let opinions: [Opinion]
    public let lastPolledAt: Date
    public let refreshCount: Int
    public let createdAt: Date
    public let updatedAt: Date
    public let isPublic: Bool
    
    public init(
        id: String,
        userId: String,
        topic: String,
        interpretation: Interpretation,
        position: Position,
        opinions: [Opinion] = [],
        lastPolledAt: Date = Date(),
        refreshCount: Int = 0,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        isPublic: Bool = false
    ) {
        self.id = id
        self.userId = userId
        self.topic = topic
        self.interpretation = interpretation
        self.position = position
        self.opinions = opinions
        self.lastPolledAt = lastPolledAt
        self.refreshCount = refreshCount
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isPublic = isPublic
    }
    
    public enum Position: String, Codable, CaseIterable {
        case `for` = "for"
        case against = "against"
        case neutral = "neutral"
        
        public var displayName: String {
            switch self {
            case .for: return "For"
            case .against: return "Against"
            case .neutral: return "Neutral"
            }
        }
        
        public var color: String {
            switch self {
            case .for: return "green"
            case .against: return "red"
            case .neutral: return "gray"
            }
        }
    }
}

// Packages/RadarCore/Sources/RadarCore/Models/Opinion.swift
public struct Opinion: Codable, Identifiable, Hashable {
    public let id: String
    public let radarId: String
    public let author: String
    public let model: String
    public let content: String
    public let stance: Radar.Position
    public let confidence: Double
    public let reasoning: String?
    public let createdAt: Date
    
    public init(
        id: String,
        radarId: String,
        author: String,
        model: String,
        content: String,
        stance: Radar.Position,
        confidence: Double,
        reasoning: String? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.radarId = radarId
        self.author = author
        self.model = model
        self.content = content
        self.stance = stance
        self.confidence = confidence
        self.reasoning = reasoning
        self.createdAt = createdAt
    }
}

// Packages/RadarCore/Sources/RadarCore/Models/Interpretation.swift
public struct Interpretation: Codable, Hashable {
    public let text: String
    public let category: String
    public let subCategory: String?
    public let tags: [String]
    public let sentiment: Sentiment
    
    public enum Sentiment: String, Codable {
        case positive
        case negative
        case neutral
        case mixed
    }
}

// Packages/RadarCore/Sources/RadarCore/Models/Trend.swift
public struct Trend: Codable, Identifiable {
    public let id: String
    public let radarId: String
    public let data: [TrendPoint]
    
    public struct TrendPoint: Codable {
        public let date: Date
        public let forCount: Int
        public let againstCount: Int
        public let neutralCount: Int
        public let totalOpinions: Int
        public let averageConfidence: Double
    }
}
```

### 3. API Client Implementation

```swift
// Packages/RadarAPI/Sources/RadarAPI/APIClient.swift
import Foundation
import RadarCore
import RadarAuth
import Combine

@MainActor
public class APIClient: ObservableObject {
    public static let shared = APIClient()
    
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    @Published public var isLoading = false
    @Published public var error: APIError?
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        self.baseURL = URL(string: ProcessInfo.processInfo.environment["API_URL"] ?? "https://api.radar.app")!
        
        // Configure URLSession
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        config.requestCachePolicy = .returnCacheDataElseLoad
        
        self.session = URLSession(configuration: config)
        
        // Configure JSON coders
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Radar Operations
    
    public func fetchRadars(limit: Int = 20, offset: Int = 0) async throws -> [Radar] {
        let endpoint = Endpoint.radars(limit: limit, offset: offset)
        return try await request(endpoint)
    }
    
    public func fetchRadar(id: String) async throws -> Radar {
        let endpoint = Endpoint.radar(id: id)
        return try await request(endpoint)
    }
    
    public func createRadar(topic: String) async throws -> Radar {
        let endpoint = Endpoint.createRadar
        let body = CreateRadarRequest(topic: topic)
        return try await request(endpoint, body: body)
    }
    
    public func deleteRadar(id: String) async throws {
        let endpoint = Endpoint.deleteRadar(id: id)
        let _: EmptyResponse = try await request(endpoint)
    }
    
    public func refreshRadar(id: String) async throws -> Radar {
        let endpoint = Endpoint.refreshRadar(id: id)
        return try await request(endpoint, method: .post)
    }
    
    // MARK: - Opinion Operations
    
    public func fetchOpinions(radarId: String) async throws -> [Opinion] {
        let endpoint = Endpoint.opinions(radarId: radarId)
        return try await request(endpoint)
    }
    
    // MARK: - Trend Operations
    
    public func fetchTrends(radarId: String, days: Int = 7) async throws -> Trend {
        let endpoint = Endpoint.trends(radarId: radarId, days: days)
        return try await request(endpoint)
    }
    
    // MARK: - Real-time Interpretation
    
    public func interpretTopic(_ topic: String) async throws -> Interpretation {
        let endpoint = Endpoint.interpret
        let body = InterpretRequest(topic: topic)
        return try await request(endpoint, body: body)
    }
    
    // MARK: - Private Methods
    
    private func request<T: Decodable>(
        _ endpoint: Endpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil
    ) async throws -> T {
        var request = URLRequest(url: endpoint.url(baseURL: baseURL))
        request.httpMethod = method.rawValue
        
        // Add headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let token = await AuthManager.shared.sessionToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if present
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }
        
        // Add request ID for tracing
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                return try decoder.decode(T.self, from: data)
            case 401:
                throw APIError.unauthorized
            case 429:
                throw APIError.rateLimitExceeded
            default:
                if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
                    throw APIError.serverError(errorResponse.message)
                }
                throw APIError.httpError(httpResponse.statusCode)
            }
        } catch let error as APIError {
            self.error = error
            throw error
        } catch {
            let apiError = APIError.networkError(error)
            self.error = apiError
            throw apiError
        }
    }
}

// MARK: - Endpoints

enum Endpoint {
    case radars(limit: Int, offset: Int)
    case radar(id: String)
    case createRadar
    case deleteRadar(id: String)
    case refreshRadar(id: String)
    case opinions(radarId: String)
    case trends(radarId: String, days: Int)
    case interpret
    
    func url(baseURL: URL) -> URL {
        switch self {
        case .radars(let limit, let offset):
            return baseURL
                .appendingPathComponent("api/radars")
                .appending(queryItems: [
                    URLQueryItem(name: "limit", value: "\(limit)"),
                    URLQueryItem(name: "offset", value: "\(offset)")
                ])
            
        case .radar(let id):
            return baseURL
                .appendingPathComponent("api/radars")
                .appendingPathComponent(id)
            
        case .createRadar:
            return baseURL
                .appendingPathComponent("api/radars")
            
        case .deleteRadar(let id):
            return baseURL
                .appendingPathComponent("api/radars")
                .appendingPathComponent(id)
            
        case .refreshRadar(let id):
            return baseURL
                .appendingPathComponent("api/radars")
                .appendingPathComponent(id)
                .appendingPathComponent("refresh")
            
        case .opinions(let radarId):
            return baseURL
                .appendingPathComponent("api/radars")
                .appendingPathComponent(radarId)
                .appendingPathComponent("opinions")
            
        case .trends(let radarId, let days):
            return baseURL
                .appendingPathComponent("api/radars")
                .appendingPathComponent(radarId)
                .appendingPathComponent("trends")
                .appending(queryItems: [
                    URLQueryItem(name: "days", value: "\(days)")
                ])
            
        case .interpret:
            return baseURL
                .appendingPathComponent("api/interpret")
        }
    }
}

// MARK: - HTTP Method

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

// MARK: - Request/Response Models

struct CreateRadarRequest: Encodable {
    let topic: String
}

struct InterpretRequest: Encodable {
    let topic: String
}

struct ErrorResponse: Decodable {
    let message: String
    let code: String?
}

struct EmptyResponse: Decodable {}

// MARK: - Errors

public enum APIError: LocalizedError {
    case invalidResponse
    case unauthorized
    case rateLimitExceeded
    case httpError(Int)
    case serverError(String)
    case networkError(Error)
    case decodingError(Error)
    
    public var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Please sign in to continue"
        case .rateLimitExceeded:
            return "Too many requests. Please try again later"
        case .httpError(let code):
            return "Server error: \(code)"
        case .serverError(let message):
            return message
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Data error: \(error.localizedDescription)"
        }
    }
}
```

### 4. Caching Layer

```swift
// Packages/RadarAPI/Sources/RadarAPI/CacheManager.swift
import Foundation
import RadarCore

actor CacheManager {
    private let cache = NSCache<NSString, CacheEntry>()
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    init() {
        let documentsDirectory = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first!
        self.cacheDirectory = documentsDirectory.appendingPathComponent("RadarCache")
        
        // Create cache directory if needed
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        
        // Configure memory cache
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024 // 50MB
    }
    
    // MARK: - Memory Cache
    
    func get<T: Decodable>(_ key: String, type: T.Type) async -> T? {
        if let entry = cache.object(forKey: key as NSString) {
            if !entry.isExpired {
                return try? JSONDecoder().decode(T.self, from: entry.data)
            } else {
                cache.removeObject(forKey: key as NSString)
            }
        }
        
        // Fall back to disk cache
        return await getDiskCache(key, type: type)
    }
    
    func set<T: Encodable>(_ object: T, for key: String, ttl: TimeInterval = 300) async {
        guard let data = try? JSONEncoder().encode(object) else { return }
        
        let entry = CacheEntry(data: data, expiresAt: Date().addingTimeInterval(ttl))
        cache.setObject(entry, forKey: key as NSString, cost: data.count)
        
        // Also save to disk for persistence
        await setDiskCache(data, for: key, ttl: ttl)
    }
    
    func remove(_ key: String) async {
        cache.removeObject(forKey: key as NSString)
        await removeDiskCache(key)
    }
    
    func clear() async {
        cache.removeAllObjects()
        await clearDiskCache()
    }
    
    // MARK: - Disk Cache
    
    private func getDiskCache<T: Decodable>(_ key: String, type: T.Type) async -> T? {
        let fileURL = cacheDirectory.appendingPathComponent("\(key).cache")
        
        guard let data = try? Data(contentsOf: fileURL),
              let wrapper = try? JSONDecoder().decode(DiskCacheWrapper.self, from: data),
              !wrapper.isExpired else {
            return nil
        }
        
        return try? JSONDecoder().decode(T.self, from: wrapper.data)
    }
    
    private func setDiskCache(_ data: Data, for key: String, ttl: TimeInterval) async {
        let wrapper = DiskCacheWrapper(data: data, expiresAt: Date().addingTimeInterval(ttl))
        guard let wrapperData = try? JSONEncoder().encode(wrapper) else { return }
        
        let fileURL = cacheDirectory.appendingPathComponent("\(key).cache")
        try? wrapperData.write(to: fileURL)
    }
    
    private func removeDiskCache(_ key: String) async {
        let fileURL = cacheDirectory.appendingPathComponent("\(key).cache")
        try? fileManager.removeItem(at: fileURL)
    }
    
    private func clearDiskCache() async {
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
}

// MARK: - Cache Models

private class CacheEntry: NSObject {
    let data: Data
    let expiresAt: Date
    
    init(data: Data, expiresAt: Date) {
        self.data = data
        self.expiresAt = expiresAt
    }
    
    var isExpired: Bool {
        Date() > expiresAt
    }
}

private struct DiskCacheWrapper: Codable {
    let data: Data
    let expiresAt: Date
    
    var isExpired: Bool {
        Date() > expiresAt
    }
}
```

### 5. WebSocket Support

```swift
// Packages/RadarAPI/Sources/RadarAPI/WebSocketManager.swift
import Foundation
import RadarCore
import Combine

@MainActor
public class WebSocketManager: NSObject, ObservableObject {
    @Published public var isConnected = false
    @Published public var receivedUpdate: RadarUpdate?
    
    private var webSocketTask: URLSessionWebSocketTask?
    private let baseURL: URL
    private var pingTimer: Timer?
    
    public init(baseURL: URL) {
        self.baseURL = baseURL
        super.init()
    }
    
    public func connect(radarId: String) {
        disconnect()
        
        var urlComponents = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        urlComponents.scheme = urlComponents.scheme == "https" ? "wss" : "ws"
        urlComponents.path = "/api/ws/radar/\(radarId)"
        
        guard let url = urlComponents.url else { return }
        
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        
        receive()
        startPing()
        
        isConnected = true
    }
    
    public func disconnect() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        pingTimer?.invalidate()
        pingTimer = nil
        isConnected = false
    }
    
    private func receive() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                Task { @MainActor in
                    self?.handleMessage(message)
                    self?.receive() // Continue receiving
                }
                
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                Task { @MainActor in
                    self?.isConnected = false
                }
            }
        }
    }
    
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            guard let data = text.data(using: .utf8),
                  let update = try? JSONDecoder().decode(RadarUpdate.self, from: data) else {
                return
            }
            receivedUpdate = update
            
        case .data(let data):
            guard let update = try? JSONDecoder().decode(RadarUpdate.self, from: data) else {
                return
            }
            receivedUpdate = update
            
        @unknown default:
            break
        }
    }
    
    private func startPing() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task {
                await self.ping()
            }
        }
    }
    
    private func ping() async {
        webSocketTask?.sendPing { error in
            if let error = error {
                print("WebSocket ping failed: \(error)")
            }
        }
    }
}

// MARK: - URLSessionWebSocketDelegate

extension WebSocketManager: URLSessionWebSocketDelegate {
    public func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("WebSocket connected")
    }
    
    public func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        Task { @MainActor in
            isConnected = false
        }
    }
}

// MARK: - Update Model

public struct RadarUpdate: Codable {
    public let type: UpdateType
    public let radarId: String
    public let data: UpdateData
    
    public enum UpdateType: String, Codable {
        case newOpinion
        case positionChange
        case refresh
    }
    
    public enum UpdateData: Codable {
        case opinion(Opinion)
        case position(Radar.Position)
        case radar(Radar)
    }
}
```

### 6. Service Layer

```swift
// Packages/RadarAPI/Sources/RadarAPI/Services/RadarService.swift
import Foundation
import RadarCore
import Combine

@MainActor
public class RadarService: ObservableObject {
    @Published public var radars: [Radar] = []
    @Published public var isLoading = false
    @Published public var error: Error?
    
    private let apiClient = APIClient.shared
    private let cacheManager = CacheManager()
    private var cancellables = Set<AnyCancellable>()
    
    public init() {}
    
    public func loadRadars(refresh: Bool = false) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Try cache first if not refreshing
            if !refresh,
               let cached: [Radar] = await cacheManager.get("user_radars", type: [Radar].self) {
                self.radars = cached
            }
            
            // Fetch from API
            let radars = try await apiClient.fetchRadars()
            self.radars = radars
            
            // Update cache
            await cacheManager.set(radars, for: "user_radars", ttl: 300)
        } catch {
            self.error = error
            
            // If network error and we have cached data, use it
            if let cached: [Radar] = await cacheManager.get("user_radars", type: [Radar].self) {
                self.radars = cached
            }
        }
    }
    
    public func createRadar(topic: String) async throws -> Radar {
        let radar = try await apiClient.createRadar(topic: topic)
        
        // Update local list
        radars.insert(radar, at: 0)
        
        // Clear cache to force refresh
        await cacheManager.remove("user_radars")
        
        return radar
    }
    
    public func deleteRadar(_ radar: Radar) async throws {
        try await apiClient.deleteRadar(id: radar.id)
        
        // Update local list
        radars.removeAll { $0.id == radar.id }
        
        // Clear cache
        await cacheManager.remove("user_radars")
    }
    
    public func refreshRadar(_ radar: Radar) async throws -> Radar {
        let updated = try await apiClient.refreshRadar(id: radar.id)
        
        // Update local list
        if let index = radars.firstIndex(where: { $0.id == radar.id }) {
            radars[index] = updated
        }
        
        return updated
    }
}
```

## Dependencies

- Agent 1: Design package for UI components
- Agent 2: Auth package for session tokens
- URLSession for networking
- Combine for reactive updates

## Testing Strategy

### Unit Tests
```swift
// RadarAPITests/APIClientTests.swift
import XCTest
@testable import RadarAPI

final class APIClientTests: XCTestCase {
    func testFetchRadars() async throws {
        // Mock URLSession responses
        // Test successful fetch
        // Test error handling
    }
    
    func testCaching() async throws {
        // Test cache hit
        // Test cache expiration
        // Test offline mode
    }
}
```

### Integration Tests
- Real API endpoint testing
- WebSocket connection testing
- Offline/online transitions

## Security Considerations

- TLS 1.3 for all connections
- Certificate pinning for production
- Request signing with auth tokens
- No sensitive data in cache
- Encrypted disk cache (optional)

## Effort Estimate

2 developer days:
- Day 1: Core API client and models
- Day 2: Caching, WebSocket, and service layer

## Success Metrics

- [ ] All API endpoints implemented
- [ ] Proper error handling with user feedback
- [ ] Offline support with caching
- [ ] WebSocket real-time updates work
- [ ] < 2s response time for cached data
- [ ] < 5s response time for API calls
- [ ] Graceful degradation when offline
- [ ] 90%+ test coverage