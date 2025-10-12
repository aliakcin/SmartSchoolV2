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
    
    private let baseURL = "http://localhost:3000/api"
    
    private init() {}
    
    // Real login function - connects to API
    func login(username: String, password: String, completion: @escaping (Result<User, AuthError>) -> Void) {
        // Create login request
        let loginRequest = LoginRequest(username: username, password: password, schoolCode: "SC001")
        
        // Convert to JSON
        guard let jsonData = try? JSONEncoder().encode(loginRequest) else {
            completion(.failure(.serverError))
            return
        }
        
        // Create URL request
        guard let url = URL(string: "\(baseURL)/auth/login") else {
            completion(.failure(.serverError))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        // Perform network request
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle network error
            if let error = error {
                print("Network error: \(error)")
                DispatchQueue.main.async {
                    completion(.failure(.networkError))
                }
                return
            }
            
            // Check HTTP response
            guard let httpResponse = response as? HTTPURLResponse else {
                DispatchQueue.main.async {
                    completion(.failure(.serverError))
                }
                return
            }
            
            // Handle different HTTP status codes
            switch httpResponse.statusCode {
            case 200...299:
                // Success - parse response
                guard let data = data else {
                    DispatchQueue.main.async {
                        completion(.failure(.serverError))
                    }
                    return
                }
                
                do {
                    let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
                    DispatchQueue.main.async {
                        completion(.success(loginResponse.user))
                    }
                } catch {
                    print("JSON parsing error: \(error)")
                    DispatchQueue.main.async {
                        completion(.failure(.serverError))
                    }
                }
                
            case 400:
                DispatchQueue.main.async {
                    completion(.failure(.invalidCredentials))
                }
                
            case 401:
                DispatchQueue.main.async {
                    completion(.failure(.invalidCredentials))
                }
                
            case 403:
                DispatchQueue.main.async {
                    completion(.failure(.invalidCredentials))
                }
                
            case 500:
                DispatchQueue.main.async {
                    completion(.failure(.serverError))
                }
                
            default:
                DispatchQueue.main.async {
                    completion(.failure(.serverError))
                }
            }
        }.resume()
    }
}

enum AuthError: Error, LocalizedError {
    case invalidCredentials
    case networkError
    case serverError
    
    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Invalid username or password"
        case .networkError:
            return "Network error. Please check your connection."
        case .serverError:
            return "Server error. Please try again later."
        }
    }
}
