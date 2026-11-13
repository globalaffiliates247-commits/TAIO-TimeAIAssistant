import Foundation
import UIKit
import Capacitor
import SQLite3
import UserNotifications
import CoreLocation
#if canImport(ActivityKit)
import ActivityKit
#endif
#if canImport(WidgetKit)
import WidgetKit
#endif

@objc(TAIONativePlugin)
public class TAIONativePlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "TAIONativePlugin"
    public let jsName = "TAIONative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getCapabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sqliteSetItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sqliteGetItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sqliteGetAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sqliteClearAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startLiveActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateLiveActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLiveActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scheduleNotification", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "registerGeofence", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeGeofence", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openDeviceTimer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise),
        // B32 alarms (TAIONativePlugin+Alarm.swift)
        CAPPluginMethod(name: "importAlarmSound", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hasAlarmSound", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scheduleBlockAlarms", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelBlockAlarms", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAlarmCapability", returnType: CAPPluginReturnPromise),
        // v0.3.30 Part E1 Widget Timeline Sync
        CAPPluginMethod(name: "syncWidgetSchedule", returnType: CAPPluginReturnPromise)
    ]

    private var db: OpaquePointer?
    private let dbQueue = DispatchQueue(label: "club.taio.timeapp.sqlite", qos: .userInitiated)
    private var locationManager: CLLocationManager?

    public override func load() {
        super.load()
        initSQLiteDatabase()
        DispatchQueue.main.async {
            let mgr = CLLocationManager()
            mgr.delegate = self
            self.locationManager = mgr
        }
    }

    deinit {
        if let db = db {
            sqlite3_close(db)
        }
    }

    // MARK: - SQLite3 Durable Storage (E5)

    private func initSQLiteDatabase() {
        dbQueue.sync {
            let fileManager = FileManager.default
            guard let appSupportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
                return
            }
            do {
                try fileManager.createDirectory(at: appSupportDir, withIntermediateDirectories: true, attributes: nil)
                var dbURL = appSupportDir.appendingPathComponent("taio_durable.sqlite3")
                if sqlite3_open(dbURL.path, &self.db) == SQLITE_OK {
                    let createTableSQL = """
                    CREATE TABLE IF NOT EXISTS kv_store (
                        key TEXT PRIMARY KEY NOT NULL,
                        value TEXT NOT NULL,
                        updated_at INTEGER NOT NULL
                    );
                    """
                    sqlite3_exec(self.db, createTableSQL, nil, nil, nil)
                    var resourceValues = URLResourceValues()
                    resourceValues.isExcludedFromBackup = false
                    try? dbURL.setResourceValues(resourceValues)
                }
            } catch {
                print("[TAIONativePlugin] SQLite init error: \(error)")
            }
        }
    }

    @objc func getCapabilities(_ call: CAPPluginCall) {
        var liveActivitiesSupported = false
        if #available(iOS 16.1, *) {
            #if canImport(ActivityKit)
            liveActivitiesSupported = ActivityAuthorizationInfo().areActivitiesEnabled
            #endif
        }
        DispatchQueue.main.async {
            var rawTop: Int = 0
            var rawBottom: Int = 0
            if let vcView = self.webView {
                let insets = vcView.window?.safeAreaInsets ?? vcView.safeAreaInsets
                rawTop = Int(ceil(insets.top))
                rawBottom = Int(ceil(insets.bottom))
            }
            let isPhone = UIDevice.current.userInterfaceIdiom == .phone
            let isPortrait = UIScreen.main.bounds.height >= UIScreen.main.bounds.width
            let safeTop: Int = (isPhone && isPortrait) ? max(rawTop, 59) : max(rawTop, 0)
            let safeBottom: Int = isPhone ? max(rawBottom, 20) : max(rawBottom, 0)
            let hasSQLiteDB: Bool = (self.db != nil)
            let hasGeo: Bool = CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self)

            var payload: [String: Any] = [:]
            payload["isNativeApp"] = true
            payload["platform"] = "ios"
            payload["hasSQLite"] = hasSQLiteDB
            payload["hasLiveActivities"] = true
            payload["liveActivitiesEnabled"] = liveActivitiesSupported
            payload["hasNativeNotifications"] = true
            payload["hasGeofencing"] = hasGeo
            payload["hasShortcutsTimer"] = true
            payload["safeAreaTop"] = safeTop
            payload["safeAreaBottom"] = safeBottom
            call.resolve(payload)
        }
    }

    @objc func sqliteSetItem(_ call: CAPPluginCall) {
        let key = call.getString("key", "")
        let value = call.getString("value", "")
        if key.isEmpty {
            call.resolve(["ok": false, "error": "Missing key"])
            return
        }
        let updatedAt = Int64(call.getDouble("updatedAt", Date().timeIntervalSince1970 * 1000))

        dbQueue.async {
            guard let db = self.db else {
                call.resolve(["ok": false])
                return
            }
            let upsertSQL = "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;"
            var stmt: OpaquePointer?
            var success = false
            if sqlite3_prepare_v2(db, upsertSQL, -1, &stmt, nil) == SQLITE_OK {
                let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
                sqlite3_bind_text(stmt, 1, (key as NSString).utf8String, -1, SQLITE_TRANSIENT)
                sqlite3_bind_text(stmt, 2, (value as NSString).utf8String, -1, SQLITE_TRANSIENT)
                sqlite3_bind_int64(stmt, 3, updatedAt)
                if sqlite3_step(stmt) == SQLITE_DONE {
                    success = true
                }
            }
            sqlite3_finalize(stmt)
            call.resolve(["ok": success, "updatedAt": updatedAt])
        }
    }

    @objc func sqliteGetItem(_ call: CAPPluginCall) {
        let key = call.getString("key", "")
        if key.isEmpty {
            call.resolve(["exists": false])
            return
        }
        dbQueue.async {
            guard let db = self.db else {
                call.resolve(["exists": false])
                return
            }
            let querySQL = "SELECT value, updated_at FROM kv_store WHERE key = ? LIMIT 1;"
            var stmt: OpaquePointer?
            var foundValue: String?
            var foundUpdatedAt: Int64 = 0

            if sqlite3_prepare_v2(db, querySQL, -1, &stmt, nil) == SQLITE_OK {
                let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
                sqlite3_bind_text(stmt, 1, (key as NSString).utf8String, -1, SQLITE_TRANSIENT)
                if sqlite3_step(stmt) == SQLITE_ROW {
                    if let cString = sqlite3_column_text(stmt, 0) {
                        foundValue = String(cString: cString)
                    }
                    foundUpdatedAt = sqlite3_column_int64(stmt, 1)
                }
            }
            sqlite3_finalize(stmt)

            if let val = foundValue {
                call.resolve([
                    "exists": true,
                    "value": val,
                    "updatedAt": foundUpdatedAt
                ])
            } else {
                call.resolve(["exists": false])
            }
        }
    }

    @objc func sqliteGetAll(_ call: CAPPluginCall) {
        dbQueue.async {
            guard let db = self.db else {
                call.resolve(["items": [String: Any]()])
                return
            }
            let querySQL = "SELECT key, value, updated_at FROM kv_store;"
            var stmt: OpaquePointer?
            var items: [String: [String: Any]] = [:]

            if sqlite3_prepare_v2(db, querySQL, -1, &stmt, nil) == SQLITE_OK {
                while sqlite3_step(stmt) == SQLITE_ROW {
                    if let keyC = sqlite3_column_text(stmt, 0),
                       let valC = sqlite3_column_text(stmt, 1) {
                        let k = String(cString: keyC)
                        let v = String(cString: valC)
                        let ts = sqlite3_column_int64(stmt, 2)
                        items[k] = ["value": v, "updatedAt": ts]
                    }
                }
            }
            sqlite3_finalize(stmt)
            call.resolve(["items": items])
        }
    }

    @objc func sqliteClearAll(_ call: CAPPluginCall) {
        dbQueue.async {
            guard let db = self.db else {
                call.resolve(["ok": false])
                return
            }
            sqlite3_exec(db, "DELETE FROM kv_store;", nil, nil, nil)
            call.resolve(["ok": true])
        }
    }

    // MARK: - ActivityKit Live Activities (E4 & B18 & FIX v0.3.30 Part D)

    @objc func startLiveActivity(_ call: CAPPluginCall) {
        let blockId = call.getString("blockId", "now-block")
        let taskTitle = call.getString("taskTitle", "Tập trung sâu")
        let goalName = call.getString("goalName", "Mục tiêu chính")
        let isCountDown = call.getBool("isCountDown", true)
        let totalMinutes = call.getInt("totalMinutes", 60)
        let remainingMinutes = call.getInt("remainingMinutes", 30)

        // FIX v0.3.30 D2.1: Unified units in SECONDS
        let nowSec = Date().timeIntervalSince1970
        let customStart = call.getDouble("startTimestamp")
        let customTarget = call.getDouble("targetTimestamp")

        let startTs = customStart ?? nowSec
        let targetTs = customTarget ?? (startTs + Double(max(1, remainingMinutes) * 60))

        if #available(iOS 16.1, *) {
            #if canImport(ActivityKit)
            // Check if Live Activities are enabled in system settings
            if !ActivityAuthorizationInfo().areActivitiesEnabled {
                call.resolve([
                    "ok": false,
                    "started": false,
                    "native": true,
                    "error": "live_activity_disabled_by_user",
                    "message": "Hoạt động trực tiếp đã bị tắt trong Cài đặt của iPhone. Vui lòng bật lại để hiện đồng hồ trên màn hình khóa."
                ])
                return
            }

            Task {
                for activity in Activity<TAIOTimerAttributes>.activities {
                    await activity.end(dismissalPolicy: .immediate)
                }
                let attributes = TAIOTimerAttributes(blockId: blockId)
                let state = TAIOTimerAttributes.ContentState(
                    taskTitle: taskTitle,
                    goalName: goalName,
                    isCountDown: isCountDown,
                    targetTimestamp: targetTs,
                    startTimestamp: startTs,
                    totalMinutes: totalMinutes,
                    remainingMinutes: remainingMinutes,
                    isPaused: false
                )
                do {
                    let activity = try Activity<TAIOTimerAttributes>.request(
                        attributes: attributes,
                        contentState: state,
                        pushType: nil
                    )
                    call.resolve(["ok": true, "started": true, "activityId": activity.id, "native": true])
                } catch {
                    call.resolve([
                        "ok": false,
                        "started": false,
                        "native": true,
                        "error": error.localizedDescription,
                        "message": error.localizedDescription
                    ])
                }
            }
            return
            #else
            call.resolve([
                "ok": false,
                "started": false,
                "native": true,
                "error": "activity_kit_unavailable",
                "message": "ActivityKit không khả dụng trên thiết bị này."
            ])
            return
            #endif
        } else {
            call.resolve([
                "ok": false,
                "started": false,
                "native": true,
                "error": "ios_version_unsupported",
                "message": "Cần iOS 16.1 trở lên để hiển thị đồng hồ trên màn hình khóa."
            ])
        }
    }

    @objc func updateLiveActivity(_ call: CAPPluginCall) {
        let taskTitle = call.getString("taskTitle", "Tập trung sâu")
        let goalName = call.getString("goalName", "Mục tiêu chính")
        let isCountDown = call.getBool("isCountDown", true)
        let totalMinutes = call.getInt("totalMinutes", 60)
        let remainingMinutes = call.getInt("remainingMinutes", 25)
        let isPaused = call.getBool("isPaused", false)

        // FIX v0.3.30 D2.1: Unified units in SECONDS
        let nowSec = Date().timeIntervalSince1970
        let customStart = call.getDouble("startTimestamp")
        let customTarget = call.getDouble("targetTimestamp")

        let startTs = customStart ?? nowSec
        let targetTs = customTarget ?? (startTs + Double(max(1, remainingMinutes) * 60))

        if #available(iOS 16.1, *) {
            #if canImport(ActivityKit)
            Task {
                let state = TAIOTimerAttributes.ContentState(
                    taskTitle: taskTitle,
                    goalName: goalName,
                    isCountDown: isCountDown,
                    targetTimestamp: targetTs,
                    startTimestamp: startTs,
                    totalMinutes: totalMinutes,
                    remainingMinutes: remainingMinutes,
                    isPaused: isPaused
                )
                for activity in Activity<TAIOTimerAttributes>.activities {
                    await activity.update(using: state)
                }
                call.resolve(["ok": true, "updated": true, "native": true])
            }
            return
            #endif
        }
        call.resolve(["ok": false, "updated": false, "native": true])
    }

    @objc func stopLiveActivity(_ call: CAPPluginCall) {
        if #available(iOS 16.1, *) {
            #if canImport(ActivityKit)
            Task {
                for activity in Activity<TAIOTimerAttributes>.activities {
                    await activity.end(dismissalPolicy: .immediate)
                }
                call.resolve(["ok": true, "native": true])
            }
            return
            #endif
        }
        call.resolve(["ok": true, "native": true])
    }

    @objc func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) {
                if UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url, options: [:]) { success in
                        call.resolve(["ok": success, "opened": success])
                    }
                    return
                }
            }
            call.resolve(["ok": false, "opened": false])
        }
    }

    // MARK: - Widget Timeline Sync (v0.3.30 Part E1 Widget)
    @objc func syncWidgetSchedule(_ call: CAPPluginCall) {
        guard let jsonString = call.getString("scheduleJson") else {
            call.reject("Missing scheduleJson")
            return
        }

        // Write to App Group shared container or standard defaults
        let userDefaults = UserDefaults(suiteName: "group.club.taio.timeapp") ?? UserDefaults.standard
        userDefaults.set(jsonString, forKey: "taio_widget_schedule")
        userDefaults.synchronize()

        #if canImport(WidgetKit)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        #endif

        call.resolve(["ok": true, "synced": true])
    }

    // MARK: - Local Notifications (E4)

    @objc func scheduleNotification(_ call: CAPPluginCall) {
        let id = call.getString("id", "taio-notif-\(Int(Date().timeIntervalSince1970))")
        let title = call.getString("title", "TAIO Time")
        let body = call.getString("body", "")
        let delaySeconds = max(1.0, call.getDouble("delaySeconds", 5.0))

        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else {
                call.resolve(["ok": false, "granted": false])
                return
            }
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = body
            content.sound = .default

            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delaySeconds, repeats: false)
            let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
            center.add(request) { err in
                call.resolve(["ok": err == nil, "granted": true])
            }
        }
    }

    // MARK: - CoreLocation Geofencing (E4 & B30)

    @objc func registerGeofence(_ call: CAPPluginCall) {
        let id = call.getString("id", "place-1")
        let radius = max(100.0, call.getDouble("radiusMeters", 150.0))
        let lat = call.getDouble("latitude", 10.7769)
        let lng = call.getDouble("longitude", 106.7009)

        DispatchQueue.main.async {
            guard let mgr = self.locationManager else {
                call.resolve(["ok": false])
                return
            }
            mgr.requestWhenInUseAuthorization()
            if CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) {
                let center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                let region = CLCircularRegion(center: center, radius: min(radius, mgr.maximumRegionMonitoringDistance), identifier: id)
                region.notifyOnEntry = true
                region.notifyOnExit = true
                mgr.startMonitoring(for: region)
            }
            call.resolve(["ok": true, "native": true, "regionId": id])
        }
    }

    @objc func removeGeofence(_ call: CAPPluginCall) {
        let id = call.getString("id", "")
        DispatchQueue.main.async {
            if let mgr = self.locationManager {
                for region in mgr.monitoredRegions where region.identifier == id {
                    mgr.stopMonitoring(for: region)
                }
            }
            call.resolve(["ok": true])
        }
    }

    // MARK: - iOS Shortcuts / Native Clock Timer Link (E4 & B18)

    @objc func openDeviceTimer(_ call: CAPPluginCall) {
        let minutes = call.getInt("minutes", 25)
        let title = call.getString("title", "TAIO Timer")
        let encodedTitle = title.addingPercentEncoding(withAllowedCharacters: CharacterSet.urlQueryAllowed) ?? "Timer"

        DispatchQueue.main.async {
            if let shortcutURL = URL(string: "shortcuts://run-shortcut?name=TAIO%20Timer&input=text&text=\(minutes)%20\(encodedTitle)"),
               UIApplication.shared.canOpenURL(shortcutURL) {
                UIApplication.shared.open(shortcutURL, options: [:]) { success in
                    call.resolve(["ok": success, "method": "shortcuts"])
                }
                return
            }
            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
                if granted {
                    let content = UNMutableNotificationContent()
                    content.title = "Hết giờ: \(title)"
                    content.body = "Đã hoàn thành phiên \(minutes) phút trong TAIO Time."
                    content.sound = .defaultCritical
                    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(max(1, minutes) * 60), repeats: false)
                    let req = UNNotificationRequest(identifier: "taio-timer-\(Int(Date().timeIntervalSince1970))", content: content, trigger: trigger)
                    center.add(req, withCompletionHandler: nil)
                }
                call.resolve(["ok": true, "method": "native-timer-notification", "minutes": minutes])
            }
        }
    }

    // MARK: - Block-Start Alarm (B32): see TAIONativePlugin+Alarm.swift
}
