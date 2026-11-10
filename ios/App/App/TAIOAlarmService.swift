// PRD v0.3.24 (B32): block-start alarm service.
// - iOS 26+: AlarmKit (system alarm UI on the lock screen, rings through silent mode and Focus).
// - iOS < 26: time-sensitive local notification with the custom sound (max 30 s, follows silent switch).
// - Custom sound: imported once, converted to .caf (linear PCM), trimmed to 30 s, stored in Library/Sounds,
//   so deleting the original file does not break the alarm.
import Foundation
import AVFoundation
import UserNotifications
#if canImport(AlarmKit)
import AlarmKit
import SwiftUI
#endif

struct TAIOBlockAlarm {
    let id: String
    let title: String
    let body: String
    let fireAt: Date
}

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct TAIOAlarmMetadata: AlarmMetadata {}
#endif

final class TAIOAlarmService {
    static let shared = TAIOAlarmService()
    private let idsKey = "taio.alarm.ids.v1"          // blockId -> AlarmKit UUID string
    private let notifPrefix = "taio-alarm-"
    static let maxSoundSeconds: Double = 30

    // MARK: Sound library (Library/Sounds)

    private var soundsDir: URL {
        let lib = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask)[0]
        let dir = lib.appendingPathComponent("Sounds", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    func soundExists(_ soundName: String) -> Bool {
        !soundName.isEmpty && FileManager.default.fileExists(atPath: soundsDir.appendingPathComponent(soundName).path)
    }

    /// Decode base64 audio (mp3, m4a, wav, aac, mp4 audio), convert to .caf, trim to 30 s.
    /// Returns the file name to pass to `.named(...)` / `UNNotificationSoundName`.
    func importSound(originalName: String, base64: String, startSeconds: Double = 0) throws -> (name: String, seconds: Double) {
        let payload = base64.components(separatedBy: ",").last ?? base64   // strip "data:audio/...;base64,"
        guard let data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters) else {
            throw NSError(domain: "TAIOAlarm", code: 1, userInfo: [NSLocalizedDescriptionKey: "File âm thanh không đọc được"])
        }
        let ext = (originalName as NSString).pathExtension.isEmpty ? "m4a" : (originalName as NSString).pathExtension
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + "." + ext)
        try data.write(to: tmp)
        defer { try? FileManager.default.removeItem(at: tmp) }

        let input = try AVAudioFile(forReading: tmp)
        let format = input.processingFormat
        let startFrame = AVAudioFramePosition(max(0, startSeconds) * format.sampleRate)
        if startFrame < input.length { input.framePosition = startFrame }
        let remaining = input.length - input.framePosition
        let frames = AVAudioFrameCount(min(Double(remaining), TAIOAlarmService.maxSoundSeconds * format.sampleRate))

        let base = (originalName as NSString).deletingPathExtension
            .components(separatedBy: CharacterSet.alphanumerics.inverted).joined(separator: "_")
        let name = "taio_\(base.prefix(40))_\(Int(Date().timeIntervalSince1970)).caf"
        let out = soundsDir.appendingPathComponent(name)
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatLinearPCM,
            AVSampleRateKey: format.sampleRate,
            AVNumberOfChannelsKey: format.channelCount,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMIsBigEndianKey: false,
        ]
        let output = try AVAudioFile(forWriting: out, settings: settings, commonFormat: .pcmFormatFloat32, interleaved: false)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else {
            throw NSError(domain: "TAIOAlarm", code: 2, userInfo: [NSLocalizedDescriptionKey: "Không tạo được bộ đệm âm thanh"])
        }
        try input.read(into: buffer, frameCount: frames)
        try output.write(from: buffer)
        return (name, Double(buffer.frameLength) / format.sampleRate)
    }

    // MARK: Scheduling

    var alarmKitAvailable: Bool {
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) { return true }
        #endif
        return false
    }

    /// Replaces every previously scheduled TAIO alarm with `alarms`.
    func schedule(_ alarms: [TAIOBlockAlarm], soundName: String?) async -> [String: Any] {
        await cancelAll()
        let sound = (soundName.map { soundExists($0) } ?? false) ? soundName : nil
        let soundMissing = soundName != nil && sound == nil

        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) {
            let manager = AlarmManager.shared
            var state = manager.authorizationState
            if state == .notDetermined { state = (try? await manager.requestAuthorization()) ?? .denied }
            if state == .authorized {
                var ids: [String: String] = [:]
                for a in alarms {
                    let uuid = UUID()
                    let alert = AlarmPresentation.Alert(
                        title: LocalizedStringResource(stringLiteral: a.title),
                        stopButton: AlarmButton(text: "Đã biết", textColor: .white, systemImageName: "checkmark")
                    )
                    let attributes = AlarmAttributes<TAIOAlarmMetadata>(
                        presentation: AlarmPresentation(alert: alert),
                        metadata: TAIOAlarmMetadata(),
                        tintColor: Color(red: 0.88, green: 0.25, blue: 0.12)
                    )
                    let config = AlarmManager.AlarmConfiguration<TAIOAlarmMetadata>(
                        schedule: .fixed(a.fireAt),
                        attributes: attributes,
                        sound: sound.map { .named($0) } ?? .default
                    )
                    do {
                        _ = try await manager.schedule(id: uuid, configuration: config)
                        ids[a.id] = uuid.uuidString
                    } catch {
                        NSLog("[TAIOAlarm] AlarmKit schedule failed: \(error)")
                    }
                }
                UserDefaults.standard.set(ids, forKey: idsKey)
                return ["ok": true, "mode": "alarmkit", "scheduled": ids.count, "soundMissing": soundMissing]
            }
            // Not authorized: fall through to notifications, report it so the UI can explain.
            let res = await scheduleNotifications(alarms, sound: sound)
            return res.merging(["alarmKitDenied": true, "soundMissing": soundMissing]) { a, _ in a }
        }
        #endif
        let res = await scheduleNotifications(alarms, sound: sound)
        return res.merging(["soundMissing": soundMissing]) { a, _ in a }
    }

    private func scheduleNotifications(_ alarms: [TAIOBlockAlarm], sound: String?) async -> [String: Any] {
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        guard granted else { return ["ok": false, "mode": "notification", "reason": "notification_permission_denied"] }
        var count = 0
        for a in alarms {
            let content = UNMutableNotificationContent()
            content.title = a.title
            content.body = a.body
            content.sound = sound.map { UNNotificationSound(named: UNNotificationSoundName($0)) } ?? .default
            content.interruptionLevel = .timeSensitive
            let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: a.fireAt)
            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
            do {
                try await center.add(UNNotificationRequest(identifier: notifPrefix + a.id, content: content, trigger: trigger))
                count += 1
            } catch {
                NSLog("[TAIOAlarm] notification schedule failed: \(error)")
            }
        }
        return ["ok": true, "mode": "notification", "scheduled": count]
    }

    func cancelAll() async {
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) {
            let ids = UserDefaults.standard.dictionary(forKey: idsKey) as? [String: String] ?? [:]
            for value in ids.values { if let uuid = UUID(uuidString: value) { try? AlarmManager.shared.cancel(id: uuid) } }
            UserDefaults.standard.removeObject(forKey: idsKey)
        }
        #endif
        let center = UNUserNotificationCenter.current()
        let pending = await center.pendingNotificationRequests()
        center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix(notifPrefix) })
    }
}
