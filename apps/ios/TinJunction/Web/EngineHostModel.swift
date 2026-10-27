import Combine
import Foundation
import WebKit

@MainActor
final class EngineHostModel: ObservableObject {
    enum Lifecycle: String { case active, inactive, background }
    enum Phase: Equatable { case loading, restoring, ready, recovering, failed }
    enum SaveState: Equatable { case unsaved, saving, saved, recovered, failed, blocked }
    private static let protectedSaveCodes: Set<String> = [
        "no_valid_save", "stale_checkpoint", "revision_conflict", "checkpoint_conflict",
        "different_document", "invalid_stored_generation"
    ]

    @Published private(set) var phase: Phase = .loading
    @Published private(set) var status = "Opening your miniature…"
    @Published private(set) var isReady = false
    @Published private(set) var hingeDescription = "awaiting system context"
    #if DEBUG
    @Published private(set) var platformProbeJSON = "{}"
    private var hasObservedHinge = false
    #endif
    @Published private(set) var saveState: SaveState = .unsaved
    @Published private(set) var saveDescription = "Not saved yet"
    @Published private(set) var durableRevision: Int?
    @Published private(set) var durableCheckpoint: Int?
    @Published private(set) var hasRestoredLayout = false
    private(set) var isBridgeReady = false
    private(set) var sessionID = UUID().uuidString

    private let store: any LayoutStoring
    private weak var webView: WKWebView?
    private var lifecycle: Lifecycle = .inactive
    private var viewport: NativeViewport?
    private var hingeAngleDegrees: Double?
    private var nextMessageID: UInt64 = 0
    private var loadGeneration: UInt64 = 0
    private var processRecoveryAttempts = 0
    private var acceptedIDs: [String] = []
    private var recoveringRenderer = false
    private var acceptedLayout = false
    private var restorePrepared = false
    private var activeDocumentID: String?
    private var restoredLayout: StoredLayout?
    private var pendingSaveCount = 0
    private var pendingRequestIDs: Set<String> = []
    private var protectedSaveCode: String?
    private var handshakeTimeoutTask: Task<Void, Never>?
    private var deliveryTask: Task<Void, Never>?
    private var restoreTask: Task<Void, Never>?
    private var saveTask: Task<Void, Never>?

    init(store: any LayoutStoring = LayoutStore()) { self.store = store }

    func attach(_ webView: WKWebView) { self.webView = webView }

    /// Used by orderly teardown and deterministic host tests. Acknowledgements
    /// still originate exclusively from completed store operations.
    func awaitPendingStorage() async {
        if let restoreTask { await restoreTask.value }
        if let saveTask { await saveTask.value }
    }

    func detach() {
        cancelSession()
        isReady = false
        webView = nil
    }

    private func cancelSession() {
        loadGeneration += 1
        handshakeTimeoutTask?.cancel()
        handshakeTimeoutTask = nil
        deliveryTask?.cancel()
        deliveryTask = nil
        restoreTask?.cancel()
        restoreTask = nil
        saveTask?.cancel()
        saveTask = nil
        pendingSaveCount = 0
        pendingRequestIDs.removeAll(keepingCapacity: true)
        isBridgeReady = false
        acceptedLayout = false
        restorePrepared = false
    }

    func loading() {
        cancelSession()
        sessionID = UUID().uuidString
        recoveringRenderer = false
        isReady = false
        hasRestoredLayout = false
        activeDocumentID = nil
        restoredLayout = nil
        protectedSaveCode = nil
        saveState = .unsaved
        acceptedIDs.removeAll(keepingCapacity: true)
        phase = .loading
        status = "Opening your miniature…"
        let generation = loadGeneration
        handshakeTimeoutTask = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(20)) }
            catch { return }
            guard let self, !Task.isCancelled, self.loadGeneration == generation,
                  !self.isReady else { return }
            self.fail("The railway took too long to open. Try loading it again. Your saved layout is retained.")
        }
    }

    func fail(_ description: String) {
        cancelSession()
        recoveringRenderer = false
        isReady = false
        phase = .failed
        status = String(description.prefix(240))
    }

    func retryLoading() {
        guard let webView else { return }
        processRecoveryAttempts = 0
        loading()
        webView.load(URLRequest(url: BundleResourcePolicy.entryURL))
    }

    func accept(_ envelope: BridgeEnvelope) {
        guard !acceptedIDs.contains(envelope.id) else { return }
        acceptedIDs.append(envelope.id)
        if acceptedIDs.count > 256 { acceptedIDs.removeFirst() }
        switch envelope.type {
        case "web.ready":
            guard !isBridgeReady else { return }
            isBridgeReady = true
            recoveringRenderer = false
            isReady = false
            phase = .restoring
            status = "Opening your saved railway…"
            #if DEBUG
            let debug = true
            #else
            let debug = false
            #endif
            send(type: "native.bootstrap", payload: ["host": "ios", "debug": debug, "sessionId": sessionID])
            sendLifecycle()
            sendViewport()
            restoreSavedLayout()
        case "layout.loaded":
            acceptLoadedLayout(envelope)
        case "layout.checkpoint":
            acceptCheckpoint(envelope)
        case "engine.error":
            let code = envelope.payload["code"]?.string ?? "invalid_error"
            if envelope.payload["recoverable"] == .boolean(true), isBridgeReady {
                recoveringRenderer = true
                isReady = false
                phase = .recovering
                status = "Restoring the railway view (\(code))…"
            } else {
                fail("The railway view could not open: " + (envelope.payload["message"]?.string ?? code))
            }
        case "engine.metrics":
            if isBridgeReady, acceptedLayout, recoveringRenderer,
               case .some(.number(let frames)) = envelope.payload["frames"], frames > 0,
               envelope.payload["evidenceKind"] == .string("diagnostic-only") {
                recoveringRenderer = false
                isReady = true
                phase = .ready
                status = "The railway view has recovered."
            }
        default: break
        }
    }

    private func restoreSavedLayout() {
        let generation = loadGeneration
        restoreTask?.cancel()
        restoreTask = Task { [weak self] in
            guard let self else { return }
            do {
                let stored = try await self.store.load()
                guard !Task.isCancelled, self.loadGeneration == generation, self.isBridgeReady else { return }
                self.restoredLayout = stored
                self.hasRestoredLayout = stored != nil
                self.activeDocumentID = stored?.document.documentId
                self.durableRevision = stored?.document.revision
                self.durableCheckpoint = stored?.checkpoint
                if let stored {
                    self.saveState = stored.recovered ? .recovered : .saved
                    self.saveDescription = stored.recovered ? "Recovered previous save" : "Last saved on this iPhone"
                } else {
                    self.saveState = .unsaved
                    self.saveDescription = "Not saved yet"
                }
                let document: Any
                if let stored { document = try stored.document.stoppedForRestore().bridgeObject() }
                else { document = NSNull() }
                self.restorePrepared = true
                self.send(type: "native.layout", payload: [
                    "sessionId": self.sessionID, "document": document,
                    "checkpoint": stored?.checkpoint ?? 0, "recovered": stored?.recovered ?? false
                ])
            } catch {
                guard !Task.isCancelled, self.loadGeneration == generation else { return }
                self.fail("Your saved railway could not be read. Its files have been preserved. Try again; the app will not replace it with a new layout.")
            }
        }
    }

    private func acceptLoadedLayout(_ envelope: BridgeEnvelope) {
        guard isBridgeReady, restorePrepared, !acceptedLayout,
              envelope.payload["sessionId"]?.string == sessionID,
              let documentID = envelope.payload["documentId"]?.string,
              let revision = envelope.payload["revision"]?.integer else { return }
        if let restoredLayout {
            guard documentID == restoredLayout.document.documentId, revision == restoredLayout.document.revision else {
                fail("The railway did not accept the saved layout. Your saved files have been preserved.")
                return
            }
        } else {
            guard revision == 0 else { return }
        }
        activeDocumentID = documentID
        acceptedLayout = true
        handshakeTimeoutTask?.cancel()
        handshakeTimeoutTask = nil
        isReady = !recoveringRenderer
        phase = recoveringRenderer ? .recovering : .ready
        status = restoredLayout?.recovered == true
            ? "A previous verified save was restored. Your most recent changes may be missing."
            : "Your miniature railway is ready."
    }

    private func acceptCheckpoint(_ envelope: BridgeEnvelope) {
        guard isBridgeReady, acceptedLayout,
              envelope.payload["sessionId"]?.string == sessionID,
              let requestID = envelope.payload["requestId"]?.string,
              let checkpoint = envelope.payload["checkpoint"]?.integer,
              case .some(.object(let rawDocument)) = envelope.payload["document"],
              let document = try? LayoutDocument.decode(rawDocument.mapValues(\.foundationValue)),
              document.documentId == activeDocumentID else { return }
        if let protectedSaveCode {
            sendSaveFailure(requestID: requestID, code: protectedSaveCode)
            return
        }
        // Retransmission while the first write is pending shares its eventual
        // acknowledgement. It cannot consume another queue slot or write twice.
        guard !pendingRequestIDs.contains(requestID) else { return }
        guard pendingSaveCount < 8 else {
            sendSaveFailure(requestID: requestID, code: "save_queue_full")
            return
        }
        let expectedRevision = envelope.payload["expectedRevision"]?.integer
        let generation = loadGeneration
        let predecessor = saveTask
        pendingSaveCount += 1
        pendingRequestIDs.insert(requestID)
        saveState = .saving
        saveDescription = "Saving…"
        saveTask = Task { [weak self] in
            if let predecessor { await predecessor.value }
            guard let self, !Task.isCancelled, self.loadGeneration == generation, self.isBridgeReady else { return }
            defer {
                if self.loadGeneration == generation {
                    self.pendingSaveCount = max(self.pendingSaveCount - 1, 0)
                    self.pendingRequestIDs.remove(requestID)
                }
            }
            if let protectedSaveCode = self.protectedSaveCode {
                self.sendSaveFailure(requestID: requestID, code: protectedSaveCode)
                return
            }
            do {
                let stored = try await self.store.save(document: document, checkpoint: checkpoint, expectedRevision: expectedRevision)
                guard !Task.isCancelled, self.loadGeneration == generation, self.isBridgeReady else { return }
                self.durableRevision = stored.document.revision
                self.durableCheckpoint = stored.checkpoint
                self.saveState = self.pendingSaveCount > 1 ? .saving : .saved
                self.saveDescription = self.pendingSaveCount > 1 ? "Saving…" : "Last saved on this iPhone"
                self.send(type: "native.saved", payload: [
                    "sessionId": self.sessionID, "requestId": requestID,
                    "documentId": stored.document.documentId, "revision": stored.document.revision,
                    "checkpoint": stored.checkpoint, "checksum": stored.checksum
                ])
            } catch {
                guard !Task.isCancelled, self.loadGeneration == generation else { return }
                let code = (error as? LayoutStore.Failure)?.rawValue ?? "write_failed"
                if Self.protectedSaveCodes.contains(code) {
                    self.protectedSaveCode = code
                    self.saveState = .blocked
                    self.saveDescription = "Saved copy protected — edits remain open"
                } else {
                    self.saveState = .failed
                    self.saveDescription = "Save failed — your edits are still open"
                }
                self.sendSaveFailure(requestID: requestID, code: code)
            }
        }
    }

    private func sendSaveFailure(requestID: String, code: String) {
        let message = Self.protectedSaveCodes.contains(code)
            ? "Saving is paused to protect a conflicting or unreadable saved copy. Your current edits remain open. Reopening attempts to load saved data and discards unsaved changes."
            : "Your railway could not be saved. Your current edits remain open. Try saving again."
        send(type: "native.saveFailed", payload: [
            "sessionId": sessionID, "requestId": requestID, "code": code,
            "message": message
        ])
    }

    func requestCheckpoint() {
        guard isBridgeReady, acceptedLayout, protectedSaveCode == nil else { return }
        send(type: "native.requestCheckpoint", payload: ["sessionId": sessionID])
    }

    func updateLifecycle(_ value: Lifecycle) {
        lifecycle = value
        sendLifecycle()
        if value != .active { requestCheckpoint() }
    }

    func updateViewport(_ value: NativeViewport) {
        guard value.isValid else { return }
        viewport = value
        #if DEBUG
        refreshPlatformProbe()
        #endif
        sendViewport()
    }

    func updateHinge(angleDegrees: Double?) {
        if let angleDegrees {
            guard angleDegrees.isFinite, (0...360).contains(angleDegrees) else { return }
        }
        hingeAngleDegrees = angleDegrees
        #if DEBUG
        hasObservedHinge = true
        refreshPlatformProbe()
        #endif
        if let angleDegrees {
            hingeDescription = "measured \(angleDegrees.formatted(.number.precision(.fractionLength(1))))°"
        } else {
            hingeDescription = "no hinge in current context"
        }
        sendViewport()
    }

    #if DEBUG
    /// Read-only observations, never a synthetic hinge or device-eligibility signal.
    private func refreshPlatformProbe() {
        platformProbeJSON = PlatformProbe.encode(viewport: viewport,
            hingeAngleDegrees: hingeAngleDegrees, hasObservedHinge: hasObservedHinge)
    }
    #endif

    func contentProcessTerminated() {
        loading()
        guard processRecoveryAttempts == 0, let webView else {
            fail("The railway view stopped again. Try loading it again. The last acknowledged save is retained.")
            return
        }
        processRecoveryAttempts += 1
        phase = .recovering
        status = "Restoring the last saved railway after the view stopped…"
        webView.load(URLRequest(url: BundleResourcePolicy.entryURL))
    }

    private func sendLifecycle() { send(type: "native.lifecycle", payload: ["state": lifecycle.rawValue]) }

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
                self.fail("The connection to the railway view stopped. Try loading again; your saved layout is retained.")
            }
        }
    }
}
