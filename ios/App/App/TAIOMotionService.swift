// PRD FIX v0.3.30 Part B1: Core Motion Service on iPhone
import Foundation
import CoreMotion

public struct TAIOMotionSegmentRaw {
    public let start: TimeInterval   // epoch seconds
    public let end: TimeInterval     // epoch seconds
    public let kind: String          // "stationary", "walking", "running", "cycling", "automotive", "unknown"
    public let confidence: String    // "low", "medium", "high"
}

public struct TAIOPedometerResult {
    public let steps: Int
    public let distanceMeters: Double
}

public final class TAIOMotionService {
    public static let shared = TAIOMotionService()

    private let activityManager = CMMotionActivityManager()
    private let pedometer = CMPedometer()
    private let queue = OperationQueue()

    private init() {
        queue.maxConcurrentOperationCount = 1
        queue.qualityOfService = .userInitiated
    }

    public func getCapability() -> [String: Any] {
        let isActivityAvailable = CMMotionActivityManager.isActivityAvailable()
        let isStepCountingAvailable = CMPedometer.isStepCountingAvailable()
        let isDistanceAvailable = CMPedometer.isDistanceAvailable()

        var statusStr = "notDetermined"
        if #available(iOS 11.0, *) {
            switch CMMotionActivityManager.authorizationStatus() {
            case .authorized:
                statusStr = "authorized"
            case .denied:
                statusStr = "denied"
            case .restricted:
                statusStr = "restricted"
            case .notDetermined:
                statusStr = "notDetermined"
            @unknown default:
                statusStr = "unknown"
            }
        }

        return [
            "supported": isActivityAvailable || isStepCountingAvailable,
            "isActivityAvailable": isActivityAvailable,
            "isStepCountingAvailable": isStepCountingAvailable,
            "isDistanceAvailable": isDistanceAvailable,
            "authorizationStatus": statusStr
        ]
    }

    public func requestPermission(completion: @escaping (Bool, String) -> Void) {
        guard CMMotionActivityManager.isActivityAvailable() else {
            completion(false, "not_supported")
            return
        }

        let now = Date()
        let oneMinuteAgo = now.addingTimeInterval(-60)
        activityManager.queryActivityStarting(from: oneMinuteAgo, to: now, to: queue) { [weak self] activities, error in
            DispatchQueue.main.async {
                if let error = error {
                    let nsError = error as NSError
                    if nsError.domain == CMErrorDomain && nsError.code == Int(CMErrorMotionActivityNotAuthorized.rawValue) {
                        completion(false, "denied")
                    } else {
                        completion(false, error.localizedDescription)
                    }
                    return
                }
                completion(true, "authorized")
            }
        }
    }

    public func queryMotionSegments(from: Date, to: Date, completion: @escaping ([TAIOMotionSegmentRaw]?, Error?) -> Void) {
        guard CMMotionActivityManager.isActivityAvailable() else {
            completion([], nil)
            return
        }

        activityManager.queryActivityStarting(from: from, to: to, to: queue) { activities, error in
            if let error = error {
                completion(nil, error)
                return
            }

            guard let activities = activities, !activities.isEmpty else {
                completion([], nil)
                return
            }

            var segments: [TAIOMotionSegmentRaw] = []
            for i in 0..<activities.count {
                let act = activities[i]
                let startTs = act.startDate.timeIntervalSince1970
                let endTs = (i + 1 < activities.count) ? activities[i + 1].startDate.timeIntervalSince1970 : to.timeIntervalSince1970

                var kind = "unknown"
                if act.walking {
                    kind = "walking"
                } else if act.running {
                    kind = "running"
                } else if act.cycling {
                    kind = "cycling"
                } else if act.automotive {
                    kind = "automotive"
                } else if act.stationary {
                    kind = "stationary"
                }

                var conf = "low"
                switch act.confidence {
                case .high: conf = "high"
                case .medium: conf = "medium"
                case .low: conf = "low"
                @unknown default: conf = "low"
                }

                segments.append(TAIOMotionSegmentRaw(
                    start: startTs,
                    end: endTs,
                    kind: kind,
                    confidence: conf
                ))
            }

            completion(segments, nil)
        }
    }

    public func queryPedometer(from: Date, to: Date, completion: @escaping (TAIOPedometerResult?, Error?) -> Void) {
        guard CMPedometer.isStepCountingAvailable() else {
            completion(TAIOPedometerResult(steps: 0, distanceMeters: 0), nil)
            return
        }

        pedometer.queryPedometerData(from: from, to: to) { data, error in
            if let error = error {
                completion(nil, error)
                return
            }

            let steps = data?.numberOfSteps.intValue ?? 0
            let dist = data?.distance?.doubleValue ?? 0
            completion(TAIOPedometerResult(steps: steps, distanceMeters: dist), nil)
        }
    }
}
