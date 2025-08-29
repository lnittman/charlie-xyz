# Agent 2: Real API Integration
*"Replace mock data with real API endpoints and implement robust networking layer"*

## Scope

This agent will replace all mock data and placeholder API calls with real API integration, implement a robust networking layer with proper error handling, caching, retry logic, and offline support. It includes type-safe API client generation, request/response interceptors, and comprehensive error handling.

## Packages to modify

- `Packages/RadarAPI` - Complete overhaul with real endpoints
- `Packages/RadarCore/Sources/RadarCore/Models/` - Update models to match API
- `Packages/RadarCache` - New package for caching layer
- `radar-ios/Services/` - Update all service implementations

## Implementation Details

### 1. API Client Configuration

```swift
// Packages/RadarAPI/Sources/RadarAPI/Core/APIClient.swift
import Foundation
import Combine

public final class APIClient {
    public static let shared = APIClient()
    
    private let baseURL: URL
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    // Request interceptors
    private var requestInterceptors: [RequestInterceptor] = []
    private var responseInterceptors: [ResponseInterceptor] = []
    
    private init() {
        // Configure base URL from environment
        self.baseURL = URL(string: ProcessInfo.processInfo.environment["API_URL"] ?? "https://api.radar.app")!
        
        // Configure URLSession with custom configuration
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        
        self.session = URLSession(configuration: configuration)
        
        // Configure JSON coders
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        
        // Add default interceptors
        setupInterceptors()
    }
    
    private func setupInterceptors() {
        // Auth interceptor
        requestInterceptors.append(AuthInterceptor())
        
        // Retry interceptor
        responseInterceptors.append(RetryInterceptor(maxRetries: 3))
        
        // Error mapping interceptor
        responseInterceptors.append(ErrorMappingInterceptor())
        
        // Logging interceptor (debug only)
        #if DEBUG
        requestInterceptors.append(LoggingInterceptor())
        #endif
    }
}
```

### 2. Type-Safe Endpoints

```swift
// Packages/RadarAPI/Sources/RadarAPI/Endpoints/RadarEndpoints.swift
import Foundation

public enum RadarEndpoint {
    // Radar operations
    case createRadar(CreateRadarRequest)
    case getRadar(id: String)
    case listRadars(ListRadarsRequest)
    case updateRadar(id: String, UpdateRadarRequest)
    case deleteRadar(id: String)
    case refreshOpinions(id: String)
    
    // Opinion operations
    case getOpinions(radarId: String, GetOpinionsRequest)
    case voteOpinion(id: String, VoteRequest)
    
    // User operations
    case getProfile
    case updateProfile(UpdateProfileRequest)
    case getPreferences
    case updatePreferences(UpdatePreferencesRequest)
    
    // Discovery
    case getTrending(GetTrendingRequest)
    case getPublicRadars(GetPublicRadarsRequest)
    case getSuggestions
}

extension RadarEndpoint {
    var path: String {
        switch self {
        case .createRadar:
            return "/api/radars"
        case .getRadar(let id), .updateRadar(let id, _), .deleteRadar(let id):
            return "/api/radars/\(id)"
        case .listRadars:
            return "/api/radars"
        case .refreshOpinions(let id):
            return "/api/radars/\(id)/refresh"
        case .getOpinions(let radarId, _):
            return "/api/radars/\(radarId)/opinions"
        case .voteOpinion(let id, _):
            return "/api/opinions/\(id)/vote"
        case .getProfile, .updateProfile:
            return "/api/users/me"
        case .getPreferences, .updatePreferences:
            return "/api/users/me/preferences"
        case .getTrending:
            return "/api/trending"
        case .getPublicRadars:
            return "/api/radars/public"
        case .getSuggestions:
            return "/api/suggestions"
        }
    }
    
    var method: HTTPMethod {
        switch self {
        case .createRadar, .voteOpinion, .refreshOpinions:
            return .post
        case .updateRadar, .updateProfile, .updatePreferences:
            return .patch
        case .deleteRadar:
            return .delete
        case .getRadar, .listRadars, .getOpinions, .getProfile, .getPreferences, .getTrending, .getPublicRadars, .getSuggestions:
            return .get
        }
    }
}
```

### 3. Request/Response Models

```swift
// Packages/RadarAPI/Sources/RadarAPI/Models/Requests.swift
import Foundation

public struct CreateRadarRequest: Codable {
    public let topic: String
    public let position: RadarPosition?
    public let isPublic: Bool
    
    public init(topic: String, position: RadarPosition? = nil, isPublic: Bool = false) {
        self.topic = topic
        self.position = position
        self.isPublic = isPublic
    }
}

public struct ListRadarsRequest: Codable {
    public let page: Int
    public let limit: Int
    public let status: RadarStatus?
    public let sortBy: SortOption?
    
    public enum SortOption: String, Codable {
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case opinionCount = "opinion_count"
    }
}

// Packages/RadarAPI/Sources/RadarAPI/Models/Responses.swift
public struct PaginatedResponse<T: Codable>: Codable {
    public let data: [T]
    public let meta: PaginationMeta
}

public struct PaginationMeta: Codable {
    public let page: Int
    public let limit: Int
    public let total: Int
    public let totalPages: Int
}

public struct ErrorResponse: Codable {
    public let error: ErrorDetail
}

public struct ErrorDetail: Codable {
    public let code: String
    public let message: String
    public let details: [String: AnyDecodable]?
}
```

### 4. Network Service Implementation

```swift
// Packages/RadarAPI/Sources/RadarAPI/Services/RadarService.swift
import Foundation
import Combine

public protocol RadarServiceProtocol {
    func createRadar(_ request: CreateRadarRequest) async throws -> Radar
    func getRadar(id: String) async throws -> Radar
    func listRadars(_ request: ListRadarsRequest) async throws -> PaginatedResponse<Radar>
    func updateRadar(id: String, _ request: UpdateRadarRequest) async throws -> Radar
    func deleteRadar(id: String) async throws
    func refreshOpinions(radarId: String) async throws -> [Opinion]
}

public final class RadarService: RadarServiceProtocol {
    private let apiClient: APIClient
    private let cache: CacheManager
    
    public init(apiClient: APIClient = .shared, cache: CacheManager = .shared) {
        self.apiClient = apiClient
        self.cache = cache
    }
    
    public func createRadar(_ request: CreateRadarRequest) async throws -> Radar {
        let radar = try await apiClient.request(
            endpoint: .createRadar(request),
            responseType: Radar.self
        )
        
        // Update cache
        await cache.store(radar, for: CacheKey.radar(radar.id))
        
        return radar
    }
    
    public func getRadar(id: String) async throws -> Radar {
        // Check cache first
        if let cached: Radar = await cache.retrieve(for: CacheKey.radar(id)) {
            // Return cached if fresh (< 5 minutes old)
            if cached.isFresh {
                return cached
            }
        }
        
        // Fetch from API
        let radar = try await apiClient.request(
            endpoint: .getRadar(id: id),
            responseType: Radar.self
        )
        
        // Update cache
        await cache.store(radar, for: CacheKey.radar(id))
        
        return radar
    }
    
    public func listRadars(_ request: ListRadarsRequest) async throws -> PaginatedResponse<Radar> {
        let response = try await apiClient.request(
            endpoint: .listRadars(request),
            responseType: PaginatedResponse<Radar>.self
        )
        
        // Cache individual radars
        for radar in response.data {
            await cache.store(radar, for: CacheKey.radar(radar.id))
        }
        
        return response
    }
}
```

### 5. Interceptors

```swift
// Packages/RadarAPI/Sources/RadarAPI/Interceptors/AuthInterceptor.swift
import Foundation
import Clerk

struct AuthInterceptor: RequestInterceptor {
    func intercept(_ request: inout URLRequest) async throws {
        // Get auth token from Clerk
        guard let token = try? await Clerk.shared.session?.getToken() else {
            throw APIError.unauthorized
        }
        
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios", forHTTPHeaderField: "X-Platform")
    }
}

// Packages/RadarAPI/Sources/RadarAPI/Interceptors/RetryInterceptor.swift
struct RetryInterceptor: ResponseInterceptor {
    let maxRetries: Int
    
    func intercept(_ response: URLResponse, data: Data?, error: Error?) async throws -> (URLResponse, Data?) {
        // Check if we should retry
        if let httpResponse = response as? HTTPURLResponse {
            switch httpResponse.statusCode {
            case 500...599:
                // Server errors - retry with exponential backoff
                throw RetryableError(underlyingError: error)
            case 429:
                // Rate limited - retry after delay
                if let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After") {
                    throw RateLimitError(retryAfter: Int(retryAfter) ?? 60)
                }
            default:
                break
            }
        }
        
        return (response, data)
    }
}
```

### 6. Offline Support & Caching

```swift
// Packages/RadarCache/Sources/RadarCache/CacheManager.swift
import Foundation
import CoreData

public actor CacheManager {
    public static let shared = CacheManager()
    
    private let container: NSPersistentContainer
    private let memoryCache = NSCache<NSString, CacheEntry>()
    
    private init() {
        container = NSPersistentContainer(name: "RadarCache")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Failed to load cache store: \(error)")
            }
        }
    }
    
    public func store<T: Codable>(_ object: T, for key: CacheKey) async {
        let entry = CacheEntry(
            key: key.rawValue,
            data: try? JSONEncoder().encode(object),
            timestamp: Date(),
            expiresAt: Date().addingTimeInterval(key.ttl)
        )
        
        // Store in memory
        memoryCache.setObject(entry, forKey: key.rawValue as NSString)
        
        // Store in CoreData
        await container.performBackgroundTask { context in
            let entity = CacheEntity(context: context)
            entity.key = entry.key
            entity.data = entry.data
            entity.timestamp = entry.timestamp
            entity.expiresAt = entry.expiresAt
            
            try? context.save()
        }
    }
    
    public func retrieve<T: Codable>(for key: CacheKey, type: T.Type = T.self) async -> T? {
        // Check memory cache first
        if let entry = memoryCache.object(forKey: key.rawValue as NSString),
           entry.isValid {
            return try? JSONDecoder().decode(type, from: entry.data ?? Data())
        }
        
        // Check persistent cache
        let request = CacheEntity.fetchRequest()
        request.predicate = NSPredicate(format: "key == %@", key.rawValue)
        request.fetchLimit = 1
        
        return await container.performBackgroundTask { context in
            guard let entity = try? context.fetch(request).first,
                  let data = entity.data,
                  entity.expiresAt ?? Date() > Date() else {
                return nil
            }
            
            // Update memory cache
            let entry = CacheEntry(
                key: entity.key ?? "",
                data: data,
                timestamp: entity.timestamp ?? Date(),
                expiresAt: entity.expiresAt
            )
            self.memoryCache.setObject(entry, forKey: key.rawValue as NSString)
            
            return try? JSONDecoder().decode(type, from: data)
        }
    }
}
```

### 7. Streaming Support (Server-Sent Events)

```swift
// Packages/RadarAPI/Sources/RadarAPI/Streaming/EventStreamClient.swift
import Foundation
import Combine

public class EventStreamClient {
    private var eventSource: URLSessionDataTask?
    private let session: URLSession
    
    public init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = .infinity
        self.session = URLSession(configuration: configuration)
    }
    
    public func stream(from url: URL) -> AsyncThrowingStream<ServerEvent, Error> {
        AsyncThrowingStream { continuation in
            var request = URLRequest(url: url)
            request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
            request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
            
            self.eventSource = session.dataTask(with: request) { data, response, error in
                if let error = error {
                    continuation.finish(throwing: error)
                    return
                }
                
                guard let data = data,
                      let string = String(data: data, encoding: .utf8) else {
                    return
                }
                
                // Parse SSE format
                let lines = string.components(separatedBy: "\n")
                var eventType: String?
                var eventData = ""
                
                for line in lines {
                    if line.hasPrefix("event:") {
                        eventType = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
                    } else if line.hasPrefix("data:") {
                        eventData = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
                    } else if line.isEmpty && !eventData.isEmpty {
                        // End of event
                        let event = ServerEvent(
                            type: eventType ?? "message",
                            data: eventData
                        )
                        continuation.yield(event)
                        eventData = ""
                        eventType = nil
                    }
                }
            }
            
            eventSource?.resume()
            
            continuation.onTermination = { _ in
                self.eventSource?.cancel()
            }
        }
    }
}
```

### 8. Error Handling

```swift
// Packages/RadarAPI/Sources/RadarAPI/Errors/APIError.swift
import Foundation

public enum APIError: LocalizedError {
    case networkError(Error)
    case decodingError(Error)
    case serverError(statusCode: Int, message: String?)
    case unauthorized
    case rateLimited(retryAfter: Int)
    case validationError(errors: [String: [String]])
    case unknown
    
    public var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError:
            return "Failed to decode response"
        case .serverError(let statusCode, let message):
            return message ?? "Server error: \(statusCode)"
        case .unauthorized:
            return "Authentication required"
        case .rateLimited(let retryAfter):
            return "Rate limited. Try again in \(retryAfter) seconds"
        case .validationError(let errors):
            return errors.values.flatMap { $0 }.joined(separator: ", ")
        case .unknown:
            return "An unknown error occurred"
        }
    }
    
    public var recoverySuggestion: String? {
        switch self {
        case .networkError:
            return "Check your internet connection"
        case .unauthorized:
            return "Please sign in again"
        case .rateLimited:
            return "Please wait before trying again"
        default:
            return nil
        }
    }
}
```

## Dependencies

- Agent 1 (Authentication) - For auth tokens and user session

## Testing Strategy

1. **Unit Tests**
   - Test endpoint construction
   - Test request/response encoding
   - Test interceptors
   - Test error handling

2. **Integration Tests**
   - Test actual API calls (staging environment)
   - Test caching behavior
   - Test offline scenarios
   - Test streaming endpoints

3. **Performance Tests**
   - Test response times
   - Test cache hit rates
   - Test concurrent requests

## Security Considerations

1. **Certificate Pinning**: Implement for all API calls
2. **Request Signing**: Add request signature for sensitive operations
3. **Token Security**: Never log auth tokens
4. **Data Encryption**: Encrypt cache data at rest
5. **Network Security**: Force TLS 1.3 minimum

## Effort Estimate

6-8 developer days

## Success Metrics

- [ ] All mock data replaced with API calls
- [ ] Robust error handling implemented
- [ ] Offline support with caching
- [ ] Streaming endpoints working
- [ ] Request retry logic implemented
- [ ] < 200ms average response time (cached)
- [ ] < 1s average response time (network)
- [ ] 99% success rate for API calls
- [ ] Zero data corruption issues
- [ ] Comprehensive test coverage