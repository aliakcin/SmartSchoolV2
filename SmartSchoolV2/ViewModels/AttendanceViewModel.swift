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
                self.updateCurrentPeriod()
            } catch {
                self.errorMessage = "Failed to load periods: \(error.localizedDescription)"
            }
            self.isLoadingPeriods = false
        }
    }
    
    private func updateCurrentPeriod() {
        // Use the utility function to find the current period
        let newCurrentPeriod = TimeUtils.findCurrentPeriod(from: periods)
        
        // Only update if it's actually changed to avoid unnecessary UI updates
        if self.currentPeriod?.id != newCurrentPeriod?.id {
            self.currentPeriod = newCurrentPeriod
            
            // Also set selectedPeriod if none is selected or if current period changed
            if self.selectedPeriod == nil || newCurrentPeriod != nil {
                self.selectedPeriod = newCurrentPeriod
            }
        }
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
}
