#if DEBUG
import XCTest

@MainActor
final class AssetOriginProbeUITests: XCTestCase {
    func testActualBundledOriginAfterWebDataResetAndColdRelaunch() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["--asset-origin-probe"]
        app.launch()
        let firstSession = try observe(app, name: "first-launch")
        app.terminate()
        app.launch()
        let nextSession = try observe(app, name: "cold-relaunch")
        XCTAssertNotEqual(firstSession, nextSession, "Cold relaunch must establish a new native renderer session.")
    }

    private func observe(_ app: XCUIApplication, name: String) throws -> String {
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 40))
        let probe = app.staticTexts["host.assetProbe"]
        XCTAssertTrue(probe.waitForExistence(timeout: 10))
        let initialized = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value CONTAINS %@ OR value CONTAINS %@", "\"stage\":\"ready\"", "\"stage\":\"complete\""), object: probe)
        XCTAssertEqual(XCTWaiter.wait(for: [initialized], timeout: 30), .completed)
        let before = try report(from: probe)
        if before["stage"] as? String == "ready" {
            let play = app.webViews["host.webview"].buttons["Play probe tone"]
            XCTAssertTrue(play.waitForExistence(timeout: 10))
            XCTAssertTrue(play.isHittable, "The probe must use an actual accessible user gesture to resume audio.")
            play.tap()
            let finished = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "value CONTAINS %@", "\"stage\":\"complete\""), object: probe)
            XCTAssertEqual(XCTWaiter.wait(for: [finished], timeout: 15), .completed)
        }
        let renderer = try report(from: probe)
        XCTAssertEqual(renderer["documentURL"] as? String, "tinjunction://bundle/index.html")
        XCTAssertEqual(renderer["webgl2"] as? Bool, true)
        XCTAssertEqual(renderer["stage"] as? String, "complete")
        let results = try XCTUnwrap(renderer["results"] as? [String: [String: Any]])
        let observed = try XCTUnwrap(renderer["observed"] as? [String: Any])
        for loader in ["glb", "texture"] {
            XCTAssertEqual(results[loader]?["status"] as? String, "passed", "Bundled \(loader) must render through the real custom origin.")
        }
        XCTAssertEqual(observed["meshCount"] as? Int, 14)
        XCTAssertEqual(observed["triangleCount"] as? Int, 280)
        XCTAssertGreaterThan(try XCTUnwrap(observed["glbVisiblePixels"] as? Int), 31)
        XCTAssertEqual(observed["textureWidth"] as? Int, 8)
        XCTAssertEqual(observed["textureHeight"] as? Int, 8)
        XCTAssertEqual(observed["textureMatchedQuadrants"] as? Int, 4)
        for loader in ["worker", "wasm", "ktx2", "audio"] {
            let result = try XCTUnwrap(results[loader])
            XCTAssertTrue(["passed", "blocked"].contains(try XCTUnwrap(result["status"] as? String)),
                          "Optional loaders must report an observed result or an explicit blocker.")
            XCTAssertFalse(try XCTUnwrap(result["detail"] as? String).isEmpty)
        }
        XCTAssertEqual(results["ktx2"]?["status"] as? String, "blocked",
                       "An absent transcoder must remain disabled instead of borrowing a decoder result.")
        let text = try XCTUnwrap(probe.value as? String)
        let data = XCTAttachment(string: text)
        data.name = "asset-origin-observation-\(name)"
        data.lifetime = .keepAlways
        add(data)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "asset-origin-rendering-\(name)"
        capture.lifetime = .keepAlways
        add(capture)
        return try XCTUnwrap(renderer["sessionId"] as? String)
    }

    private func report(from probe: XCUIElement) throws -> [String: Any] {
        let text = try XCTUnwrap(probe.value as? String)
        let wrapper = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(text.utf8)) as? [String: Any])
        XCTAssertEqual(wrapper["formatVersion"] as? Int, 1)
        XCTAssertEqual(wrapper["networkPolicy"] as? String, "http-https-denied")
        XCTAssertEqual(wrapper["webDataCleared"] as? Bool, true)
        XCTAssertEqual(wrapper["persistentStorage"] as? Bool, false)
        XCTAssertEqual(wrapper["isSimulator"] as? Bool, true)
        return try XCTUnwrap(wrapper["report"] as? [String: Any])
    }
}
#endif
