import Cocoa

// TAIO Time — Native Frontmost Application Observer (PRD v0.3.54 Part C)
// Listens to NSWorkspace.didActivateApplicationNotification without polling.
// Strictly observes localizedName and bundleIdentifier. Never accesses window titles.

func sanitize(_ s: String) -> String {
    return s.replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "\r", with: " ")
}

func emitApp(_ app: NSRunningApplication?) {
    guard let app = app else { return }
    let name = sanitize(app.localizedName ?? "")
    let bundle = sanitize(app.bundleIdentifier ?? "")
    let line = "{\"appName\":\"\(name)\",\"bundleId\":\"\(bundle)\"}"
    print(line)
    fflush(stdout)
}

// Emit initial frontmost app
emitApp(NSWorkspace.shared.frontmostApplication)

// Register notification observer for active application changes
let center = NSWorkspace.shared.notificationCenter
_ = center.addObserver(
    forName: NSWorkspace.didActivateApplicationNotification,
    object: nil,
    queue: .main
) { notification in
    if let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication {
        emitApp(app)
    }
}

// Keep event loop alive
CFRunLoopRun()
