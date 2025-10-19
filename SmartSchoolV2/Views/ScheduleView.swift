import SwiftUI

struct ScheduleView: View {
    var body: some View {
        NavigationView {
            TimetableView()
                .navigationBarHidden(true)
        }
    }
}

struct ScheduleView_Previews: PreviewProvider {
    static var previews: some View {
        ScheduleView()
    }
}