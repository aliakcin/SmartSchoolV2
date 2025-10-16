import Foundation

struct PeriodDef: Codable, Identifiable, Hashable {
    // A computed property to create a unique ID, satisfying the 'Identifiable' protocol.
    // This ID is generated from the data itself, so we don't need an "Id" column from the database.
    var id: String { "\(schoolCode)-\(academicPeriod)-\(periodNo)" }
    
    let schoolCode: String
    let academicPeriod: String
    let periodNo: Int
    let startTime: String
    let endTime: String
    let periodName: String? // This field was missing
    
    enum CodingKeys: String, CodingKey {
        // We no longer look for an "Id" key from the JSON
        case schoolCode = "SchoolCode"
        case academicPeriod = "AcademicPeriod"
        case periodNo = "PeriodNo"
        case startTime = "StartTime"
        case endTime = "EndTime"
        case periodName = "PeriodName"
    }
}