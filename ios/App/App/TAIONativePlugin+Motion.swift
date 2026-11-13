// PRD FIX v0.3.30 Part B1: Capacitor plugin bridge for Core Motion
import Foundation
import Capacitor

extension TAIONativePlugin {

    @objc func getMotionCapability(_ call: CAPPluginCall) {
        let cap = TAIOMotionService.shared.getCapability()
        call.resolve(cap)
    }

    @objc func requestMotionPermission(_ call: CAPPluginCall) {
        TAIOMotionService.shared.requestPermission { granted, status in
            call.resolve([
                "ok": granted,
                "status": status
            ])
        }
    }

    @objc func queryMotionSegments(_ call: CAPPluginCall) {
        let fromSec = call.getDouble("from", 0)
        let toSec = call.getDouble("to", Date().timeIntervalSince1970)

        guard fromSec > 0 else {
            call.reject("Invalid 'from' timestamp")
            return
        }

        let fromDate = Date(timeIntervalSince1970: fromSec)
        let toDate = Date(timeIntervalSince1970: toSec)

        TAIOMotionService.shared.queryMotionSegments(from: fromDate, to: toDate) { segments, error in
            if let error = error {
                call.reject("queryMotionSegments failed: \(error.localizedDescription)")
                return
            }

            let rawList: [[String: Any]] = (segments ?? []).map { seg in
                return [
                    "start": seg.start,
                    "end": seg.end,
                    "kind": seg.kind,
                    "confidence": seg.confidence
                ]
            }

            call.resolve([
                "ok": true,
                "segments": rawList
            ])
        }
    }

    @objc func queryPedometer(_ call: CAPPluginCall) {
        let fromSec = call.getDouble("from", 0)
        let toSec = call.getDouble("to", Date().timeIntervalSince1970)

        guard fromSec > 0 else {
            call.reject("Invalid 'from' timestamp")
            return
        }

        let fromDate = Date(timeIntervalSince1970: fromSec)
        let toDate = Date(timeIntervalSince1970: toSec)

        TAIOMotionService.shared.queryPedometer(from: fromDate, to: toDate) { result, error in
            if let error = error {
                call.reject("queryPedometer failed: \(error.localizedDescription)")
                return
            }

            call.resolve([
                "ok": true,
                "steps": result?.steps ?? 0,
                "distanceMeters": result?.distanceMeters ?? 0
            ])
        }
    }
}
