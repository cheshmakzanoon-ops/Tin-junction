#if DEBUG
import XCTest
@testable import TinJunction

private actor ProbeTestStore: LayoutStoring {
    func load() -> StoredLayout? { nil }
    func save(document: LayoutDocument, checkpoint: Int, expectedRevision: Int?) throws -> StoredLayout {
        throw LayoutStore.Failure.injectedWriteFailure
    }
}

@MainActor
final class AssetOriginProbeTests: XCTestCase {
    private func payload(session: String = "probe-session") -> [String: BridgeJSON] {
        let result: BridgeJSON = .object(["status": .string("pending"), "detail": .string("Waiting for observed result.")])
        return [
            "formatVersion": .number(1), "sessionId": .string(session),
            "documentURL": .string("tinjunction://bundle/index.html"), "stage": .string("running"), "webgl2": .boolean(true),
            "results": .object(Dictionary(uniqueKeysWithValues: AssetOriginProbe.names.map { ($0, result) })),
            "observed": .object([
                "meshCount": .number(0), "triangleCount": .number(0), "textureWidth": .number(0), "textureHeight": .number(0),
                "glbVisiblePixels": .number(0), "textureMatchedQuadrants": .number(0), "audioSampleRate": .number(0),
                "audioFrames": .number(0), "audioChannels": .number(0), "audioState": .string("unavailable"),
                "wasmValue": .null, "workerMessage": .null
            ])
        ]
    }

    private func envelope(_ payload: [String: BridgeJSON], id: String = "probe-message") throws -> BridgeEnvelope {
        try BridgeEnvelope.decode(["version": 1, "id": id, "type": "engine.assetProbe", "payload": payload.mapValues(\.foundationValue)])
    }

    func testStrictReportRejectsWrongOriginsUnknownFieldsAndFabricatedCompletion() throws {
        let valid = payload()
        XCTAssertNoThrow(try envelope(valid))
        for (key, value) in [("documentURL", BridgeJSON.string("https://example.com/")),
                             ("documentURL", .string("tinjunction://bundle/index.html?probe=1")),
                             ("sessionId", .string("../other")), ("formatVersion", .boolean(true)),
                             ("stage", .string("complete")), ("networkPolicy", .string("http-https-denied"))] {
            var malformed = valid; malformed[key] = value
            XCTAssertThrowsError(try envelope(malformed), key)
        }
    }

    func testPassedResultsRequireActualBoundedObservations() throws {
        for name in ["glb", "texture", "worker", "wasm", "audio"] {
            var value = payload()
            guard case .some(.object(var results)) = value["results"] else { return XCTFail("Invalid test fixture") }
            results[name] = .object(["status": .string("passed"), "detail": .string("Claimed success")])
            value["results"] = .object(results)
            XCTAssertFalse(AssetOriginProbe.isValid(value), "Unobserved \(name) success must not be published.")
        }
        var value = payload()
        guard case .some(.object(var observed)) = value["observed"] else { return XCTFail("Invalid test fixture") }
        for invalid in [BridgeJSON.number(-1), .number(1.25), .number(16_385), .boolean(true)] {
            observed["glbVisiblePixels"] = invalid; value["observed"] = .object(observed)
            XCTAssertFalse(AssetOriginProbe.isValid(value))
        }
    }

    func testObservedBlockerIsBoundedAndNativePolicyCannotBeForged() throws {
        var value = payload()
        value["stage"] = .string("complete")
        value["results"] = .object(Dictionary(uniqueKeysWithValues: AssetOriginProbe.names.map { name in
            (name, BridgeJSON.object(["status": .string("blocked"), "detail": .string("Observed loader unavailable under unchanged CSP")]))
        }))
        let encoded = try XCTUnwrap(AssetOriginProbe.encodeVerifiedReport(value))
        let wrapper = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(encoded.utf8)) as? [String: Any])
        XCTAssertEqual(wrapper["networkPolicy"] as? String, "http-https-denied")
        XCTAssertEqual(wrapper["webDataCleared"] as? Bool, true)
        XCTAssertEqual(wrapper["persistentStorage"] as? Bool, false)
        value["results"] = .object(["audio": .object(["status": .string("blocked"), "detail": .string(String(repeating: "x", count: 301))])])
        XCTAssertFalse(AssetOriginProbe.isValid(value))
    }

    func testHostRequiresExplicitOptInPreparationAndTheCurrentSession() async throws {
        let disabled = EngineHostModel(store: ProbeTestStore(), launchArguments: [])
        defer { disabled.detach() }
        disabled.assetProbeDidPrepare(networkDenied: true, webDataCleared: true, persistentStorage: false)
        disabled.accept(try envelope(payload(session: disabled.sessionID)))
        XCTAssertEqual(disabled.assetProbeJSON, "{}")

        let host = EngineHostModel(store: ProbeTestStore(), launchArguments: [AssetOriginProbe.launchArgument])
        defer { host.detach() }
        host.loading()
        host.accept(try BridgeEnvelope.decode(["version": 1, "id": "ready", "type": "web.ready",
                                              "payload": ["build": "first-railway", "protocolVersion": 1, "renderer": "webgl2"]]))
        await host.awaitPendingStorage()
        host.accept(try envelope(payload(session: host.sessionID), id: "before-prepared"))
        XCTAssertEqual(host.assetProbeJSON, "{}")
        host.assetProbeDidPrepare(networkDenied: false, webDataCleared: true, persistentStorage: false)
        host.accept(try envelope(payload(session: host.sessionID), id: "not-denied"))
        XCTAssertEqual(host.assetProbeJSON, "{}")
        host.assetProbeDidPrepare(networkDenied: true, webDataCleared: true, persistentStorage: false)
        host.accept(try envelope(payload(session: "previous-session"), id: "wrong-session"))
        XCTAssertEqual(host.assetProbeJSON, "{}")
        host.accept(try envelope(payload(session: host.sessionID), id: "prepared-current"))
        XCTAssertTrue(host.assetProbeJSON.contains("http-https-denied"))
        host.loading()
        XCTAssertEqual(host.assetProbeJSON, "{}", "A report from a previous navigation cannot survive a new session.")
    }
}
#endif
