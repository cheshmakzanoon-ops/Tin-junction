import XCTest
@testable import TinJunction

private actor HostTestStore: LayoutStoring {
    var initial: StoredLayout?
    let failLoad: Bool
    let failSave: Bool
    private var saveCount = 0

    init(initial: StoredLayout? = nil, failLoad: Bool = false, failSave: Bool = false) {
        self.initial = initial
        self.failLoad = failLoad
        self.failSave = failSave
    }

    func load() throws -> StoredLayout? {
        if failLoad { throw LayoutStore.Failure.noValidSave }
        return initial
    }

    func save(document: LayoutDocument, checkpoint: Int, expectedRevision: Int?) throws -> StoredLayout {
        saveCount += 1
        if failSave { throw LayoutStore.Failure.injectedWriteFailure }
        let stored = StoredLayout(document: document, checkpoint: checkpoint, checksum: String(repeating: "a", count: 64), recovered: false)
        initial = stored
        return stored
    }

    func numberOfSaves() -> Int { saveCount }
}

@MainActor
final class EngineHostModelTests: XCTestCase {
    private func envelope(_ id: String, _ type: String, _ payload: [String: Any]) throws -> BridgeEnvelope {
        try BridgeEnvelope.decode(["version": 1, "id": id, "type": type, "payload": payload])
    }

    private func start(_ host: EngineHostModel) async throws {
        host.loading()
        host.accept(try envelope("ready-1", "web.ready", ["build": "first-railway", "protocolVersion": 1, "renderer": "webgl2"]))
        await host.awaitPendingStorage()
    }

    private func acknowledgeLayout(_ host: EngineHostModel, revision: Int = 0) throws {
        host.accept(try envelope("loaded-1", "layout.loaded", ["sessionId": host.sessionID, "documentId": "test-railway", "revision": revision]))
    }

    private func checkpoint(_ host: EngineHostModel, sessionID: String? = nil) throws -> BridgeEnvelope {
        try envelope("checkpoint-1", "layout.checkpoint", [
            "sessionId": sessionID ?? host.sessionID, "requestId": "save-1", "checkpoint": 1,
            "expectedRevision": NSNull(), "document": LayoutFixtures.document().bridgeObject()
        ])
    }

    func testReadyRequiresCurrentSessionLayoutAcknowledgement() async throws {
        let host = EngineHostModel(store: HostTestStore())
        defer { host.detach() }
        try await start(host)
        XCTAssertTrue(host.isBridgeReady)
        XCTAssertFalse(host.isReady, "A renderer handshake alone does not prove that a saved layout was accepted.")
        host.accept(try envelope("stale-loaded", "layout.loaded", ["sessionId": "previous-session", "documentId": "test-railway", "revision": 0]))
        XCTAssertFalse(host.isReady)
        try acknowledgeLayout(host)
        XCTAssertTrue(host.isReady)
    }

    func testRecoverableContextLossKeepsTransportAlive() async throws {
        let host = EngineHostModel(store: HostTestStore())
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        XCTAssertTrue(host.isReady)
        host.accept(try envelope("error-1", "engine.error", ["code": "webgl_context_lost", "recoverable": true]))
        XCTAssertTrue(host.isBridgeReady, "Lifecycle and viewport messages must still reach the existing JavaScript receiver.")
        XCTAssertFalse(host.isReady, "Do not present a lost graphics context as rendered and ready.")
        XCTAssertTrue(host.status.contains("webgl_context_lost"))
        host.updateLifecycle(.background)
        host.updateLifecycle(.active)
        host.accept(try envelope("metrics-1", "engine.metrics", ["frames": 24, "evidenceKind": "diagnostic-only"]))
        XCTAssertTrue(host.isReady)
        XCTAssertTrue(host.isBridgeReady)
    }

    func testTerminalErrorCannotBeClearedByMetrics() async throws {
        let host = EngineHostModel(store: HostTestStore())
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        host.accept(try envelope("error-1", "engine.error", ["code": "renderer_initialization_failed", "recoverable": false]))
        host.accept(try envelope("metrics-1", "engine.metrics", ["frames": 24, "evidenceKind": "diagnostic-only"]))
        XCTAssertFalse(host.isBridgeReady)
        XCTAssertFalse(host.isReady)
        XCTAssertEqual(host.phase, .failed)
        XCTAssertTrue(host.status.contains("renderer_initialization_failed"))
    }

    func testSuccessfulSaveChangesDurableStateOnlyAfterStoreCompletes() async throws {
        let host = EngineHostModel(store: HostTestStore())
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        host.accept(try checkpoint(host))
        XCTAssertEqual(host.saveState, .saving)
        XCTAssertNil(host.durableRevision)
        await host.awaitPendingStorage()
        XCTAssertEqual(host.saveState, .saved)
        XCTAssertEqual(host.durableRevision, 0)
        XCTAssertEqual(host.durableCheckpoint, 1)
    }

    func testFailedSavePreservesOpenLayoutAndDoesNotClaimDurability() async throws {
        let host = EngineHostModel(store: HostTestStore(failSave: true))
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        host.accept(try checkpoint(host))
        await host.awaitPendingStorage()
        XCTAssertEqual(host.saveState, .failed)
        XCTAssertTrue(host.isReady, "Save failure must not throw away the open scene.")
        XCTAssertNil(host.durableRevision)
        XCTAssertNil(host.durableCheckpoint)
    }

    func testRepeatedInFlightRequestIsCoalescedWithoutFillingSaveQueue() async throws {
        let store = HostTestStore()
        let host = EngineHostModel(store: store)
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        let request = try checkpoint(host)
        host.accept(request)
        for index in 1...32 {
            host.accept(try envelope("retry-\(index)", "layout.checkpoint", request.payload.mapValues(\.foundationValue)))
        }
        await host.awaitPendingStorage()
        let saves = await store.numberOfSaves()
        XCTAssertEqual(saves, 1, "Repeated transport envelopes for one request share the first write.")
        XCTAssertEqual(host.saveState, .saved)
        XCTAssertEqual(host.durableCheckpoint, 1)
    }

    func testReplacedSessionClearsPendingRequestIdentity() async throws {
        let store = HostTestStore()
        let host = EngineHostModel(store: store)
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        host.accept(try checkpoint(host))
        // Replace the host before the scheduled write begins. The next session
        // may legitimately reuse its own first request identifier.
        host.loading()
        try await start(host)
        try acknowledgeLayout(host)
        host.accept(try checkpoint(host))
        await host.awaitPendingStorage()
        let saves = await store.numberOfSaves()
        XCTAssertEqual(saves, 1)
        XCTAssertEqual(host.saveState, .saved)
    }

    func testOldSessionCannotWriteAfterReload() async throws {
        let store = HostTestStore()
        let host = EngineHostModel(store: store)
        defer { host.detach() }
        try await start(host)
        try acknowledgeLayout(host)
        let oldSessionID = host.sessionID
        try await start(host)
        try acknowledgeLayout(host)
        XCTAssertNotEqual(host.sessionID, oldSessionID)
        host.accept(try checkpoint(host, sessionID: oldSessionID))
        await host.awaitPendingStorage()
        let saves = await store.numberOfSaves()
        XCTAssertEqual(saves, 0)
        XCTAssertNil(host.durableRevision)
    }

    func testRestoredIdentityAndRevisionMustMatch() async throws {
        let saved = StoredLayout(document: LayoutFixtures.document(revision: 4), checkpoint: 8,
                                 checksum: String(repeating: "b", count: 64), recovered: true)
        let host = EngineHostModel(store: HostTestStore(initial: saved))
        defer { host.detach() }
        try await start(host)
        XCTAssertTrue(host.hasRestoredLayout)
        XCTAssertEqual(host.saveState, .recovered)
        try acknowledgeLayout(host, revision: 3)
        XCTAssertFalse(host.isReady)
        XCTAssertEqual(host.phase, .failed)
        XCTAssertTrue(host.status.contains("preserved"))
    }

    func testUnreadableSavedLayoutFailsWithoutFactoryReplacement() async throws {
        let store = HostTestStore(failLoad: true)
        let host = EngineHostModel(store: store)
        defer { host.detach() }
        try await start(host)
        XCTAssertFalse(host.isReady)
        XCTAssertEqual(host.phase, .failed)
        XCTAssertTrue(host.status.contains("preserved"))
        let saves = await store.numberOfSaves()
        XCTAssertEqual(saves, 0)
    }

    func testProcessRecoveryIsBoundedWithoutAWebView() {
        let host = EngineHostModel(store: HostTestStore())
        defer { host.detach() }
        host.contentProcessTerminated()
        XCTAssertEqual(host.phase, .failed)
        XCTAssertFalse(host.isReady)
        XCTAssertFalse(host.isBridgeReady)
    }
}
