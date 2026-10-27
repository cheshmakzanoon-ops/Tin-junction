import Foundation

/// Fixed startup events only; no documents, user names, URLs or filesystem paths.
enum PlatformStartupTrace {
    static func record(_ event: String) {
        #if DEBUG
        sink.record(event)
        #endif
    }

    #if DEBUG
    private static let sink = Sink()

    /// Read on demand by the explicit UI-test diagnostic. This does not poll,
    /// send bridge messages, or change the renderer's readiness deadline.
    static func snapshotJSON() -> String { sink.snapshotJSON() }

    /// Scheme callbacks and native UI events may arrive on different threads.
    private final class Sink: @unchecked Sendable {
        private let lock = NSLock()
        private let started = ProcessInfo.processInfo.systemUptime
        private var buffer = PlatformTraceBuffer()

        func record(_ event: String) {
            lock.lock()
            defer { lock.unlock() }
            let elapsed = ProcessInfo.processInfo.systemUptime - started
            guard buffer.append(event: event, elapsed: elapsed) else { return }
            NSLog("[TinStartup] +%.3fs %@", elapsed, event)
        }

        func snapshotJSON() -> String {
            lock.lock()
            defer { lock.unlock() }
            return buffer.snapshotJSON()
        }
    }
    #endif
}

#if DEBUG
struct PlatformTraceBuffer {
    private(set) var entries: [String] = []
    private var elapsedSeconds: [Double] = []
    mutating func append(event: String, elapsed: Double) -> Bool {
        guard entries.count < 128, event.utf8.count <= 96, elapsed.isFinite, elapsed >= 0,
              event.unicodeScalars.allSatisfy({ CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._=-").contains($0) }) else { return false }
        entries.append(event)
        elapsedSeconds.append(elapsed)
        return true
    }

    func snapshotJSON() -> String {
        let observations = zip(entries, elapsedSeconds).map { event, elapsed in
            ["event": event, "elapsedSeconds": elapsed] as [String: Any]
        }
        let object: [String: Any] = ["formatVersion": 1, "capacity": 128, "events": observations]
        guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]),
              let text = String(data: data, encoding: .utf8) else { return "{}" }
        return text
    }
}
#endif
