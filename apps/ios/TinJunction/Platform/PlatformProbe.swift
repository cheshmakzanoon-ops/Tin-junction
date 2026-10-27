#if DEBUG
import Foundation

/// Debug evidence only. Distinguishes a missing callback from an observed nil hinge.
enum PlatformProbe {
    static func encode(viewport: NativeViewport?, hingeAngleDegrees: Double?, hasObservedHinge: Bool) -> String {
        var report: [String: Any] = [
            "formatVersion": 1,
            "hingeObservation": !hasObservedHinge ? "awaiting" : hingeAngleDegrees == nil ? "unavailable" : "measured",
            "hingeAngleDegrees": hingeAngleDegrees.map { $0 as Any } ?? NSNull(),
            "viewport": viewport.map { $0.payload(hingeAngleDegrees: hingeAngleDegrees) as Any } ?? NSNull()
        ]
        #if targetEnvironment(simulator)
        report["isSimulator"] = true
        #else
        report["isSimulator"] = false
        #endif
        guard JSONSerialization.isValidJSONObject(report),
              let data = try? JSONSerialization.data(withJSONObject: report, options: [.sortedKeys]),
              let text = String(data: data, encoding: .utf8) else { return "{}" }
        return text
    }
}
#endif
