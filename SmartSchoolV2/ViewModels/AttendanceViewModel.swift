import Foundation
import Combine

@MainActor
class AttendanceViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var departments: [Department] = []
    @Published var attendanceRecords: [AttendanceRecord] = []
    @Published var periods: [PeriodDef] = []
    @Published var currentPeriod: PeriodDef?
    
    @Published var selectedDepartment: Department?
    @Published var selectedPeriod: PeriodDef?
    
    @Published var isLoading = false
    @Published var isLoadingPeriods = false
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    private var currentUser: User?
    private var cancellables = Set<AnyCancellable>()
    private var timer: Timer?
    
    // MARK: - Public Methods
    func setUser(_ user: User) {
        self.currentUser = user
        fetchPeriods()
    }

    func fetchPeriods() {
        guard let user = currentUser else { return }
        
        isLoadingPeriods = true
        let academicPeriod = "2025-2026" // This can be made dynamic later

        Task {
            do {
                let fetchedPeriods = try await APIService.shared.getPeriodDefinitions(
                    schoolCode: user.schoolCode,
                    academicPeriod: academicPeriod,
                    token: user.accessToken
                )
                self.periods = fetchedPeriods.sorted { $0.periodNo < $1.periodNo }
                self.updateCurrentPeriod()
            } catch {
                self.errorMessage = "Failed to load periods: \(error.localizedDescription)"
            }
            isLoadingPeriods = false
        }
    }
    
    private func updateCurrentPeriod() {
        let now = Date()
        let calendar = Calendar.current
        let currentTimeComponents = calendar.dateComponents([.hour, .minute], from: now)
        
        guard let hour = currentTimeComponents.hour, let minute = currentTimeComponents.minute else { return }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        
        for period in periods {
            if let startTime = formatter.date(from: period.startTime),
               let endTime = formatter.date(from: period.endTime) {
                
                let startComponents = calendar.dateComponents([.hour, .minute], from: startTime)
                let endComponents = calendar.dateComponents([.hour, .minute], from: endTime)
                
                if let startHour = startComponents.hour, let startMinute = startComponents.minute,
                   let endHour = endComponents.hour, let endMinute = endComponents.minute {
                    
                    let currentTimeInMinutes = hour * 60 + minute
                    let startTimeInMinutes = startHour * 60 + startMinute
                    let endTimeInMinutes = endHour * 60 + endMinute

                    if currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes {
                        self.currentPeriod = period
                        // Also set selectedPeriod if none is selected
                        if self.selectedPeriod == nil {
                            self.selectedPeriod = period
                        }
                        return
                    }
                }
            }
        }
        
        // If no period is active
        self.currentPeriod = nil
    }

    func loadDepartments() {
        guard let user = currentUser else {
            self.errorMessage = "Current user not found."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        // This should be updated to use APIService in the future.
        AttendanceService.shared.getDepartments(for: user.userId) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let departments):
                    self?.departments = departments
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func loadStudents() {
        guard let department = selectedDepartment else { return }
        
        isLoading = true
        errorMessage = nil
        
        // This should be updated to use APIService in the future.
        AttendanceService.shared.getStudents(for: department.departmentKey) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let students):
                    self?.attendanceRecords = students.map { student in
                        AttendanceRecord(
                            id: student.studentId, // Use studentId as the stable ID
                            studentId: student.studentId,
                            studentName: student.fullName,
                            status: .present
                        )
                    }
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func submitAttendance() {
        guard let department = selectedDepartment else {
            errorMessage = "Please select a class."
            return
        }
        guard let period = selectedPeriod else {
            errorMessage = "Please select a period before submitting."
            return
        }
        
        print("Submitting attendance for department: \(department.departmentName), Period: \(period.periodNo)")
        
        // TODO: Add actual API call to submit attendance records
        
        errorMessage = "Attendance submitted successfully!"
        
        // Clear the message after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.errorMessage = nil
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    deinit {
        timer?.invalidate()
    }
}