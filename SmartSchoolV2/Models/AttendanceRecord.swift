import Foundation

struct AttendanceRecord: Identifiable {
    let id: Int // Using studentId as the stable identifier
    let studentId: Int
    let studentName: String
    var status: AttendanceStatus
}

enum AttendanceStatus: String, CaseIterable, Codable, Identifiable {
    case present = "Present"
    case absent = "Absent"
    case late = "Late"
    case excused = "Excused"
    
    var id: String { self.rawValue }
}