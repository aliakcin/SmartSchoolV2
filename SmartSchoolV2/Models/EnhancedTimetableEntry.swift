import Foundation

// Enhanced timetable entry that includes student information
struct EnhancedTimetableEntry: Codable, Identifiable {
    let id: Int
    let academicPeriod: String
    let schoolCode: String
    let teacherUId: String
    let dayCode: String
    let dayOfWeek: Int
    let periodNo: Int
    let subjectName: String?
    let classList: String?
    let roomShortName: String?
    let periodStartTime: String?
    let periodEndTime: String?
    let schoolName: String
    let students: [StudentData]
}

// Response structure for the enhanced attendance schedule endpoint
struct AttendanceScheduleResponse: Codable {
    let user: AttendanceUser
    let academicPeriod: String
    let periods: [PeriodDef]
    let timetable: [EnhancedTimetableEntry]
}

struct AttendanceUser: Codable {
    let userId: Int
    let username: String
    let ascTeacherUid: String
    let schoolName: String
    let schoolCode: String
}