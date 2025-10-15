import Foundation

struct PeriodDef: Codable, Identifiable, Hashable {
    let id: Int
    let schoolCode: String
    let academicPeriod: String
    let periodNo: Int
    let startTime: String
    let endTime: String
    
    enum CodingKeys: String, CodingKey {
        case id = "Id"
        case schoolCode = "SchoolCode"
        case academicPeriod = "AcademicPeriod"
        case periodNo = "PeriodNo"
        case startTime = "StartTime"
        case endTime = "EndTime"
    }
}