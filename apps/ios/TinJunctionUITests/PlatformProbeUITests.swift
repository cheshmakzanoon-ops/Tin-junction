#if DEBUG
import XCTest

@MainActor
final class PlatformProbeUITests: XCTestCase {
    func testObservedPlatformGeometryAcrossSupportedOrientations() throws {
        continueAfterFailure = false
        let lifetime = UITestApplicationLifetime(testCase: self)
        let app = lifetime.app
        addTeardownBlock { XCUIDevice.shared.orientation = .portrait }
        lifetime.launch()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30))

        let orientations: [(String, UIDeviceOrientation)] = [
            ("portrait", .portrait), ("landscape-left", .landscapeLeft), ("landscape-right", .landscapeRight)
        ]
        for (name, orientation) in orientations {
            XCUIDevice.shared.orientation = orientation
            XCTAssertTrue(app.buttons["host.help"].waitForExistence(timeout: 10))
            app.buttons["host.help"].tap()
            XCTAssertTrue(app.navigationBars["Railway guide"].waitForExistence(timeout: 5))
            let done = app.buttons["host.help.done"]
            XCTAssertTrue(done.waitForExistence(timeout: 5))
            let contents = app.collectionViews["host.help.contents"]
            XCTAssertTrue(contents.waitForExistence(timeout: 5))
            let probe = app.staticTexts["host.platformProbe"]
            // A List may lazily create its final rows only after scrolling.
            for _ in 0..<4 {
                if probe.exists { break }
                contents.swipeUp()
            }
            XCTAssertTrue(probe.waitForExistence(timeout: 5))
            let available = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "value CONTAINS %@", "\"viewport\":{"), object: probe)
            XCTAssertEqual(XCTWaiter.wait(for: [available], timeout: 10), .completed)
            let text = try XCTUnwrap(probe.value as? String)
            let report = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(text.utf8)) as? [String: Any])
            let viewport = try XCTUnwrap(report["viewport"] as? [String: Any])
            let width = try XCTUnwrap(viewport["width"] as? Double)
            let height = try XCTUnwrap(viewport["height"] as? Double)
            XCTAssertGreaterThan(width, 0)
            XCTAssertGreaterThan(height, 0)
            XCTAssertGreaterThan(try XCTUnwrap(viewport["pixelRatio"] as? Double), 0)
            XCTAssertNotNil(viewport["reservedRegions"] as? [[String: Any]])
            let observation = try XCTUnwrap(report["hingeObservation"] as? String)
            XCTAssertTrue(["awaiting", "unavailable", "measured"].contains(observation))
            if observation == "measured" {
                let angle = try XCTUnwrap(report["hingeAngleDegrees"] as? Double)
                XCTAssertTrue(angle.isFinite && (0...360).contains(angle))
            } else {
                XCTAssertTrue(report["hingeAngleDegrees"] is NSNull)
            }
            XCTAssertEqual(report["isSimulator"] as? Bool, true,
                           "This CI evidence must explicitly identify its Simulator context.")
            let data = XCTAttachment(string: text)
            data.name = "platform-observation-\(name)"
            data.lifetime = .keepAlways
            add(data)
            XCTAssertTrue(done.isHittable, "The guide's close action must remain reachable after scrolling.")
            done.tap()
            let dismissed = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "exists == false"), object: app.navigationBars["Railway guide"])
            XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 5), .completed)
            XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 10))
            let webFrame = app.webViews["host.webview"].frame
            XCTAssertEqual(width, Double(webFrame.width), accuracy: 1,
                           "Measured viewport must describe the actual native engine view, not nominal screen dimensions.")
            XCTAssertEqual(height, Double(webFrame.height), accuracy: 1)
            let capture = XCTAttachment(screenshot: app.screenshot())
            capture.name = "platform-geometry-\(name)"
            capture.lifetime = .keepAlways
            add(capture)
        }
    }
}
#endif
