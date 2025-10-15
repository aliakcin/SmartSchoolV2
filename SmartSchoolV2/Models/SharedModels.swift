import Foundation

// A generic structure for decoding error messages from the API
struct ErrorResponse: Codable {
    let error: String
}