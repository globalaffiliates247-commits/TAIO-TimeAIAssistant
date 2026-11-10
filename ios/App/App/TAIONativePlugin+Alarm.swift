// PRD v0.3.24 (B32): JS bridge for block-start alarms. Logic lives in TAIOAlarmService.swift.
import Foundation
import Capacitor

extension TAIONativePlugin {

    /// { name, dataBase64, startSeconds? } -> { ok, soundName, seconds } | { ok:false, error }
    @objc func importAlarmSound(_ call: CAPPluginCall) {
        let name = call.getString("name", "sound.m4a")
        guard let data = call.getString("dataBase64"), !data.isEmpty else {
            call.resolve(["ok": false, "error": "missing_data"])
            return
        }
        let start = call.getDouble("startSeconds", 0)
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let res = try TAIOAlarmService.shared.importSound(originalName: name, base64: data, startSeconds: start)
                call.resolve(["ok": true, "soundName": res.name, "seconds": res.seconds])
            } catch {
                call.resolve(["ok": false, "error": error.localizedDescription])
            }
        }
    }

    /// { soundName } -> { exists }
    @objc func hasAlarmSound(_ call: CAPPluginCall) {
        call.resolve(["exists": TAIOAlarmService.shared.soundExists(call.getString("soundName", ""))])
    }

    /// { alarms: [{ id, title, body, fireAt (epoch ms) }], soundName? } -> { ok, mode, scheduled, soundMissing, alarmKitDenied? }
    /// Replaces all previously scheduled TAIO alarms.
    @objc func scheduleBlockAlarms(_ call: CAPPluginCall) {
        let raw = call.getArray("alarms", JSObject.self) ?? []
        let now = Date()
        let alarms: [TAIOBlockAlarm] = raw.compactMap { item in
            guard let id = item["id"] as? String,
                  let ms = (item["fireAt"] as? NSNumber)?.doubleValue else { return nil }
            let date = Date(timeIntervalSince1970: ms / 1000)
            guard date > now else { return nil }
            return TAIOBlockAlarm(
                id: id,
                title: (item["title"] as? String) ?? "Đến giờ bắt đầu khối việc",
                body: (item["body"] as? String) ?? "",
                fireAt: date
            )
        }
        let soundName = call.getString("soundName")
        Task {
            let res = await TAIOAlarmService.shared.schedule(alarms, soundName: soundName)
            call.resolve(res)
        }
    }

    @objc func cancelBlockAlarms(_ call: CAPPluginCall) {
        Task {
            await TAIOAlarmService.shared.cancelAll()
            call.resolve(["ok": true])
        }
    }

    /// -> { alarmKit: Bool } so the settings screen can describe what this phone supports.
    @objc func getAlarmCapability(_ call: CAPPluginCall) {
        call.resolve(["alarmKit": TAIOAlarmService.shared.alarmKitAvailable])
    }
}
