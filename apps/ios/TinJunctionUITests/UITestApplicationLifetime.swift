import XCTest

/// Owns one fixture's app and records the public automation state around its
/// lifecycle operations. The reported state is asynchronous; it is not a PID
/// observation or independent proof that the operating system ended a process.
@MainActor
final class UITestApplicationLifetime {
    let app = XCUIApplication()

    private weak var testCase: XCTestCase?
    private let testName: String
    private let startedUptime = ProcessInfo.processInfo.systemUptime
    private let timestampFormatter: ISO8601DateFormatter
    private var observationCount = 0
    private static let maximumObservations = 32

    init(testCase: XCTestCase) {
        self.testCase = testCase
        self.testName = String(testCase.name.prefix(240))
        timestampFormatter = ISO8601DateFormatter()
        timestampFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        timestampFormatter.timeZone = TimeZone(secondsFromGMT: 0)

        // Register before launch. XCTest runs these blocks after an assertion
        // abort, when Swift defer may not execute. LIFO records the state before
        // cleanup; a failed termination remains a failure, never a retry pass.
        testCase.addTeardownBlock { [self] in
            // Never make the final cleanup depend on an accessibility read.
            // Its separate later-registered block owns optional diagnostics.
            terminateApp("fixture-teardown")
        }
        testCase.addTeardownBlock { [self] in
            captureStartupTrace("fixture-teardown")
            record(operation: "fixture", point: "teardown-enter")
        }
    }

    func launch(_ operation: StaticString = "initial-launch") {
        if !app.launchArguments.contains("--host-diagnostics") {
            app.launchArguments.append("--host-diagnostics")
        }
        record(operation: operation, point: "before")
        app.launch()
        record(operation: operation, point: "after")
    }

    func terminate(_ operation: StaticString) {
        // Preserve this before an app termination can abort the test or remove
        // the accessibility tree. A failed terminate still fails unchanged.
        captureStartupTrace(operation)
        terminateApp(operation)
    }

    private func terminateApp(_ operation: StaticString) {
        record(operation: operation, point: "before")
        app.terminate()
        record(operation: operation, point: "after")
    }

    private func captureStartupTrace(_ operation: StaticString) {
        guard let testCase, app.state == .runningForeground else { return }
        let element = app.staticTexts["host.startupTrace"]
        guard element.exists, let value = element.value as? String,
              value.utf8.count <= 32_768 else { return }
        let attachment = XCTAttachment(string: value)
        attachment.name = "native-startup-\(String(describing: operation))"
        attachment.lifetime = .keepAlways
        testCase.add(attachment)
    }

    private func record(operation: StaticString, point: StaticString) {
        // Current fixtures use at most nine observations. Keep any future
        // accidental repetition bounded without changing application behavior.
        guard observationCount < Self.maximumObservations, let testCase else { return }
        observationCount += 1
        let state = app.state
        let observedAt = Date()
        let uptime = ProcessInfo.processInfo.systemUptime
        let operationName = String(String(describing: operation).prefix(96))
        let pointName = String(describing: point)
        let text = """
        formatVersion: 1
        test: \(testName)
        observation: \(observationCount)
        operation: \(operationName)
        point: \(pointName)
        utc: \(timestampFormatter.string(from: observedAt))
        systemUptimeSeconds: \(uptime)
        elapsedSeconds: \(uptime - startedUptime)
        applicationState: \(state.rawValue)
        applicationStateName: \(Self.name(of: state))
        """
        let attachment = XCTAttachment(string: text)
        attachment.name = "native-lifecycle-\(observationCount)-\(operationName)-\(pointName)"
        attachment.lifetime = .keepAlways
        testCase.add(attachment)
    }

    private static func name(of state: XCUIApplication.State) -> String {
        switch state {
        case .unknown: return "unknown"
        case .notRunning: return "notRunning"
        case .runningBackgroundSuspended: return "runningBackgroundSuspended"
        case .runningBackground: return "runningBackground"
        case .runningForeground: return "runningForeground"
        @unknown default: return "unrecognized"
        }
    }
}
