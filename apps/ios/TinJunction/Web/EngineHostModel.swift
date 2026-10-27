import Combine
import Foundation
import WebKit

@MainActor
final class EngineHostModel: ObservableObject {
    enum Lifecycle: String { case active, inactive, background }
    @Published private(set) var status = "Loading bundled renderer…"
    @Published private(set) var isReady = false
    @Published private(set) var hingeDescription = "awaiting system context"
    private(set) var isBridgeReady = false

    private weak var webView: WKWebView?
    private var lifecycle: Lifecycle = .inactive
    private var viewport: NativeViewport?
    private var hingeAngleDegrees: Double?
    private var nextMessageID: UInt64 = 0
    private var loadGeneration: UInt64 = 0
    private var processRecoveryAttempts = 0
    private var acceptedIDs: [String] = []
    private var recoveringRenderer = false
    private var handshakeTimeoutTask: Task<Void, Never>?
    private var deliveryTask: Task<Void, Never>?

    func attach(_ webView: WKWebView) { self.webView = webView }
    func detach() {
        loadGeneration += 1
        handshakeTimeoutTask?.cancel()
        handshakeTimeoutTask = nil
        deliveryTask?.cancel()
        deliveryTask = nil
        isBridgeReady = false
        webView = nil
    }

    func loading() {
        loadGeneration += 1
        handshakeTimeoutTask?.cancel()
        deliveryTask?.cancel()
        deliveryTask = nil
        isBridgeReady = false
        recoveringRenderer = false
        isReady = false
        acceptedIDs.removeAll(keepingCapacity: true)
        status = "Loading bundled renderer…"
        let generation = loadGeneration
        handshakeTimeoutTask = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(20)) }
            catch { return }
            guard let self, !Task.isCancelled, self.loadGeneration == generation,
                  !self.isBridgeReady else { return }
            self.fail("Renderer handshake timed out. Inspect bundled scripts, CSP and WebKit diagnostics.")
        }
    }

    func fail(_ description: String) {
        loadGeneration += 1
        handshakeTimeoutTask?.cancel()
        handshakeTimeoutTask = nil
        deliveryTask?.cancel()
        deliveryTask = nil
        isBridgeReady = false
        recoveringRenderer = false
        isReady = false
        status = String(description.prefix(240))
    }

    func accept(_ envelope: BridgeEnvelope) {
        guard !acceptedIDs.contains(envelope.id) else { return }
        acceptedIDs.append(envelope.id)
        if acceptedIDs.count > 256 { acceptedIDs.removeFirst() }
        switch envelope.type {
        case "web.ready":
            guard !isBridgeReady else { return }
            handshakeTimeoutTask?.cancel()
            handshakeTimeoutTask = nil
            isBridgeReady = true
            recoveringRenderer = false
            isReady = true
            status = "Bundled WebGL2 bridge ready — harness, not game"
            #if DEBUG
            let debug = true
            #else
            let debug = false
            #endif
            send(type: "native.bootstrap", payload: ["host": "ios", "debug": debug])
            sendLifecycle()
            sendViewport()
        case "engine.error":
            let code = envelope.payload["code"]?.string ?? "invalid_error"
            if envelope.payload["recoverable"] == .boolean(true), isBridgeReady {
                // The JavaScript receiver survives a WebGL context loss. Keep
                // lifecycle/viewport transport alive while visible readiness waits
                // for a new rendered-frame metrics event after restoration.
                recoveringRenderer = true
                isReady = false
                status = "Renderer recovering: \(code)"
            } else {
                fail("Renderer error: " + (envelope.payload["message"]?.string ?? code))
            }
        case "engine.metrics":
            if isBridgeReady, recoveringRenderer,
               case .some(.number(let frames)) = envelope.payload["frames"], frames > 0,
               envelope.payload["evidenceKind"] == .string("diagnostic-only") {
                recoveringRenderer = false
                isReady = true
                status = "Bundled WebGL2 renderer recovered — harness, not game"
            }
            // Reserved for bounded, explicitly versioned diagnostics. No telemetry,
            // filesystem, engine-command, or arbitrary script authority is granted.
            break
        default: break // Decoding rejects unsupported types before this point.
        }
    }

    func updateLifecycle(_ value: Lifecycle) {
        lifecycle = value
        sendLifecycle()
    }

    func updateViewport(_ value: NativeViewport) {
        guard value.isValid else { return }
        viewport = value
        sendViewport()
    }

    func updateHinge(angleDegrees: Double?) {
        if let angleDegrees {
            guard angleDegrees.isFinite, (0...360).contains(angleDegrees) else { return }
        }
        hingeAngleDegrees = angleDegrees
        if let angleDegrees {
            hingeDescription = "measured \(angleDegrees.formatted(.number.precision(.fractionLength(1))))°"
        } else {
            hingeDescription = "no hinge in current context"
        }
        sendViewport()
    }

    func contentProcessTerminated() {
        loading()
        // One bounded reload is useful for the harness. Production recovery must
        // restore a native persisted snapshot and prove the last acknowledged save.
        guard processRecoveryAttempts == 0, let webView else {
            fail("Web content process stopped again. Relaunch and inspect diagnostics.")
            return
        }
        processRecoveryAttempts += 1
        status = "Web content process stopped; attempting one clean reload…"
        webView.load(URLRequest(url: BundleResourcePolicy.entryURL))
    }

    private func sendLifecycle() {
        send(type: "native.lifecycle", payload: ["state": lifecycle.rawValue])
    }

    private func sendViewport() {
        guard let viewport else { return }
        send(type: "native.viewport", payload: viewport.payload(hingeAngleDegrees: hingeAngleDegrees))
    }

    private func send(type: String, payload: [String: Any]) {
        guard isBridgeReady, let webView else { return }
        nextMessageID += 1
        let envelope: [String: Any] = [
            "version": 1, "id": "native-\(nextMessageID)", "type": type, "payload": payload
        ]
        let generation = loadGeneration
        // The program is constant. Data is passed through WebKit arguments, never
        // interpolated into evaluated JavaScript source.
        // Chain the actor-isolated tasks explicitly: independently launched Tasks
        // do not promise FIFO delivery of bootstrap, lifecycle and viewport.
        let predecessor = deliveryTask
        deliveryTask = Task { @MainActor [weak self, weak webView] in
            if let predecessor { await predecessor.value }
            guard !Task.isCancelled, let self, let webView,
                  self.loadGeneration == generation, self.isBridgeReady else { return }
            do {
                _ = try await webView.callAsyncJavaScript(
                    """
                    if (!window.TinJunction || typeof window.TinJunction.receiveNative !== 'function') {
                        throw new Error('TinJunction receiver is unavailable');
                    }
                    window.TinJunction.receiveNative(message);
                    """,
                    arguments: ["message": envelope], in: nil, contentWorld: .page
                )
            } catch {
                guard self.loadGeneration == generation, !Task.isCancelled else { return }
                self.fail("Native bridge delivery failed: \(error.localizedDescription)")
            }
        }
    }
}
