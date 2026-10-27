import WebKit
import XCTest
@testable import TinJunction

private actor SessionTestStore: LayoutStoring {
    private(set) var loads = 0
    func load() -> StoredLayout? { loads += 1; return nil }
    func save(document: LayoutDocument, checkpoint: Int, expectedRevision: Int?) throws -> StoredLayout {
        throw LayoutStore.Failure.injectedWriteFailure
    }
}

@MainActor
final class ApplicationSessionTests: XCTestCase {
    private func ready(_ host: EngineHostModel) async throws {
        host.loading()
        host.accept(try BridgeEnvelope.decode([
            "version": 1, "id": "session-ready", "type": "web.ready",
            "payload": ["build": "first-railway", "protocolVersion": 1, "renderer": "webgl2"]
        ]))
        await host.awaitPendingStorage()
        host.accept(try BridgeEnvelope.decode([
            "version": 1, "id": "session-loaded", "type": "layout.loaded",
            "payload": ["sessionId": host.sessionID, "documentId": "test-railway", "revision": 0]
        ]))
        XCTAssertTrue(host.isReady)
    }

    func testPresentationRecreationAndLifecycleKeepTheApplicationAuthority() async throws {
        let store = SessionTestStore(), session = ApplicationSession(store: store)
        let initial = RootView(host: session.host)
        defer { session.host.detach() }
        try await ready(session.host)
        let identity = session.host.sessionID
        for _ in 0..<5 {
            session.host.updateLifecycle(.inactive)
            session.host.updateLifecycle(.background)
            session.host.updateLifecycle(.active)
            let recreated = RootView(host: session.host)
            XCTAssertTrue(initial.host === recreated.host)
            XCTAssertEqual(recreated.host.sessionID, identity)
            XCTAssertTrue(recreated.host.isReady)
        }
        let loads = await store.loads
        XCTAssertEqual(loads, 1, "Display/lifecycle changes must not reopen the store or create competing writers.")
    }

    func testSecondRendererCannotReplaceOrTearDownTheActiveSession() async throws {
        let session = ApplicationSession(store: SessionTestStore()), host = session.host
        let first = WKWebView(), rejected = WKWebView()
        defer { host.detach() }
        // Establish model readiness before attaching a deliberately blank test
        // WebView: it has no JS receiver and is only an ownership fixture.
        try await ready(host)
        XCTAssertTrue(host.attach(to: first))
        XCTAssertTrue(host.attach(to: first), "Repeated attachment of the same renderer is harmless.")
        let identity = host.sessionID
        XCTAssertFalse(host.attach(to: rejected))
        host.detach(from: rejected)
        XCTAssertEqual(host.sessionID, identity)
        XCTAssertTrue(host.isReady, "Teardown of a rejected view cannot cancel the live authority.")
        host.detach(from: first)
        XCTAssertFalse(host.isReady)
        try await ready(host)
        XCTAssertTrue(host.attach(to: rejected), "A later presentation can acquire the released authority.")
        let replacement = host.sessionID
        host.detach(from: first)
        XCTAssertEqual(host.sessionID, replacement)
        XCTAssertTrue(host.isReady, "A late dismantle callback from the old view must not kill its replacement.")
    }
}
