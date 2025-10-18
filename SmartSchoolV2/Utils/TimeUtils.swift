import Foundation

struct TimeUtils {
    // This is the assumed local time zone for the school.
    // All time comparisons will be done relative to this time zone.
    private static let schoolTimeZoneIdentifier = "Asia/Nicosia"

    /// Convert time string (HH:mm:ss or HH:mm) to minutes since midnight
    static func timeToMinutes(_ timeString: String) -> Int? {
        // Handle ISO 8601 format (e.g., "1970-01-01T01:00:00.000Z")
        // Extract time directly from the string using regex
        if timeString.contains("T") {
            // Use regex to extract the time part HH:MM:SS
            let regex = try? NSRegularExpression(pattern: #"(\d{2}):(\d{2}):(\d{2})"#)
            if let match = regex?.firstMatch(in: timeString, range: NSRange(timeString.startIndex..., in: timeString)) {
                let hourString = String(timeString[Range(match.range(at: 1), in: timeString)!])
                let minuteString = String(timeString[Range(match.range(at: 2), in: timeString)!])
                
                guard let hours = Int(hourString), let minutes = Int(minuteString) else {
                    print("Failed to parse time from ISO string: \(timeString)")
                    return nil
                }
                
                // Validate time ranges
                guard hours >= 0 && hours <= 23,
                      minutes >= 0 && minutes <= 59 else {
                    print("Invalid time values in string: \(timeString)")
                    return nil
                }
                
                let totalMinutes = hours * 60 + minutes
                print("Parsed \(timeString) -> Extracted time: \(hours):\(minutes) = \(totalMinutes) minutes")
                return totalMinutes
            } else {
                print("Failed to match time pattern in ISO string: \(timeString)")
                return nil
            }
        }
        
        // Handle simple time format (e.g., "01:00" or "01:00:00")
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
    
    /// Convert time string (HH:mm:ss or HH:mm) to total seconds since midnight
    static func timeToSeconds(_ timeString: String) -> Int? {
        // Handle ISO 8601 format (e.g., "1970-01-01T01:00:00.000Z")
        // Extract time directly from the string using regex
        if timeString.contains("T") {
            // Use regex to extract the time part HH:MM:SS
            let regex = try? NSRegularExpression(pattern: #"(\d{2}):(\d{2}):(\d{2})"#)
            if let match = regex?.firstMatch(in: timeString, range: NSRange(timeString.startIndex..., in: timeString)) {
                let hourString = String(timeString[Range(match.range(at: 1), in: timeString)!])
                let minuteString = String(timeString[Range(match.range(at: 2), in: timeString)!])
                let secondString = String(timeString[Range(match.range(at: 3), in: timeString)!])
                
                guard let hours = Int(hourString), let minutes = Int(minuteString), let seconds = Int(secondString) else {
                    print("Failed to parse time from ISO string: \(timeString)")
                    return nil
                }
                
                // Validate time ranges
                guard hours >= 0 && hours <= 23,
                      minutes >= 0 && minutes <= 59,
                      seconds >= 0 && seconds <= 59 else {
                    print("Invalid time values in string: \(timeString)")
                    return nil
                }
                
                let totalSeconds = hours * 3600 + minutes * 60 + seconds
                print("Parsed \(timeString) -> Extracted time: \(hours):\(minutes):\(seconds) = \(totalSeconds) seconds")
                return totalSeconds
            } else {
                print("Failed to match time pattern in ISO string: \(timeString)")
                return nil
            }
        }
        
        // Handle simple time format (e.g., "01:00" or "01:00:00")
        let components = timeString.split(separator: ":").map(String.init)
        guard components.count >= 2, // Allow HH:mm format as well
              let hours = Int(components[0]),
              let minutes = Int(components[1]) else {
            return nil
        }
        
        let seconds = components.count > 2 ? (Int(components[2]) ?? 0) : 0
        
        // Validate time ranges
        guard hours >= 0 && hours <= 23,
              minutes >= 0 && minutes <= 59,
              seconds >= 0 && seconds <= 59 else {
            return nil
        }
        
        return hours * 3600 + minutes * 60 + seconds
    }
    
    /// Get current time in minutes since midnight, adjusted for the school's local time zone.
    /// Only compares hours and minutes, ignoring seconds for period matching.
    static func currentTimeInMinutes() -> Int {
        // Use the synchronized time from TimeManager
        let now = TimeManager.shared.getCurrentTime()
        
        // Create a calendar with the school's time zone
        var calendar = Calendar.current
        if let timeZone = TimeZone(identifier: schoolTimeZoneIdentifier) {
            calendar.timeZone = timeZone
        } else {
            print("Warning: Could not create time zone with identifier \(schoolTimeZoneIdentifier)")
        }
        
        let components = calendar.dateComponents([.hour, .minute], from: now)
        let currentMinutes = (components.hour ?? 0) * 60 + (components.minute ?? 0)
        
        // For debugging: print the time being used for comparison.
        let hour = components.hour ?? 0
        let minute = components.minute ?? 0
        print("Current school time: \(String(format: "%02d:%02d", hour, minute)) (\(currentMinutes) minutes)")
        
        // Also print the raw time for debugging
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss Z"
        formatter.timeZone = TimeZone(identifier: schoolTimeZoneIdentifier)
        print("Raw current time in school time zone: \(formatter.string(from: now))")
        
        // Print UTC time for comparison
        let utcFormatter = DateFormatter()
        utcFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss Z"
        utcFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        print("Raw current time in UTC: \(utcFormatter.string(from: now))")
        
        return currentMinutes
    }
    
    /// Get current time in seconds since midnight, adjusted for the school's local time zone.
    static func currentTimeInSeconds() -> Int {
        // Use the synchronized time from TimeManager
        let now = TimeManager.shared.getCurrentTime()
        
        // Create a calendar with the school's time zone
        var calendar = Calendar.current
        if let timeZone = TimeZone(identifier: schoolTimeZoneIdentifier) {
            calendar.timeZone = timeZone
        } else {
            print("Warning: Could not create time zone with identifier \(schoolTimeZoneIdentifier)")
        }
        
        let components = calendar.dateComponents([.hour, .minute, .second], from: now)
        let currentSeconds = (components.hour ?? 0) * 3600 + (components.minute ?? 0) * 60 + (components.second ?? 0)
        
        // For debugging: print the time being used for comparison.
        let hour = components.hour ?? 0
        let minute = components.minute ?? 0
        let second = components.second ?? 0
        print("Current school time: \(String(format: "%02d:%02d:%02d", hour, minute, second)) (\(currentSeconds) seconds)")
        
        // Also print the raw time for debugging
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss Z"
        formatter.timeZone = TimeZone(identifier: schoolTimeZoneIdentifier)
        print("Raw current time in school time zone: \(formatter.string(from: now))")
        
        // Print UTC time for comparison
        let utcFormatter = DateFormatter()
        utcFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss Z"
        utcFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        print("Raw current time in UTC: \(utcFormatter.string(from: now))")
        
        return currentSeconds
    }
    
    /// Find the current period based on the current time in the school's time zone.
    /// Only compares hours and minutes, ignoring seconds for period matching.
    static func findCurrentPeriod(from periods: [PeriodDef]) -> PeriodDef? {
        let currentTimeMinutes = currentTimeInMinutes()
        
        print("Current time in minutes: \(currentTimeMinutes)")
        print("Checking \(periods.count) periods...")
        
        for period in periods {
            guard let startTimeMinutes = timeToMinutes(period.startTime),
                  let endTimeMinutes = timeToMinutes(period.endTime) else {
                print("Failed to parse time for period \(period.periodNo): \(period.startTime) - \(period.endTime)")
                continue
            }
            
            print("Period \(period.periodNo): \(period.startTime) (\(startTimeMinutes) min) - \(period.endTime) (\(endTimeMinutes) min)")
            
            // Check if current time falls within this period
            // Inclusive of start time, exclusive of end time
            if currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes {
                print("Found current period: \(period.periodNo)")
                return period
            }
        }
        
        print("No active period found")
        return nil // No active period
    }
    
    /// Find the current period based on the current time in the school's time zone with second precision.
    static func findCurrentPeriodWithSeconds(from periods: [PeriodDef]) -> PeriodDef? {
        let currentTimeSeconds = currentTimeInSeconds()
        
        print("Current time in seconds: \(currentTimeSeconds)")
        print("Checking \(periods.count) periods...")
        
        for period in periods {
            guard let startTimeSeconds = timeToSeconds(period.startTime),
                  let endTimeSeconds = timeToSeconds(period.endTime) else {
                print("Failed to parse time for period \(period.periodNo): \(period.startTime) - \(period.endTime)")
                continue
            }
            
            print("Period \(period.periodNo): \(period.startTime) (\(startTimeSeconds) sec) - \(period.endTime) (\(endTimeSeconds) sec)")
            
            // Check if current time falls within this period
            // Inclusive of start time, exclusive of end time
            if currentTimeSeconds >= startTimeSeconds && currentTimeSeconds < endTimeSeconds {
                print("Found current period: \(period.periodNo)")
                return period
            }
        }
        
        print("No active period found")
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