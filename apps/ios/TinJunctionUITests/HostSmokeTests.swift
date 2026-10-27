import XCTest

@MainActor
final class HostSmokeTests: XCTestCase {
    func testBundledRendererHandshakes() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        defer { attachScreenshot(app, name: "duo-host-handshake") }
        XCTAssertTrue(app.staticTexts["host.title"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30),
                      "Bundled WebKit bridge must handshake on Duo; no browser fallback.")
        XCTAssertTrue(app.webViews["host.webview"].exists)
    }

    func testHostSurvivesRotationAndForegrounding() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30))
        defer {
            attachScreenshot(app, name: "duo-host-after-lifecycle")
            XCUIDevice.shared.orientation = .portrait
        }
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.staticTexts["host.title"].exists)
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 15))
        // Host survival only: physical fold poses, thermals and haptics still
        // require hardware. Durable restoration is covered separately below.
    }

    func testNativeSaveAndRelaunchRestoresAcknowledgedRailway() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30))
        let save = app.buttons["host.save"]
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: save)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 10), .completed)
        save.tap()
        let saved = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS[c] 'saved on this iPhone'"),
            object: app.staticTexts["host.ready"]
        )
        XCTAssertEqual(XCTWaiter.wait(for: [saved], timeout: 15), .completed,
                       "Native must acknowledge an actual completed document write.")
        attachScreenshot(app, name: "duo-railway-durable-save")
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["host.restored"].waitForExistence(timeout: 10),
                      "Relaunch must load a validated native save, not silently show a fresh scene.")
        attachScreenshot(app, name: "duo-railway-restored")
    }

    func testNativeHelpRemainsAccessible() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["host.help"].waitForExistence(timeout: 15))
        app.buttons["host.help"].tap()
        XCTAssertTrue(app.navigationBars["Railway guide"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Save status"].exists)
        app.buttons["Done"].tap()
        XCTAssertTrue(app.staticTexts["host.title"].exists)
    }

    private func attachScreenshot(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
