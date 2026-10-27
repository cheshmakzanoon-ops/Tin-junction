import XCTest

@MainActor
final class HostStartupUITests: XCTestCase {
    func testRealRendererInitializationFailureOffersWorkingNativeRetry() throws {
        continueAfterFailure = false
        let lifetime = preparedApplication(arguments: ["--fail-renderer-once"], failureCapture: "native-renderer-failure-state")
        let app = lifetime.app
        lifetime.launch()
        let recovery = app.otherElements["host.recovery"]
        let retry = app.buttons["host.retry"]
        XCTAssertTrue(retry.waitForExistence(timeout: 30),
                      "A failed WebGL2 initialization must expose native recovery without a blank wait.")
        attach(app, name: "native-renderer-failure")
        let initializationError = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS %@", "renderer_initialization_failed"),
            object: app.staticTexts["host.status"])
        XCTAssertEqual(XCTWaiter.wait(for: [initializationError], timeout: 5), .completed,
                       "The injected renderer failure, not an unrelated loading timeout, must expose Retry.")
        XCTAssertTrue(recovery.exists, "Recovery must expose its own native accessibility container.")
        XCTAssertTrue(retry.isHittable)
        XCTAssertGreaterThanOrEqual(retry.frame.width, 44)
        XCTAssertGreaterThanOrEqual(retry.frame.height, 44)
        XCTAssertFalse(app.webViews["host.webview"].exists,
                       "Unavailable web controls must not remain in the recovery accessibility traversal.")
        XCTAssertFalse(app.staticTexts["host.ready"].exists)
        XCTAssertTrue(app.buttons["host.help"].isHittable, "Help remains available while the renderer is unavailable.")
        try app.performAccessibilityAudit(for: .contrast)
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

    #if DEBUG
    func testControlledStartupDelayKeepsNativeHelpAvailableBeforeRealReadiness() throws {
        continueAfterFailure = false
        let lifetime = preparedApplication(arguments: ["--hold-native-startup"], failureCapture: "native-startup-delay-failure-state")
        let app = lifetime.app
        lifetime.launch()
        let release = app.buttons["host.startup.release"]
        XCTAssertTrue(release.waitForExistence(timeout: 20))
        attach(app, name: "native-startup-held")
        assertHeldStartup(app)

        app.buttons["host.help"].tap()
        let contents = app.descendants(matching: .any).matching(identifier: "host.help.contents").firstMatch
        XCTAssertTrue(contents.waitForExistence(timeout: 10), "Native Help must open before the renderer starts.")
        let done = app.buttons["host.help.done"]
        XCTAssertTrue(done.waitForExistence(timeout: 10))
        XCTAssertTrue(done.isHittable)
        done.tap()
        let dismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: contents)
        XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 10), .completed)
        attach(app, name: "native-startup-held-after-help")
        assertHeldStartup(app)

        XCTAssertTrue(release.isHittable)
        release.tap()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30),
                      "Releasing the hold must navigate and initialize the actual packaged renderer.")
        XCTAssertFalse(release.exists)
        XCTAssertFalse(app.staticTexts["host.startup.held"].exists)
        XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "host.loading").firstMatch.exists)
        XCTAssertEqual(app.webViews.matching(identifier: "host.webview").count, 1)
        let saveEnabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: app.buttons["host.save"])
        XCTAssertEqual(XCTWaiter.wait(for: [saveEnabled], timeout: 10), .completed,
                       "Save becomes available after actual readiness and any initial checkpoint completes.")
        attach(app, name: "native-startup-released-ready")
    }

    private func assertHeldStartup(_ app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(app.staticTexts["host.startup.held"].exists, file: file, line: line)
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "host.loading").firstMatch.exists,
                      "The actual native progress overlay must be visible during the controlled delay.", file: file, line: line)
        XCTAssertFalse(app.staticTexts["host.ready"].exists, file: file, line: line)
        XCTAssertFalse(app.buttons["host.save"].isEnabled, file: file, line: line)
        XCTAssertTrue(app.buttons["host.help"].isHittable, file: file, line: line)
        XCTAssertEqual(app.webViews.matching(identifier: "host.webview").count, 1, file: file, line: line)
    }
    #endif

    private func preparedApplication(arguments: [String], failureCapture: String) -> UITestApplicationLifetime {
        let lifetime = UITestApplicationLifetime(testCase: self)
        let app = lifetime.app
        // LIFO registration captures the failure before the owned lifetime's
        // teardown, including when continueAfterFailure aborts the test body.
        addTeardownBlock { [weak self] in
            guard let self, (self.testRun?.failureCount ?? 0) > 0 else { return }
            let state = XCTAttachment(string: "Application state: \(app.state.rawValue)")
            state.name = "\(failureCapture)-application-state"
            state.lifetime = .keepAlways
            self.add(state)
            if app.state == .runningForeground { self.attach(app, name: failureCapture) }
        }
        app.launchArguments = arguments
        return lifetime
    }

    private func attach(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
