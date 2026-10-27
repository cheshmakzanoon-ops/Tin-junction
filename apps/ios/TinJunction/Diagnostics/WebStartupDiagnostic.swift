#if DEBUG
import CoreFoundation
import Foundation
import WebKit

/// One read after an actual navigation finishes, enabled only by the explicit
/// UI-test diagnostic. It never waits on, retries or changes app readiness.
@MainActor
final class WebStartupDiagnostic {
    private let enabled: Bool
    private var token: UUID?
    private var deadline: Task<Void, Never>?
    private var deadlineExpired = false

    init(arguments: [String] = ProcessInfo.processInfo.arguments) {
        enabled = arguments.contains("--host-diagnostics")
    }

    func install(in controller: WKUserContentController) {
        guard enabled else { return }
        controller.addUserScript(WKUserScript(source: Self.failureObserver, injectionTime: .atDocumentStart,
                                             forMainFrameOnly: true))
    }

    func cancel() {
        if token != nil { PlatformStartupTrace.record("web.snapshot.cancelled") }
        token = nil
        deadline?.cancel()
        deadline = nil
        deadlineExpired = false
    }

    func capture(in view: WKWebView, host: EngineHostModel) {
        guard enabled, host.isAttached(to: view) else { return }
        cancel()
        let current = UUID(), session = host.sessionID
        token = current
        PlatformStartupTrace.record("web.snapshot.request.phase=\(String(describing: host.phase)).window=\(view.window != nil ? 1 : 0)")
        deadline = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(5)) } catch { return }
            guard let self, !Task.isCancelled, self.token == current else { return }
            self.deadlineExpired = true
            self.deadline = nil
            // This is a diagnostic deadline only. A later response is retained
            // with its actual arrival time if it still belongs to this session.
            PlatformStartupTrace.record("web.snapshot.noCallbackWithin5s")
        }
        view.callAsyncJavaScript(Self.script, arguments: [:], in: nil, in: .page) { [weak self, weak view, weak host] result in
            guard let self, self.token == current else { return }
            self.token = nil
            self.deadline?.cancel()
            self.deadline = nil
            let late = self.deadlineExpired
            self.deadlineExpired = false
            guard let view, let host, host.isAttached(to: view), host.sessionID == session else {
                PlatformStartupTrace.record("web.snapshot.staleCallback")
                return
            }
            PlatformStartupTrace.record("web.snapshot.return.late=\(late ? 1 : 0).phase=\(String(describing: host.phase)).window=\(view.window != nil ? 1 : 0)")
            switch result {
            case .success(let value):
                guard let events = WebStartupSnapshot.events(from: value) else {
                    PlatformStartupTrace.record("web.snapshot.invalid")
                    return
                }
                events.forEach(PlatformStartupTrace.record)
            case .failure:
                // Error descriptions can contain URLs or user content. Keep a
                // fixed event and the actual timing, not arbitrary error text.
                PlatformStartupTrace.record("web.snapshot.evaluationFailed")
            }
        }
    }

    /// Counts alone distinguish an observed script failure from a zero-frame
    /// page. No event is prevented, and error/rejection contents are not read.
    static let failureObserver = """
        (() => {
            let scriptErrors = 0, rejections = 0;
            window.addEventListener('error', () => { scriptErrors = Math.min(32, scriptErrors + 1); });
            window.addEventListener('unhandledrejection', () => { rejections = Math.min(32, rejections + 1); });
            Object.defineProperty(window, '__TIN_STARTUP_FAILURE_COUNTS__', {
                get: () => ({ scriptErrors, rejections }), configurable: false
            });
        })();
        """

    static let script = """
        const diagnostics = window.__TIN_DIAGNOSTICS__;
        const exists = diagnostics !== null && typeof diagnostics === 'object';
        const failures = window.__TIN_STARTUP_FAILURE_COUNTS__;
        const observedFailures = failures !== null && typeof failures === 'object';
        return {
            formatVersion: 1,
            readyState: document.readyState,
            hidden: document.hidden,
            visibilityState: document.visibilityState,
            receiverExists: Boolean(window.TinJunction && typeof window.TinJunction.receiveNative === 'function'),
            diagnosticsExists: exists,
            failureObserverExists: observedFailures,
            scriptErrorCount: observedFailures ? failures.scriptErrors : null,
            unhandledRejectionCount: observedFailures ? failures.rejections : null,
            renderer: exists ? diagnostics.renderer : null,
            frameCount: exists ? diagnostics.frameCount : null,
            initialized: exists ? diagnostics.initialized : null,
            loaded: exists ? diagnostics.loaded : null,
            lifecycle: exists ? diagnostics.lifecycle : null
        };
        """
}

/// Convert only a fixed flat primitive schema into trace-safe event tokens.
/// Neither the diagnostic document name nor its layout, URL or paths are read.
enum WebStartupSnapshot {
    static func events(from value: Any) -> [String]? {
        guard let object = value as? NSDictionary, object.count == 14,
              Set(object.allKeys.compactMap { $0 as? String }) == [
                "formatVersion", "readyState", "hidden", "visibilityState", "receiverExists", "diagnosticsExists",
                "renderer", "frameCount", "initialized", "loaded", "lifecycle",
                "failureObserverExists", "scriptErrorCount", "unhandledRejectionCount"
              ], integer(object["formatVersion"]) == 1,
              let ready = object["readyState"] as? String, ["loading", "interactive", "complete"].contains(ready),
              let hidden = boolean(object["hidden"]),
              let visibility = object["visibilityState"] as? String, ["hidden", "visible"].contains(visibility),
              let receiver = boolean(object["receiverExists"]),
              let exists = boolean(object["diagnosticsExists"]),
              let failureObserver = boolean(object["failureObserverExists"]) else { return nil }
        var events = [
            "web.snapshot.document=\(ready).visibility=\(visibility).hidden=\(hidden ? 1 : 0)",
            "web.snapshot.receiver=\(receiver ? 1 : 0).diagnostics=\(exists ? 1 : 0)"
        ]
        if failureObserver {
            guard let errors = integer(object["scriptErrorCount"]), errors <= 32,
                  let rejections = integer(object["unhandledRejectionCount"]), rejections <= 32 else { return nil }
            events.append("web.snapshot.observer=1.errors=\(errors).rejections=\(rejections)")
        } else {
            guard object["scriptErrorCount"] is NSNull, object["unhandledRejectionCount"] is NSNull else { return nil }
            events.append("web.snapshot.observer=0")
        }
        guard exists else {
            guard ["renderer", "frameCount", "initialized", "loaded", "lifecycle"].allSatisfy({ object[$0] is NSNull }) else { return nil }
            return events
        }
        guard let renderer = object["renderer"] as? String, ["starting", "webgl2", "unavailable"].contains(renderer),
              let frames = integer(object["frameCount"]), let initialized = boolean(object["initialized"]),
              let loaded = boolean(object["loaded"]), let lifecycle = object["lifecycle"] as? String,
              ["running", "paused", "disposed"].contains(lifecycle) else { return nil }
        events.append("web.snapshot.renderer=\(renderer).initialized=\(initialized ? 1 : 0).frames=\(frames)")
        events.append("web.snapshot.loaded=\(loaded ? 1 : 0).lifecycle=\(lifecycle)")
        return events
    }

    private static func boolean(_ value: Any?) -> Bool? {
        guard let number = value as? NSNumber, CFGetTypeID(number) == CFBooleanGetTypeID() else { return nil }
        return number.boolValue
    }
    private static func integer(_ value: Any?) -> Int? {
        guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID(),
              number.doubleValue.isFinite, number.doubleValue >= 0, number.doubleValue <= 1_000_000_000,
              number.doubleValue.rounded() == number.doubleValue else { return nil }
        return number.intValue
    }
}
#endif
