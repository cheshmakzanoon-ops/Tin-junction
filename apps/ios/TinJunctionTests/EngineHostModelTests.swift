import XCTest
@testable import TinJunction

final class EngineHostModelTests: XCTestCase {
    private func envelope(_ id: String, _ type: String, _ payload: [String: Any]) throws -> BridgeEnvelope {
        try BridgeEnvelope.decode(["version": 1, "id": id, "type": type, "payload": payload])
    }

    @MainActor
    func testRecoverableContextLossKeepsTransportAlive() throws {
        let host = EngineHostModel()
        host.accept(try envelope("ready-1", "web.ready", ["build": "engineering-harness", "protocolVersion": 1, "renderer": "webgl2"]))
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
        host.detach()
    }

    @MainActor
    func testTerminalErrorCannotBeClearedByMetrics() throws {
        let host = EngineHostModel()
        host.accept(try envelope("ready-1", "web.ready", ["build": "engineering-harness", "protocolVersion": 1, "renderer": "webgl2"]))
        host.accept(try envelope("error-1", "engine.error", ["code": "renderer_initialization_failed", "recoverable": false]))
        host.accept(try envelope("metrics-1", "engine.metrics", ["frames": 24, "evidenceKind": "diagnostic-only"]))
        XCTAssertFalse(host.isBridgeReady)
        XCTAssertFalse(host.isReady)
        XCTAssertTrue(host.status.contains("renderer_initialization_failed"))
        host.detach()
    }
}
