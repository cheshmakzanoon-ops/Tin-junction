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
        defer { attachScreenshot(app, name: "duo-edit-save-relaunch") }

        let durableMarker = app.staticTexts.matching(
            NSPredicate(format: "identifier == 'host.saved' OR identifier == 'host.restored'")
        ).firstMatch
        XCTAssertTrue(durableMarker.waitForExistence(timeout: 15))
        let beforeValue = try XCTUnwrap(durableMarker.value as? String)
        let beforeRevision = try XCTUnwrap(Int(beforeValue.components(separatedBy: ",")[0]
            .replacingOccurrences(of: "Revision ", with: "")))

        let web = app.webViews["host.webview"]
        // WKWebView exposes an aria-pressed HTML toggle as an accessibility
        // switch. The captured failing hierarchy confirms this is not a Button.
        let arrange = web.switches["Arrange scenery"]
        XCTAssertTrue(arrange.waitForExistence(timeout: 10))
        arrange.tap()
        let nameField = web.textFields["Layout name"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 5))
        let originalName = try XCTUnwrap(nameField.value as? String)
        let uniqueTag = " CI\(UUID().uuidString.prefix(8))"
        nameField.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10),
                      "The actual keyboard must be present before entering a layout name.")
        // Keyboard presentation resizes the native WebView. Reacquire the
        // field after that transition instead of typing into stale geometry.
        let readyForTyping = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "hittable == true"), object: nameField)
        XCTAssertEqual(XCTWaiter.wait(for: [readyForTyping], timeout: 5), .completed)
        nameField.tap()
        // Insert through the actual keyboard. Reading back the field avoids
        // assumptions about where WebKit positions the caret on first tap.
        nameField.typeText(uniqueTag)
        let entered = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value CONTAINS %@", uniqueTag.trimmingCharacters(in: .whitespaces)),
            object: nameField)
        XCTAssertEqual(XCTWaiter.wait(for: [entered], timeout: 10), .completed,
                       "WebKit must expose the complete name entered through the real keyboard.")
        let changedName = try XCTUnwrap(nameField.value as? String)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        XCTAssertTrue(changedName.contains(uniqueTag.trimmingCharacters(in: .whitespaces)))
        XCTAssertNotEqual(changedName, originalName)
        web.buttons["Close scenery workshop"].tap() // Blurs input and commits its change event.
        let changedHeading = web.descendants(matching: .any).matching(
            NSPredicate(format: "label == %@", changedName)
        ).firstMatch
        XCTAssertTrue(changedHeading.waitForExistence(timeout: 10))

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
        let changedRevisionSaved = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value BEGINSWITH %@", "Revision \(beforeRevision + 1),"),
            object: durableMarker
        )
        XCTAssertEqual(XCTWaiter.wait(for: [changedRevisionSaved], timeout: 15), .completed,
                       "An earlier autosave cannot satisfy the acknowledgement for this specific edit.")
        attachScreenshot(app, name: "duo-railway-durable-save")
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["host.ready"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["host.restored"].waitForExistence(timeout: 10),
                      "Relaunch must load a validated native save, not silently show a fresh scene.")
        let restoredHeading = app.webViews["host.webview"].descendants(matching: .any).matching(
            NSPredicate(format: "label == %@", changedName)
        ).firstMatch
        XCTAssertTrue(restoredHeading.waitForExistence(timeout: 10),
                      "The exact name entered through the real editor must survive app termination.")
        attachScreenshot(app, name: "duo-railway-restored")
    }

    func testNativeHelpRemainsAccessible() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["host.help"].waitForExistence(timeout: 15))
        app.buttons["host.help"].tap()
        XCTAssertTrue(app.navigationBars["Railway guide"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Save status"].exists)
        app.buttons["host.help.done"].tap()
        XCTAssertTrue(app.staticTexts["host.title"].exists)
    }

    private func attachScreenshot(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
