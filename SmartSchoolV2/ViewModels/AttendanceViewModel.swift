import Foundation
import Combine

@MainActor
class AttendanceViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var departments: [Department] = []
    @Published var attendanceRecords: [AttendanceRecord] = []
    @Published var periods: [PeriodDef] = []
    @Published var timetable: [TimetableEntry] = []
    @Published var currentPeriod: PeriodDef?
    @Published var currentClass: TimetableEntry?
    
    @Published var selectedDepartment: Department?
    @Published var selectedPeriod: PeriodDef?
    
    @Published var isLoading = false
    @Published var isLoadingPeriods = false
    @Published var isLoadingTimetable = false
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    private var currentUser: User?
    private var cancellables = Set<AnyCancellable>()
    private var timer: Timer?
    
    // MARK: - Initialization
    init() {
        // Start a timer to periodically check the current period (every 30 seconds for more responsive updates)
        timer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            self?.updateCurrentPeriod()
        }
    }
    
    deinit {
        timer?.invalidate()
    }
    
    // MARK: - Public Methods
    func setUser(_ user: User) {
        self.currentUser = user
        fetchPeriods()
        fetchTimetable()
    }

    func fetchPeriods() {
        guard let user = currentUser else { return }
        
        isLoadingPeriods = true

        Task {
            do {
                // Hardcode academic year for now
                let academicPeriod = "2025-2026"
                let fetchedPeriods = try await APIService.shared.getPeriodDefinitions(
                    schoolCode: user.schoolCode,
                    academicPeriod: academicPeriod,
                    token: user.accessToken
                )
                self.periods = fetchedPeriods.sorted { $0.periodNo < $1.periodNo }
                print("AttendanceViewModel: Fetched \(self.periods.count) periods")
                self.updateCurrentPeriod()
            } catch {
                self.errorMessage = "Failed to load periods: \(error.localizedDescription)"
            }
            self.isLoadingPeriods = false
        }
    }
    
    func fetchTimetable() {
        guard let user = currentUser else { return }
        
        isLoadingTimetable = true
        
        Task {
            do {
                let fetchedTimetable = try await APIService.shared.getMySchedule(token: user.accessToken)
                self.timetable = fetchedTimetable
                print("AttendanceViewModel: Fetched \(self.timetable.count) timetable entries")
                self.updateCurrentClass()
            } catch {
                self.errorMessage = "Failed to load timetable: \(error.localizedDescription)"
            }
            self.isLoadingTimetable = false
        }
    }
    
    private func updateCurrentPeriod() {
        print("=== AttendanceViewModel: Updating current period ===")
        
        let newCurrentPeriod = TimeUtils.findCurrentPeriodWithSeconds(from: periods)
        
        print("Found current period: \(newCurrentPeriod?.periodNo ?? -1)")
        
        if self.currentPeriod?.id != newCurrentPeriod?.id {
            self.currentPeriod = newCurrentPeriod
            
            if self.selectedPeriod == nil || newCurrentPeriod != nil {
                self.selectedPeriod = newCurrentPeriod
            }
            
            updateCurrentClass()
        }
    }
    
    private func updateCurrentClass() {
        guard let currentPeriod = self.currentPeriod else {
            self.currentClass = nil
            self.attendanceRecords = []
            return
        }
        
        let calendar = Calendar.current
        let dayOfWeek = calendar.component(.weekday, from: Date()) // Sunday = 1, Saturday = 7
        
        let matchingClass = timetable.first { entry in
            return entry.periodNo == currentPeriod.periodNo && entry.dayOfWeek == dayOfWeek
        }
        
        self.currentClass = matchingClass
        
        if let matchingClass {
            print("Found current class: \(matchingClass.subjectName ?? "N/A") - \(matchingClass.classList ?? "N/A")")
            // Automatically load students for the current class
            loadStudentsForCurrentClass()
        } else {
            print("No class scheduled for period \(currentPeriod.periodNo) on day \(dayOfWeek)")
            self.attendanceRecords = []
        }
    }
    
    func loadStudentsForCurrentClass() {
        guard let currentClass = currentClass,
              let subjectName = currentClass.subjectName,
              let classList = currentClass.classList,
              let user = currentUser else {
            self.attendanceRecords = []
            return
        }
        
        isLoading = true
        errorMessage = nil
        Task {
            do {
                let academicPeriod = "2025-2026" // Hardcoded for now
                guard let courseKey = try await APIService.shared.getCourseKey(
                    courseName: subjectName,
                    academicPeriod: academicPeriod,
                    token: user.accessToken
                ) else {
                    self.errorMessage = "Could not find course key for \(subjectName)"
                    self.isLoading = false
                    return
                }
                
                let studentsData = try await APIService.shared.getStudentsForClass(
                    courseKey: courseKey,
                    classList: classList,
                    academicPeriod: academicPeriod,
                    token: user.accessToken
                )
                
                self.attendanceRecords = studentsData.map { studentData in
                    AttendanceRecord(
                        id: studentData.id,
                        studentId: studentData.id,
                        studentName: "\(studentData.firstName) \(studentData.lastName)",
                        status: .present
                    )
                }
                
            } catch {
                self.errorMessage = "Failed to load students: \(error.localizedDescription)"
            }
            self.isLoading = false
        }
    }
    
    func submitAttendance() {
        // This logic will need to be updated based on how attendance is saved.
        // For now, it's a placeholder.
        guard !attendanceRecords.isEmpty else {
            errorMessage = "No students to submit."
            return
        }
        
        print("Submitting attendance...")
        
        // TODO: Add actual API call to submit attendance records
        // You'll need to send `attendanceRecords` data to the server.
        
        errorMessage = "Attendance submitted successfully!"
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.errorMessage = nil
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
}