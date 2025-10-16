import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var periods: [PeriodDef] = []
    @Published var currentPeriod: PeriodDef?
    @Published var isLoadingPeriods = false
    @Published var errorMessage: String?
    
    private var timer: Timer?
    private var currentUser: User?

    init() {
        // Start a timer to periodically check the current period (every 30 seconds for more responsive updates)
        timer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
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
        
        self.currentUser = user
        isLoadingPeriods = true

        Task {
            // Synchronize time with the server first
            await TimeManager.shared.synchronizeTime()
            
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
        self.currentPeriod = TimeUtils.findCurrentPeriod(from: periods)
    }
    
    func clearError() {
        errorMessage = nil
    }
}