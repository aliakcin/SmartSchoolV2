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
                LinearGradient(gradient: Gradient(colors: [Color.blue.opacity(0.7), Color.purple.opacity(0.7)]), startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                
                // Content
                VStack(spacing: 30) {
                    // App Logo/Title
                    VStack(spacing: 10) {
                        Image(systemName: "book.closed.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.white)
                        Text("Smart School")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("Education Management System")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.9))
                    }
                    .padding(.bottom, 20)
                    
                    // Login Form
                    VStack(spacing: 20) {
                        // Username Field
                        TextField("Username", text: $viewModel.username)
                            .textContentType(.username)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .padding()
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.white, lineWidth: 1)
                            )
                        
                        // Password Field
                        SecureField("Password", text: $viewModel.password)
                            .textContentType(.password)
                            .padding()
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.white, lineWidth: 1)
                            )
                        
                        // Login Button
                        Button(action: {
                            viewModel.login()
                        }) {
                            HStack {
                                Text("Sign In")
                                    .fontWeight(.semibold)
                                if viewModel.isLoading {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                        .frame(width: 20, height: 20)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(viewModel.isLoading ? Color.gray : Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(viewModel.isLoading)
                    }
                    .padding(.horizontal, 30)
                    
                    // Error Message
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
                }
                .padding(.vertical, 50)
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
