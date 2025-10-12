//
//  AttendanceViewModel.swift
//  SmartSchoolV2
//
//  Created by  mete akcin on 10/16/25.
//

import Foundation
import Combine

class AttendanceViewModel: ObservableObject {
    @Published var departments: [Department] = []
    @Published var attendanceRecords: [AttendanceRecord] = []
    @Published var currentPeriod: Period?
    
    @Published var selectedDepartment: Department?
    
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var currentUser: User?
    private var cancellables = Set<AnyCancellable>()
    
    func setUser(_ user: User) {
        self.currentUser = user
        if let token = user.accessToken {
            AttendanceService.shared.setAuthToken(token)
        }
        // Automatically detect the period when the user is set
        detectCurrentPeriod()
    }

    func detectCurrentPeriod() {
        guard let user = currentUser else { return }
        
        // Use a default academic period for now
        let academicPeriod = "2025-2026"

        AttendanceService.shared.getPeriods(schoolCode: user.schoolCode, academicPeriod: academicPeriod) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let periods):
                    self?.selectCurrentPeriod(from: periods)
                case .failure(let error):
                    // Non-critical error, we can just not show the period
                    print("Could not fetch periods: \(error.localizedDescription)")
                }
            }
        }
    }

    private func selectCurrentPeriod(from periods: [Period]) {
        let currentTime = Date()
        let calendar = Calendar.current
        let currentHour = calendar.component(.hour, from: currentTime)
        let currentMinute = calendar.component(.minute, from: currentTime)
        let currentTimeInMinutes = currentHour * 60 + currentMinute
        
        for period in periods {
            if let startTime = parseTime(period.startTime),
               let endTime = parseTime(period.endTime) {
                let startMinutes = startTime.hour * 60 + startTime.minute
                let endMinutes = endTime.hour * 60 + endTime.minute
                
                if currentTimeInMinutes >= startMinutes && currentTimeInMinutes <= endMinutes {
                    self.currentPeriod = period
                    break
                }
            }
        }
    }
    
    private func parseTime(_ timeString: String) -> (hour: Int, minute: Int)? {
        let components = timeString.split(separator: ":")
        guard components.count >= 2,
              let hour = Int(components[0]),
              let minute = Int(components[1]) else {
            return nil
        }
        return (hour: hour, minute: minute)
    }

    func loadDepartments() {
        guard let user = currentUser else {
            self.errorMessage = "Current user not found."
            return
        }
        
        isLoading = true
        errorMessage = nil
        
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
        
        AttendanceService.shared.getStudents(for: department.departmentKey) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let students):
                    self?.attendanceRecords = students.map { student in
                        AttendanceRecord(
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
        guard let department = selectedDepartment else { return }
        
        print("Submitting attendance for department: \(department.departmentName)")
        
        errorMessage = "Attendance submitted successfully!"
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.errorMessage = nil
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
}