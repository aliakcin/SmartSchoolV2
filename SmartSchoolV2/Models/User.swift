//
//  User.swift
//  SmartSchoolV2
//
//  Created by Developer on 2025.
//

import Foundation

// User model
struct User: Codable, Identifiable {
    let userId: Int
    let username: String
    let fullName: String
    let role: String
    let schoolCode: String
    let accessToken: String
    let availableSchools: [SchoolProfile]
    
    var id: Int { userId }
    
    enum CodingKeys: String, CodingKey {
        case userId = "userId"
        case username = "username"
        case fullName = "fullName"
        case role = "role"
        case schoolCode = "schoolCode"
        case accessToken = "accessToken"
        case availableSchools = "availableSchools"
    }
}