import XCTest

@MainActor
final class HostStartupUITests: XCTestCase {
    func testRealRendererInitializationFailureOffersWorkingNativeRetry() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["--fail-renderer-once"]
        app.launch()
        let recovery = app.otherElements["host.recovery"]
        let retry = app.buttons["host.retry"]
        XCTAssertTrue(retry.waitForExistence(timeout: 30),
                      "A failed WebGL2 initialization must expose native recovery without a blank wait.")
        XCTAssertFalse(app.staticTexts["host.ready"].exists)
        XCTAssertTrue(app.buttons["host.help"].isHittable, "Help remains available while the renderer is unavailable.")
        attach(app, name: "native-renderer-failure")
        retry.tap()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30),
                      "Retry must initialize the real packaged renderer and restore its layout session.")
        XCTAssertFalse(retry.exists)
        XCTAssertFalse(recovery.exists)
        XCTAssertEqual(app.webViews.matching(identifier: "host.webview").count, 1)
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 15))
        XCTAssertEqual(app.webViews.matching(identifier: "host.webview").count, 1)
        attach(app, name: "native-renderer-retry-and-foreground")
    }

    private func attach(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
