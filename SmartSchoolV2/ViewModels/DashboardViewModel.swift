import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var currentPeriod: PeriodDef?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var periods: [PeriodDef] = []
    
    // Timer to update the current period
    private var timer: Timer?

    func fetchPeriods(user: User?) {
        guard let user = user else {
            errorMessage = "User not found."
            return
        }
        
        // Simple academic period for now, can be made dynamic later
        let academicPeriod = "2025-2026"
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                print("Fetching periods for user: \(user.username)...")
                self.periods = try await APIService.shared.getPeriodDefinitions(
                    schoolCode: user.schoolCode,
                    academicPeriod: academicPeriod,
                    token: user.accessToken
                )
                print("Successfully fetched \(self.periods.count) period definitions.")
                
                // Set up a timer to check for the current period every 60 seconds
                self.timer?.invalidate()
                self.timer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
                    self?.updateCurrentPeriod()
                }
                // Initial update
                self.updateCurrentPeriod()
                
            } catch {
                errorMessage = "Failed to fetch periods: \(error.localizedDescription)"
                print(error)
            }
            isLoading = false
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
                        return
                    }
                }
            }
        }
        
        // If no period is active
        self.currentPeriod = nil
    }
    
    func onDisappear() {
        timer?.invalidate()
        timer = nil
    }
}