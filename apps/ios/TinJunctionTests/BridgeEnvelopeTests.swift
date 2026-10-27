import XCTest
@testable import TinJunction

final class BridgeEnvelopeTests: XCTestCase {
    private func ready() -> [String: Any] {
        ["version": 1, "id": "web-1", "type": "web.ready", "payload": [
            "build": "engineering-harness", "protocolVersion": 1, "renderer": "webgl2"
        ]]
    }

    func testAcceptsExpectedReady() throws {
        let envelope = try BridgeEnvelope.decode(ready())
        XCTAssertEqual(envelope.type, "web.ready")
        XCTAssertEqual(envelope.payload["renderer"], .string("webgl2"))
    }

    func testRejectsWrongVersion() {
        var value = ready()
        value["version"] = 2
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testRejectsArbitraryCommand() {
        var value = ready()
        value["type"] = "native.execute"
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testRejectsExtraTopLevelAuthority() {
        var value = ready()
        value["path"] = "/private/data"
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testRejectsNonObjectPayload() {
        var value = ready()
        value["payload"] = ["invalid", "array"]
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testRejectsWrongRendererOrBuild() {
        var value = ready()
        value["payload"] = ["build": "release", "protocolVersion": 1, "renderer": "webgpu"]
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testRejectsUnboundedPayload() {
        var value = ready()
        value["payload"] = ["message": String(repeating: "x", count: BridgeEnvelope.maximumBytes)]
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testRejectsInvalidIdentifier() {
        for identifier in ["", "web id", "web\n1", String(repeating: "x", count: 129)] {
            var value = ready()
            value["id"] = identifier
            XCTAssertThrowsError(try BridgeEnvelope.decode(value))
        }
    }

    func testMetricsCannotCarryNonFiniteNumbers() {
        let value: [String: Any] = ["version": 1, "id": "metrics-1", "type": "engine.metrics", "payload": ["fps": Double.infinity]]
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testErrorPayloadRequiresCodeAndRecoverability() throws {
        let valid: [String: Any] = ["version": 1, "id": "error-1", "type": "engine.error", "payload": ["code": "webgl_context_lost", "recoverable": true]]
        XCTAssertNoThrow(try BridgeEnvelope.decode(valid))
        var invalid = valid
        invalid["payload"] = ["code": "webgl_context_lost", "recoverable": "true"]
        XCTAssertThrowsError(try BridgeEnvelope.decode(invalid))
        invalid["payload"] = ["message": "missing code", "recoverable": false]
        XCTAssertThrowsError(try BridgeEnvelope.decode(invalid))
    }

    func testViewportUsesPointsAndNullableHinge() {
        let viewport = NativeViewport(width: 400, height: 600, pixelRatio: 3, reservedRegions: [])
        XCTAssertTrue(viewport.isValid)
        let payload = viewport.payload(hingeAngleDegrees: nil)
        XCTAssertEqual(payload["width"] as? Double, 400)
        XCTAssertEqual(payload["pixelRatio"] as? Double, 3)
        XCTAssertTrue(payload["hingeAngleDegrees"] is NSNull)
        XCTAssertFalse(NativeViewport(width: 0, height: 600, pixelRatio: 3, reservedRegions: []).isValid)
        XCTAssertFalse(NativeViewport(width: .nan, height: 600, pixelRatio: 3, reservedRegions: []).isValid)
    }

    func testFirstRailwayReadyAndStrictLayoutHandshake() throws {
        var value = ready()
        value["payload"] = ["build": "first-railway", "protocolVersion": 1, "renderer": "webgl2"]
        XCTAssertNoThrow(try BridgeEnvelope.decode(value))
        value["type"] = "layout.loaded"
        value["payload"] = ["sessionId": "native-session", "documentId": "my-railway", "revision": 0]
        XCTAssertNoThrow(try BridgeEnvelope.decode(value))
        value["payload"] = ["sessionId": "native-session", "documentId": "my-railway", "revision": true]
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
        value["payload"] = ["sessionId": "native-session", "documentId": "my-railway", "revision": 0, "path": "../file"]
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testSnapshotValidatesDocumentAndExpectedRevision() throws {
        var payload: [String: Any] = [
            "sessionId": "native-session", "requestId": "save-1", "expectedRevision": NSNull(),
            "checkpoint": 1, "document": try LayoutFixtures.document().bridgeObject()
        ]
        var value: [String: Any] = ["version": 1, "id": "checkpoint-1", "type": "layout.checkpoint", "payload": payload]
        XCTAssertNoThrow(try BridgeEnvelope.decode(value))
        payload["expectedRevision"] = true
        value["payload"] = payload
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
        payload["expectedRevision"] = NSNull()
        var document = try LayoutFixtures.document().bridgeObject()
        document["schemaVersion"] = 2
        payload["document"] = document
        value["payload"] = payload
        XCTAssertThrowsError(try BridgeEnvelope.decode(value))
    }

    func testDocumentChannelDoesNotIncreaseDiagnosticLimit() {
        let oversized: [String: Any] = ["version": 1, "id": "metrics-1", "type": "engine.metrics", "payload": ["detail": String(repeating: "x", count: 70_000)]]
        XCTAssertThrowsError(try BridgeEnvelope.decode(oversized))
        XCTAssertEqual(BridgeEnvelope.maximumBytes, 65_536)
        XCTAssertEqual(BridgeEnvelope.maximumCheckpointBytes, 524_288)
    }
}
