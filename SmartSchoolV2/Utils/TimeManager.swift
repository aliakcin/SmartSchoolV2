import Foundation

/// A singleton class to manage time synchronization with the server.
/// This ensures that all time-sensitive operations in the app are consistent with the server's clock,
/// preventing issues related to incorrect device time settings.
class TimeManager {
    static let shared = TimeManager()
    
    // The difference in seconds between server time and device time.
    // A positive value means the server is ahead of the device.
    private var serverTimeOffset: TimeInterval = 0
    
    private init() {}
    
    /// Synchronizes the local time with the server's time.
    /// This function fetches the current time from the server, calculates the offset
    /// between it and the device's local time, and stores this offset.
    func synchronizeTime() async {
        let deviceTimeAtRequest = Date()
        
        do {
            let serverTime = try await APIService.shared.getServerTime()
            // Calculate the round-trip time to improve accuracy, though for this app's purpose, it might be overkill.
            // For simplicity, we'll just calculate the direct offset.
            self.serverTimeOffset = serverTime.timeIntervalSince(deviceTimeAtRequest)
            print("Successfully synchronized time. Server is \(self.serverTimeOffset) seconds ahead of device.")
        } catch {
            // If synchronization fails, we log the error and proceed with an offset of 0.
            // The app will fall back to using the device's local time.
            print("Failed to synchronize server time: \(error.localizedDescription). Using device time.")
            self.serverTimeOffset = 0
        }
    }
    
    /// Returns the current time, adjusted by the server time offset.
    /// This should be used for all time-sensitive calculations.
    func getCurrentTime() -> Date {
        // Add the calculated offset to the current device time to get the synchronized server time.
        return Date().addingTimeInterval(serverTimeOffset)
    }
}