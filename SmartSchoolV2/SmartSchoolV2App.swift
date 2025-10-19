import SwiftUI
import Combine

@main
struct SmartSchoolV2App: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            if appState.isLoggedIn {
                DashboardView(user: appState.user, onLogout: {
                    appState.logout()
                })
            } else {
                LoginView(onLoginSuccess: { user in
                    appState.login(user: user)
                })
            }
        }
    }
}

class AppState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var user: User?

    init() {
        // Check for a saved token and user on app launch
        if let _ = UserDefaults.standard.string(forKey: "accessToken"),
           let userData = UserDefaults.standard.data(forKey: "currentUser"),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            
            self.user = user
            self.isLoggedIn = true
        }
    }

    func login(user: User) {
        self.user = user
        self.isLoggedIn = true
    }

    func logout() {
        AuthService.shared.logout()
        self.user = nil
        self.isLoggedIn = false
    }
}