// PRD v0.3.45 Part D: JS bridge for iOS Calendar (EventKit - Read-only)
import Foundation
import Capacitor
import EventKit

extension TAIONativePlugin {
    private static let calendarStore = EKEventStore()

    @objc func getCalendarPermissionStatus(_ call: CAPPluginCall) {
        let status = EKEventStore.authorizationStatus(for: .event)
        var statusStr = "notDetermined"
        var isAuthorized = false

        if #available(iOS 17.0, *) {
            switch status {
            case .fullAccess, .authorized:
                statusStr = "authorized"
                isAuthorized = true
            case .writeOnly:
                statusStr = "writeOnly"
            case .denied:
                statusStr = "denied"
            case .restricted:
                statusStr = "restricted"
            default:
                statusStr = "notDetermined"
            }
        } else {
            switch status {
            case .authorized:
                statusStr = "authorized"
                isAuthorized = true
            case .denied:
                statusStr = "denied"
            case .restricted:
                statusStr = "restricted"
            default:
                statusStr = "notDetermined"
            }
        }

        call.resolve([
            "status": statusStr,
            "authorized": isAuthorized
        ])
    }

    @objc func requestCalendarPermission(_ call: CAPPluginCall) {
        let store = TAIONativePlugin.calendarStore
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents { granted, error in
                DispatchQueue.main.async {
                    call.resolve([
                        "granted": granted,
                        "error": error?.localizedDescription ?? ""
                    ])
                }
            }
        } else {
            store.requestAccess(to: .event) { granted, error in
                DispatchQueue.main.async {
                    call.resolve([
                        "granted": granted,
                        "error": error?.localizedDescription ?? ""
                    ])
                }
            }
        }
    }

    @objc func fetchCalendarEvents(_ call: CAPPluginCall) {
        let startDateStr = call.getString("startDate", "")
        let endDateStr = call.getString("endDate", startDateStr)

        guard !startDateStr.isEmpty else {
            call.resolve(["ok": false, "error": "startDate is required", "events": []])
            return
        }

        let store = TAIONativePlugin.calendarStore
        let status = EKEventStore.authorizationStatus(for: .event)
        var isAuth = false
        if #available(iOS 17.0, *) {
            isAuth = (status == .fullAccess || status == .authorized)
        } else {
            isAuth = (status == .authorized)
        }

        guard isAuth else {
            call.resolve(["ok": false, "error": "Not authorized", "events": []])
            return
        }

        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone.current

        guard let startDay = df.date(from: startDateStr) else {
            call.resolve(["ok": false, "error": "Invalid startDate format", "events": []])
            return
        }
        let endDay = df.date(from: endDateStr) ?? startDay
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: startDay)
        let endOfDay = calendar.date(bySettingHour: 23, minute: 59, second: 59, of: endDay) ?? endDay

        let predicate = store.predicateForEvents(withStart: startOfDay, end: endOfDay, calendars: nil)
        let ekEvents = store.events(matching: predicate)

        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"
        timeFormatter.timeZone = TimeZone.current

        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "yyyy-MM-dd"
        dayFormatter.timeZone = TimeZone.current

        var results: [[String: Any]] = []
        for ev in ekEvents {
            let isAllDay = ev.isAllDay
            let evDate = dayFormatter.string(from: ev.startDate)
            let start = isAllDay ? nil : timeFormatter.string(from: ev.startDate)
            let end = isAllDay ? nil : timeFormatter.string(from: ev.endDate)

            var dict: [String: Any] = [
                "id": ev.eventIdentifier ?? UUID().uuidString,
                "title": ev.title ?? "(Không có tiêu đề)",
                "date": evDate,
                "allDay": isAllDay,
                "source": "external:ios-calendar",
                "notes": ev.notes ?? ""
            ]
            if let start = start { dict["start"] = start }
            if let end = end { dict["end"] = end }
            results.append(dict)
        }

        call.resolve([
            "ok": true,
            "events": results
        ])
    }
}
