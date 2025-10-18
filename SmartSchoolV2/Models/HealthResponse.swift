import Foundation

struct HealthResponse: Codable {
    let status: String
    let message: String
    let timestamp: Date
}