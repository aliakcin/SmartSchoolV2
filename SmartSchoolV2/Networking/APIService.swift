import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case decodingError(Error)
    case serverError(statusCode: Int, message: String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The URL for the request was invalid."
        case .requestFailed(let error):
            return "The network request failed. Please check your connection and if the server is running. (\(error.localizedDescription))"
        case .invalidResponse:
            return "The server returned an invalid or unexpected response."
        case .decodingError(let error):
            let description = String(describing: error)
            return "Failed to decode the server's response. The data format might be incorrect. \(description)"
        case .serverError(let statusCode, let message):
            return "Server returned an error with status code \(statusCode): \(message)"
        }
    }
}

class APIService {
    static let shared = APIService()
    private let baseURL = "http://localhost:3000/api"
    
    // Custom JSON decoder for handling ISO8601 date format
    private var jsonDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }

    private init() {}

    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        token: String?
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = body
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "No error message from server."
                throw APIError.serverError(statusCode: httpResponse.statusCode, message: errorMessage)
            }

            do {
                let decodedData = try jsonDecoder.decode(T.self, from: data)
                return decodedData
            } catch {
                throw APIError.decodingError(error)
            }
        } catch {
            throw APIError.requestFailed(error)
        }
    }
    
    // Specific function to fetch period definitions
    func getPeriodDefinitions(schoolCode: String, academicPeriod: String, token: String) async throws -> [PeriodDef] {
        let endpoint = "/period-definitions/\(schoolCode)/\(academicPeriod)"
        print("Fetching period definitions from: \(baseURL)\(endpoint)")
        return try await request(endpoint: endpoint, token: token)
    }
    
    // Function to fetch user's timetable
    func getMySchedule(token: String) async throws -> [TimetableEntry] {
        let endpoint = "/timetable/my-schedule"
        print("Fetching timetable from: \(baseURL)\(endpoint)")
        return try await request(endpoint: endpoint, token: token)
    }

    // Function to get CourseKey for a given course name
    func getCourseKey(courseName: String, academicPeriod: String, token: String) async throws -> Int? {
        let endpoint = "/course/key?courseName=\(courseName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")&academicPeriod=\(academicPeriod)"
        struct CourseKeyResponse: Decodable {
            let CourseKey: Int
        }
        let response: CourseKeyResponse = try await request(endpoint: endpoint, token: token)
        return response.CourseKey
    }
    
    // Function to get students for a class session
    func getStudentsForClass(courseKey: Int, classList: String, academicPeriod: String, token: String) async throws -> [StudentData] {
        let endpoint = "/students/class?courseKey=\(courseKey)&classList=\(classList.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")&academicPeriod=\(academicPeriod)"
        return try await request(endpoint: endpoint, token: token)
    }
    
    // Function to get the server time from the health endpoint
    func getServerTime() async throws -> Date {
        let healthResponse: HealthResponse = try await request(endpoint: "/health", token: nil)
        return healthResponse.timestamp
    }
}