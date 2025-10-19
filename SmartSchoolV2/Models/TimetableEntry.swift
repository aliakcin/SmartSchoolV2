import Foundation

struct TimetableEntry: Codable, Identifiable {
    let id: Int
    let academicPeriod: String?
    let schoolCode: String?
    let teacherUId: String?
    let dayCode: String?
    let dayOfWeek: Int?
    let periodNo: Int?
    let subjectName: String?
    let classList: String?
    let roomShortName: String?

    enum CodingKeys: String, CodingKey {
        case id = "Id"
        case academicPeriod = "AcademicPeriod"
        case schoolCode = "SchoolCode"
        case teacherUId = "TeacherUId"
        case dayCode = "DayCode"
        case dayOfWeek = "DayOfWeek"
        case periodNo = "PeriodNo"
        case subjectName = "SubjectName"
        case classList = "ClassList"
        case roomShortName = "RoomShortName"
    }
}