import SwiftUI

struct TimetableView: View {
    @StateObject private var viewModel = ScheduleViewModel()

    var body: some View {
        VStack(spacing: 0) {
            if viewModel.isLoading {
                ProgressView("Loading Schedule...")
            } else if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .padding()
            } else {
                headerView
                scheduleGrid
            }
            Spacer() // Pushes content to the top
        }
        .onAppear {
            if viewModel.timetable.isEmpty {
                viewModel.fetchTimetable()
            }
        }
    }
    
    private var headerView: some View {
        VStack {
            HStack {
                Text("Ders Programım")
                    .font(.title2)
                    .fontWeight(.bold)
                if let academicPeriod = viewModel.academicPeriod {
                    Text("(\(academicPeriod))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal)
            .padding(.top)

            HStack {
                Toggle(isOn: $viewModel.showClassCode) {
                    Text("Sınıf adlarını göster")
                }
                .labelsHidden() // Hide the default label
                
                Text("Sınıf adlarını göster")
                    .font(.subheadline)
                
                Spacer()
                
                Button("Tam Ekran") {
                    // Full screen action to be implemented
                }
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(.systemGray5))
                .cornerRadius(8)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .background(Color(.systemBackground))
    }
    
    private var scheduleGrid: some View {
        ScrollView(.horizontal) {
            VStack(alignment: .leading, spacing: 0) {
                // Header Row: DERS/GÜN | 1. DERS | 2. DERS | ...
                HStack(spacing: 0) {
                    Text("DERS/GÜN")
                        .font(.caption).fontWeight(.medium)
                        .frame(width: 100, height: 40)
                        .background(Color(.systemGray6))
                        .border(Color(.systemGray4), width: 0.5)

                    ForEach(1...9, id: \.self) { period in
                        Text("\(period). DERS")
                            .font(.caption).fontWeight(.medium)
                            .frame(width: 120, height: 40)
                            .background(Color(.systemGray6))
                            .border(Color(.systemGray4), width: 0.5)
                    }
                }

                // Data Rows: Day | Course | Course | ...
                ForEach(viewModel.days, id: \.self) { day in
                    HStack(spacing: 0) {
                        Text(day)
                            .font(.caption)
                            .frame(width: 100, height: 80, alignment: .center)
                            .background(Color(.systemGray6))
                            .border(Color(.systemGray4), width: 0.5)

                        ForEach(1...9, id: \.self) { period in
                            if let course = viewModel.course(for: day, period: period) {
                                courseCell(course)
                            } else {
                                emptyCell
                            }
                        }
                    }
                }
            }
            .border(Color(.systemGray4), width: 0.5)
        }
    }
    
    private func courseCell(_ course: TimetableEntry) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            if viewModel.showClassCode {
                Text(course.classList ?? "N/A")
                    .font(.caption)
                    .fontWeight(.bold)
            }
            Text(course.subjectName ?? "N/A")
                .font(.caption)
            
            if let roomCode = course.roomShortName {
                Text("Oda: \(roomCode)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(4)
        .frame(width: 120, height: 80, alignment: .topLeading)
        .background(Color(.systemBackground))
        .border(Color(.systemGray4), width: 0.5)
    }
    
    private var emptyCell: some View {
        Text("-")
            .frame(width: 120, height: 80)
            .background(Color(.systemBackground))
            .border(Color(.systemGray4), width: 0.5)
    }
}

struct TimetableView_Previews: PreviewProvider {
    static var previews: some View {
        TimetableView()
    }
}