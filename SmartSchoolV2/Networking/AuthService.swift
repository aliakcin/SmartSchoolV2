//
//  AuthService.swift
//  SmartSchoolV2
//
//  Created by Developer on 2025.
//

import Foundation

// MARK: - Data Models
struct LoginRequest: Codable {
    let username: String
    let password: String
    let schoolCode: String?
}

struct LoginResponse: Codable {
    let message: String
    let user: User
}

class AuthService {
    static let shared = AuthService()
    private let baseURL = "http://localhost:3000/api/auth"
    
    private init() {}
    
    func login(username: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/login") else {
            completion(.failure(AuthError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["username": username, "password": password]
        
        do {
            request.httpBody = try JSONEncoder().encode(body)
        } catch {
            completion(.failure(AuthError.encodingError))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(AuthError.noData))
                return
            }
            
            // Debugging: Print the raw server response
            if let responseString = String(data: data, encoding: .utf8) {
                print("Server Response: \(responseString)")
            }

            do {
                // First, try to decode the expected success response
                let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
                completion(.success(loginResponse.user))
            } catch {
                // If that fails, try to decode the error response
                do {
                    let errorResponse = try JSONDecoder().decode(ErrorResponse.self, from: data)
                    completion(.failure(AuthError.serverError(message: errorResponse.error)))
                } catch {
                    // If both fail, it's a generic decoding error
                    completion(.failure(AuthError.decodingError))
                }
            }
        }.resume()
    }
}

enum AuthError: Error, LocalizedError {
    case invalidURL
    case encodingError
    case noData
    case decodingError
    case serverError(message: String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The URL for the request was invalid."
        case .encodingError:
            return "Failed to encode the request body."
        case .noData:
            return "No data was received from the server."
        case .decodingError:
            return "Failed to decode the server's response."
        case .serverError(let message):
            return message // Return the specific error message from the server
        }
    }
}