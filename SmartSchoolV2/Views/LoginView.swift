//
//  LoginView.swift
//  SmartSchoolV2
//
//  Created by Developer on 2025.
//

import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @State private var showingDashboard = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                Color(red: 41/255, green: 42/255, blue: 48/255)
                    .ignoresSafeArea()
                
                // Content
                VStack {
                    // Header
                    VStack(spacing: 10) {
                        HStack {
                            Image(systemName: "checkmark.square.fill")
                                .font(.largeTitle)
                                .foregroundColor(.white)
                            Text("Codebrotherhood")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        Text("We make technology work for you!")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 50)
                    .padding(.bottom, 30)
                    
                    // SmartSchool Logo
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Image(systemName: "play.fill")
                            .font(.title)
                            .foregroundColor(.gray)
                            .padding(.trailing, 4)

                        Text("Smart")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                        +
                        Text("School")
                            .font(.largeTitle)
                            .foregroundColor(Color(red: 9/255, green: 171/255, blue: 228/255))

                        Text("v.15")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                            .padding(.leading, 5)
                    }
                    .padding(.bottom, 40)

                    
                    // Login Form
                    VStack(spacing: 15) {
                        // Username
                        HStack {
                            Image(systemName: "person.fill")
                                .foregroundColor(.gray)
                                .padding(.leading, 15)
                            
                            ZStack(alignment: .leading) {
                                if viewModel.username.isEmpty {
                                    Text("Username")
                                        .foregroundColor(.gray)
                                }
                                TextField("", text: $viewModel.username)
                                    .textContentType(.username)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .foregroundColor(.black)
                            }
                            .padding(.vertical, 12)
                            .padding(.horizontal, 5)
                        }
                        .background(Color.white)
                        .cornerRadius(8)
                        
                        // Password
                        HStack {
                            Image(systemName: "lock.fill")
                                .foregroundColor(.gray)
                                .padding(.leading, 15)
                            
                            ZStack(alignment: .leading) {
                                if viewModel.password.isEmpty {
                                    Text("Password")
                                        .foregroundColor(.gray)
                                }
                                SecureField("", text: $viewModel.password)
                                    .textContentType(.password)
                                    .foregroundColor(.black)
                            }
                            .padding(.vertical, 12)
                            .padding(.horizontal, 5)
                        }
                        .background(Color.white)
                        .cornerRadius(8)
                        
                        Button(action: {
                            viewModel.login()
                        }) {
                            HStack {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(.orange)
                                Text("SmartSchool v15 Login")
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                            .padding()
                            .background(Color.white)
                            .foregroundColor(.black)
                            .cornerRadius(8)
                        }
                        .disabled(viewModel.isLoading)
                        
                        Button(action: {
                            // Close the app
                            exit(0)
                        }) {
                            HStack {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                                Text("Close")
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                            .padding()
                            .background(Color.white)
                            .foregroundColor(.black)
                            .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal, 30)
                    
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.subheadline)
                            .padding()
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(8)
                            .onTapGesture {
                                viewModel.clearError()
                            }
                    }
                    
                    Spacer()
                    
                    // Footer
                    VStack {
                        Text("KKTC's most preferred school management system")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("Codebrotherhood Software Solutions")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("www.codebrotherhood.com | www.smartschool4.com")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .padding(.bottom, 20)
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                viewModel.username = "5840259698"
                viewModel.password = "12345"
            }
            .onReceive(viewModel.$isLoggedIn) { isLoggedIn in
                if isLoggedIn {
                    showingDashboard = true
                }
            }
            .fullScreenCover(isPresented: $showingDashboard) {
                DashboardView(user: viewModel.user)
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
    }
}