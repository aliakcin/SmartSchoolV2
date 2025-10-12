//
//  DashboardView.swift
//  SmartSchoolV2
//
//  Created by Developer on 2025.
//

import SwiftUI

struct DashboardView: View {
    var user: User?
    
    var body: some View {
        TabView {
            // Home Tab
            HomeView(user: user)
                .tabItem {
                    Image(systemName: "house")
                    Text("Home")
                }
            
            // Attendance Tab
            AttendanceView()
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
            ProfileView(user: user)
                .tabItem {
                    Image(systemName: "person")
                    Text("Profile")
                }
        }
        .accentColor(.blue)
    }
}

struct HomeView: View {
    var user: User?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
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
    var body: some View {
        NavigationView {
            VStack {
                Image(systemName: "checkmark.circle")
                    .font(.largeTitle)
                    .foregroundColor(.green)
                Text("Attendance")
                    .font(.title)
                    .padding()
                Text("Attendance tracking features will be implemented here")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
                Spacer()
            }
            .navigationTitle("Attendance")
        }
    }
}

struct ScheduleView: View {
    var body: some View {
        NavigationView {
            VStack {
                Image(systemName: "calendar")
                    .font(.largeTitle)
                    .foregroundColor(.blue)
                Text("Schedule")
                    .font(.title)
                    .padding()
                Text("Class schedule and timetable features will be implemented here")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
                Spacer()
            }
            .navigationTitle("Schedule")
        }
    }
}

struct ProfileView: View {
    var user: User?
    
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

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView(user: User(
            userId: 35,
            username: "test.teacher",
            fullName: "Test Teacher User",
            role: "Teacher",
            schoolCode: "SC001",
            accessToken: "mock_token"
        ))
    }
}
