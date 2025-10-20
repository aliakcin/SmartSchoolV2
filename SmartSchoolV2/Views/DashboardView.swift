//
//  DashboardView.swift
//  SmartSchoolV2
//
//  Created by Developer on 2025.
//

import SwiftUI

struct DashboardView: View {
    var user: User?
    var onLogout: () -> Void
    @State private var selectedSchoolCode: String?
    
    var body: some View {
        TabView {
            // Home Tab
            HomeView(user: user)
                .tabItem {
                    Image(systemName: "house")
                    Text("Home")
                }
            
            // Attendance Tab
            AttendanceView(user: user)
                .tabItem {
                    Image(systemName: "checkmark.circle")
                    Text("Attendance")
                }
            
            // Schedule Tab
            ScheduleView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Schedule")
                }
            
            // Profile Tab
            ProfileView(user: user, onLogout: onLogout)
                .tabItem {
                    Image(systemName: "person")
                    Text("Profile")
                }
        }
        .accentColor(.blue)
        .onAppear {
            self.selectedSchoolCode = user?.schoolCode
        }
    }
}

struct HomeView: View {
    var user: User?
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedSchoolCode: String?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Error Message Display
                    if let errorMessage = viewModel.errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.red)
                            Text(errorMessage)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Spacer()
                            Button(action: {
                                viewModel.clearError()
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(10)
                    }
                    
                    // Current Period Display
                    HStack {
                        if viewModel.isLoadingPeriods {
                            ProgressView()
                            Text("Loading Schedule...")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.leading, 8)
                        } else if let period = viewModel.currentPeriod {
                            Image(systemName: "clock.fill")
                                .foregroundColor(.green)
                            Text("Current Period: \(period.periodNo)")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        } else if viewModel.periods.isEmpty && viewModel.errorMessage == nil {
                            // Only show "No Schedule Loaded" if we successfully loaded but have no data
                            Image(systemName: "moon.stars.fill")
                                .foregroundColor(.orange)
                            Text("No Schedule Loaded")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        } else if !viewModel.periods.isEmpty {
                            // We have periods but none are currently active
                            Image(systemName: "moon.stars.fill")
                                .foregroundColor(.orange)
                            Text("It's not school time")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        } else {
                            // This shouldn't happen, but just in case
                            Image(systemName: "questionmark")
                                .foregroundColor(.gray)
                            Text("Schedule status unknown")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    
                    // School Selection Dropdown - Prominently placed at the top
                    if let schools = user?.availableSchools, !schools.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Current School")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.secondary)
                            
                            Picker("Select School", selection: $selectedSchoolCode) {
                                ForEach(schools, id: \.schoolCode) { school in
                                    Text(school.schoolName)
                                        .tag(school.schoolCode as String?)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .padding(12)
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }
                    
                    // Welcome Card
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Image(systemName: "hand.wave")
                                .font(.title2)
                            Text("Welcome Back!")
                                .font(.title2)
                                .fontWeight(.bold)
                        }
                        
                        Text("Hello, \(user?.fullName ?? "Teacher")")
                            .font(.title3)
                            .foregroundColor(.secondary)
                        
                        Text("Have a great day at work!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(15)
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Quick Actions")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 15) {
                            DashboardCard(
                                title: "Take Attendance",
                                icon: "checkmark.circle.fill",
                                color: .green
                            )
                            
                            DashboardCard(
                                title: "View Schedule",
                                icon: "calendar.badge.clock",
                                color: .blue
                            )
                            
                            DashboardCard(
                                title: "Grade Book",
                                icon: "book.fill",
                                color: .orange
                            )
                            
                            DashboardCard(
                                title: "Messages",
                                icon: "envelope.fill",
                                color: .purple
                            )
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(15)
                    .shadow(radius: 2)
                    
                    // Recent Activity
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Recent Activity")
                            .font(.title3)
                            .fontWeight(.semibold)
                        
                        ForEach(0..<3) { index in
                            HStack {
                                Image(systemName: "bell.fill")
                                    .foregroundColor(.blue)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Activity \(index + 1)")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    Text("Today, \(9 + index):00 AM")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                            }
                            .padding(.vertical, 8)
                            
                            if index < 2 {
                                Divider()
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(15)
                    .shadow(radius: 2)
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .onAppear {
                // Initialize selected school code
                selectedSchoolCode = user?.schoolCode
                print("User available schools count: \(user?.availableSchools.count ?? 0)")
                if let schools = user?.availableSchools {
                    print("Available schools: \(schools.map { $0.schoolName })")
                }
                viewModel.fetchPeriods(user: user)
            }
            .onDisappear {
                viewModel.onDisappear()
            }
            .onChange(of: selectedSchoolCode) { newValue in
                if let newSchoolCode = newValue {
                    print("Selected school changed to: \(newSchoolCode)")
                    // TODO: Add logic to handle school change
                }
            }
        }
    }
}

struct DashboardCard: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.white)
                .frame(width: 40, height: 40)
                .background(color)
                .clipShape(Circle()
                )
            
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .multilineTextAlignment(.center)
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity, maxHeight: 100)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct AttendanceView: View {
    var user: User?
    @StateObject private var viewModel = AttendanceViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                ClassInfoView(viewModel: viewModel)
                    .padding()

                if viewModel.isLoading {
                    ProgressView("Loading Students...")
                    Spacer()
                } else if !viewModel.attendanceRecords.isEmpty {
                    AttendanceRecordList(viewModel: viewModel)
                } else {
                    Spacer()
                    EmptyStateView(viewModel: viewModel)
                    Spacer()
                }
            }
            .navigationTitle("Attendance")
            .navigationBarItems(trailing:
                Group {
                    if !viewModel.attendanceRecords.isEmpty {
                        Button("Submit") {
                            viewModel.submitAttendance()
                        }
                    }
                }
            )
            .onAppear {
                if let user = user {
                    viewModel.setUser(user)
                }
            }
            .alert(item: $viewModel.errorMessage) { error in
                Alert(
                    title: Text("Info"),
                    message: Text(error),
                    dismissButton: .default(Text("OK")) {
                        viewModel.clearError()
                    }
                )
            }
        }
    }
}

// Extension to allow String to be used with .alert(item:)
extension String: Identifiable {
    public var id: String { self }
}

struct ClassInfoView: View {
    @ObservedObject var viewModel: AttendanceViewModel

    var body: some View {
        VStack(spacing: 10) {
            if viewModel.isLoadingPeriods || viewModel.isLoadingTimetable {
                 ProgressView("Loading Schedule...")
            } else if let period = viewModel.currentPeriod {
                Text("Current Period: \(period.periodNo) (\(period.periodName ?? ""))")
                    .font(.headline)
                    .fontWeight(.bold)
                
                if let currentClass = viewModel.currentClass {
                    VStack {
                        Text(currentClass.subjectName ?? "Course")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text(currentClass.classList ?? "Class")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 5)
                } else {
                    Text("No class scheduled for this period.")
                        .foregroundColor(.secondary)
                }
                
            } else {
                Text("Not during school hours.")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}


struct EmptyStateView: View {
    @ObservedObject var viewModel: AttendanceViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            if viewModel.currentClass != nil && !viewModel.isLoading {
                Image(systemName: "person.3.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.orange)
                Text("No Students Found")
                    .font(.title)
                    .fontWeight(.bold)
                Text("There are no students enrolled in \(viewModel.currentClass?.subjectName ?? "this class").")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            } else {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)
                Text("No Active Class")
                    .font(.title)
                    .fontWeight(.bold)
                Text("There is no class scheduled for the current time.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
        }
        .padding()
    }
}

struct AttendanceRecordList: View {
    @ObservedObject var viewModel: AttendanceViewModel
    
    var body: some View {
        List {
            ForEach($viewModel.attendanceRecords) { $record in
                HStack {
                    Text(record.studentName)
                    Spacer()
                    Picker("Status", selection: $record.status) {
                        ForEach(AttendanceStatus.allCases, id: \.self) { status in
                            Text(status.rawValue).tag(status)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .frame(maxWidth: 120)
                }
            }
        }
    }
}

struct ProfileView: View {
    var user: User?
    var onLogout: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Profile Header
                VStack(spacing: 15) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                    
                    Text(user?.fullName ?? "User Name")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(user?.role ?? "Role")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text(user?.schoolCode ?? "School")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                // Profile Details
                VStack(alignment: .leading, spacing: 15) {
                    ProfileRow(icon: "person.fill", title: "User ID", value: String(user?.userId ?? 0))
                    ProfileRow(icon: "envelope.fill", title: "Username", value: user?.username ?? "N/A")
                    ProfileRow(icon: "building.2.fill", title: "School Code", value: user?.schoolCode ?? "N/A")
                    ProfileRow(icon: "person.2.fill", title: "Role", value: user?.role ?? "N/A")
                }
                .padding()
                .background(Color.white)
                .cornerRadius(15)
                .shadow(radius: 2)
                
                Button(action: {
                    onLogout()
                }) {
                    HStack {
                        Image(systemName: "arrow.left.square.fill")
                            .foregroundColor(.red)
                        Text("Log Out")
                            .fontWeight(.semibold)
                            .foregroundColor(.red)
                    }
                }
                .padding()

                Spacer()
            }
            .padding()
            .navigationTitle("Profile")
        }
    }
}

struct ProfileRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 20)
            Text(title)
                .fontWeight(.medium)
            Spacer()
            Text(value)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 2)
    }
}