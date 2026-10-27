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
        // Host survival only: not fold poses, thermal behavior, persistence,
        // haptic response, or the eventual simulation's pause policy.
    }

    private func attachScreenshot(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
