import Foundation
import Capacitor

#if canImport(FamilyControls)
import FamilyControls
#endif

@objc(TAIOScreenTimePlugin)
public class TAIOScreenTimePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TAIOScreenTimePlugin"
    public let jsName = "TAIOScreenTimePlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setThresholds", returnType: CAPPluginReturnPromise)
    ]

    @objc func getStatus(_ call: CAPPluginCall) {
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *) {
            let status = AuthorizationCenter.shared.authorizationStatus
            switch status {
            case .approved:
                call.resolve(["status": "ok"])
            case .denied:
                call.resolve(["status": "notAuthorized"])
            default:
                call.resolve(["status": "notAuthorized"])
            }
            return
        }
        #endif
        call.resolve(["status": "unavailable"])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *) {
            Task {
                do {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    call.resolve(["status": "ok"])
                } catch {
                    call.resolve(["status": "notAuthorized"])
                }
            }
            return
        }
        #endif
        call.resolve(["status": "unavailable"])
    }

    @objc func setThresholds(_ call: CAPPluginCall) {
        call.resolve(["success": true])
    }
}
