import Foundation
import Combine

class ScheduleViewModel: ObservableObject {
    @Published var timetable: [TimetableEntry] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showClassCode = false

    private let timetableService = TimetableService()
    
    var academicPeriod: String? {
        timetable.first?.academicPeriod
    }
    
    // Define days and periods for the schedule grid
    let days = ["PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMA"]
    let periods = (1...8).map { "\($0). DERS" }

    func fetchTimetable() {
        isLoading = true
        errorMessage = nil

        timetableService.fetchTimetable { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false
                switch result {
                case .success(let timetable):
                    self?.timetable = timetable.sorted {
                        if $0.dayOfWeek ?? 0 != $1.dayOfWeek ?? 0 {
                            return ($0.dayOfWeek ?? 0) < ($1.dayOfWeek ?? 0)
                        }
                        return ($0.periodNo ?? 0) < ($1.periodNo ?? 0)
                    }
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func course(for day: String, period: Int) -> TimetableEntry? {
        guard let dayIndex = days.firstIndex(of: day) else {
            return nil
        }
        // DayOfWeek from JSON is 1-based (1 for Monday), which matches dayIndex + 1
        let targetDayOfWeek = dayIndex + 1
        
        return timetable.first { $0.dayOfWeek == targetDayOfWeek && $0.periodNo == period }
    }
}