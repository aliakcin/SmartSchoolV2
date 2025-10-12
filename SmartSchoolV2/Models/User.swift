//
//  User.swift
//  SmartSchoolV2
//
//  Created by Developer on 2025.
//

import Foundation

struct User: Codable {
    let userId: Int
    let username: String
    let fullName: String
    let role: String
    let schoolCode: String
    let accessToken: String?
    
    enum CodingKeys: String, CodingKey {
        case userId = "userId"
        case username = "username"
        case fullName = "fullName"
        case role = "role"
        case schoolCode = "schoolCode"
        case accessToken = "accessToken"
    }
}
