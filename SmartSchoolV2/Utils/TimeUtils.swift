import Foundation

struct TimeUtils {
    // This is the assumed local time zone for the school.
    // All time comparisons will be done relative to this time zone.
    private static let schoolTimeZoneIdentifier = "Asia/Nicosia"

    /// Convert time string (HH:mm:ss) to minutes since midnight
    static func timeToMinutes(_ timeString: String) -> Int? {
        let components = timeString.split(separator: ":").map(String.init)
        guard components.count >= 2, // Allow HH:mm format as well
              let hours = Int(components[0]),
              let minutes = Int(components[1]) else {
            return nil
        }
        
        // Validate time ranges
        guard hours >= 0 && hours <= 23,
              minutes >= 0 && minutes <= 59 else {
            return nil
        }
        
        return hours * 60 + minutes
    }
    
    /// Get current time in minutes since midnight, adjusted for the school's local time zone.
    static func currentTimeInMinutes() -> Int {
        // Use the synchronized time from TimeManager
        let now = TimeManager.shared.getCurrentTime()
        var calendar = Calendar.current
        
        // Set the calendar's time zone to ensure the comparison is correct.
        if let timeZone = TimeZone(identifier: schoolTimeZoneIdentifier) {
            calendar.timeZone = timeZone
        }
        
        let components = calendar.dateComponents([.hour, .minute], from: now)
        let currentMinutes = (components.hour ?? 0) * 60 + (components.minute ?? 0)
        
        // For debugging: print the time being used for comparison.
        let hour = components.hour ?? 0
        let minute = components.minute ?? 0
        print("Comparing against school time: \(String(format: "%02d:%02d", hour, minute)) (\(currentMinutes) minutes)")
        
        return currentMinutes
    }
    
    /// Find the current period based on the current time in the school's time zone.
    static func findCurrentPeriod(from periods: [PeriodDef]) -> PeriodDef? {
        let currentTimeMinutes = currentTimeInMinutes()
        
        for period in periods {
            guard let startTimeMinutes = timeToMinutes(period.startTime),
                  let endTimeMinutes = timeToMinutes(period.endTime) else {
                continue
            }
            
            // Check if current time falls within this period
            // Inclusive of start time, exclusive of end time
            if currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes {
                return period
            }
        }
        
        return nil // No active period
    }
    
    /// Get formatted current time string
    static func getCurrentTimeString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        if let timeZone = TimeZone(identifier: schoolTimeZoneIdentifier) {
            formatter.timeZone = timeZone
        }
        // Use the synchronized time
        return formatter.string(from: TimeManager.shared.getCurrentTime())
    }
}