import Foundation

struct SchoolProfile: Codable, Identifiable {
    let schoolCode: String
    let schoolName: String
    let role: String
    
    var id: String { schoolCode }
    
    enum CodingKeys: String, CodingKey {
        case schoolCode = "schoolCode"
        case schoolName = "schoolName"
        case role = "role"
    }
}