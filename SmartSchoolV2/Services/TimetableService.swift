import Foundation

class TimetableService {
    func fetchTimetable(completion: @escaping (Result<[TimetableEntry], Error>) -> Void) {
        guard let token = UserDefaults.standard.string(forKey: "accessToken") else {
            completion(.failure(NSError(domain: "TimetableService", code: 401, userInfo: [NSLocalizedDescriptionKey: "User not authenticated"])))
            return
        }

        guard let url = URL(string: "http://localhost:3000/api/timetable/my-schedule") else {
            completion(.failure(NSError(domain: "TimetableService", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "TimetableService", code: 500, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                return
            }

            do {
                let timetable = try JSONDecoder().decode([TimetableEntry].self, from: data)
                completion(.success(timetable))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}