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
    }
    #endif
}

#if DEBUG
struct PlatformTraceBuffer {
    private(set) var entries: [String] = []
    mutating func append(event: String, elapsed: Double) -> Bool {
        guard entries.count < 128, event.utf8.count <= 96, elapsed.isFinite, elapsed >= 0,
              event.unicodeScalars.allSatisfy({ CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._=-").contains($0) }) else { return false }
        entries.append(event)
        return true
    }
}
#endif
