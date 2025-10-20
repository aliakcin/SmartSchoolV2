//
//  AttendanceService.swift
//  SmartSchoolV2
//
//  Created by  mete akcin on 10/16/25.
//

import Foundation

struct Period: Identifiable, Codable {
    let id: Int
    let periodNo: Int
    let startTime: String
    let endTime: String
}

struct Department: Identifiable, Codable {
    let id = UUID()
    let departmentKey: Int
    let departmentName: String
    let departmentCode: String
}

struct Student: Identifiable, Codable {
    let id = UUID()
    let studentId: Int
    let firstName: String
    let lastName: String
    let fullName: String
}

class AttendanceService {
    static let shared = AttendanceService()

    private let baseURL = "http://localhost:3000/api"
    private var authToken: String?

    private init() {}

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    // Fetch periods/period definitions
    func getPeriods(schoolCode: String, academicPeriod: String, completion: @escaping (Result<[Period], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/period-definitions/\(schoolCode)/\(academicPeriod)") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "No data received", code: 0, userInfo: nil)))
                return
            }

            do {
                let periodsData = try JSONDecoder().decode([PeriodDefinition].self, from: data)
                let periods = periodsData.enumerated().map { (index, periodData) in
                    Period(
                        id: index,
                        periodNo: periodData.periodNo,
                        startTime: periodData.startTime,
                        endTime: periodData.endTime
                    )
                }
                completion(.success(periods))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    // Fetch departments/classes for a teacher
    func getDepartments(for userId: Int, completion: @escaping (Result<[Department], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/teacher-departments/\(userId)") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "No data received", code: 0, userInfo: nil)))
                return
            }

            do {
                let departmentsData = try JSONDecoder().decode([DepartmentData].self, from: data)
                let departments = departmentsData.map { departmentData in
                    Department(
                        departmentKey: departmentData.departmentKey,
                        departmentName: departmentData.departmentName,
                        departmentCode: departmentData.departmentCode
                    )
                }
                completion(.success(departments))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Fetch departments for current class (based on timetable)
    func getDepartmentsForCurrentClass(for userId: Int, periodNo: Int, dayCode: String, completion: @escaping (Result<[Department], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/teacher-departments/\(userId)/period/\(periodNo)/day/\(dayCode)") else {
            // Fallback to regular departments if specific endpoint doesn't exist
            self.getDepartments(for: userId, completion: completion)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                // Fallback to regular departments if specific endpoint fails
                self.getDepartments(for: userId, completion: completion)
                return
            }

            guard let data = data else {
                // Fallback to regular departments if no data received
                self.getDepartments(for: userId, completion: completion)
                return
            }

            do {
                let departmentsData = try JSONDecoder().decode([DepartmentData].self, from: data)
                let departments = departmentsData.map { departmentData in
                    Department(
                        departmentKey: departmentData.departmentKey,
                        departmentName: departmentData.departmentName,
                        departmentCode: departmentData.departmentCode
                    )
                }
                completion(.success(departments))
            } catch {
                // Fallback to regular departments if decoding fails
                self.getDepartments(for: userId, completion: completion)
            }
        }.resume()
    }

    // Fetch students for a department
    func getStudents(for departmentKey: Int, completion: @escaping (Result<[Student], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/students/department/\(departmentKey)") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data received", code: 0, userInfo: nil)))
                return
            }
            
            do {
                let studentsData = try JSONDecoder().decode([StudentData].self, from: data)
                
                let students = studentsData.map { studentData in
                    Student(
                        studentId: studentData.id,
                        firstName: studentData.firstName,
                        lastName: studentData.lastName,
                        fullName: "\(studentData.firstName) \(studentData.lastName)"
                    )
                }
                
                completion(.success(students))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    // Submit attendance data
    func submitAttendance(records: [AttendanceRecord], departmentId: Int, completion: @escaping (Result<Void, Error>) -> Void) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            completion(.success(()))
        }
    }
}

// MARK: - API Data Models
struct PeriodDefinition: Codable {
    let schoolCode: String
    let academicPeriod: String
    let periodNo: Int
    let startTime: String
    let endTime: String
}

struct DepartmentData: Codable {
    let departmentKey: Int
    let departmentName: String
    let departmentCode: String
}

struct StudentData: Codable {
    let id: Int
    let firstName: String
    let lastName: String
}