import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var periods: [PeriodDef] = []
    @Published var currentPeriod: PeriodDef?
    @Published var isLoadingPeriods = false
    @Published var errorMessage: String?
    
    private var timer: Timer?

    init() {
        // Start a timer to periodically check the current period
        timer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: true) { [weak self] _ in
            self?.updateCurrentPeriod()
        }
    }
    
    deinit {
        timer?.invalidate()
    }
    
    func onDisappear() {
        // No need for cancellables with async/await
    }
    
    func fetchPeriods(user: User?) {
        guard let user = user else { return }
        
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
            self.isLoadingPeriods = false
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
}