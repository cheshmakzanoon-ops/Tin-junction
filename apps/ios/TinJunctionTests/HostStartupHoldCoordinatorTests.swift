#if DEBUG
import Combine
import Foundation
import WebKit
import XCTest
@testable import TinJunction

/// Observe the coordinator's real public load call without starting WebKit IO.
/// These fixtures cover scheduling/cancellation, not renderer readiness.
@MainActor
private final class StartupHoldRecordingWebView: WKWebView {
    private(set) var requests: [URLRequest] = []
    var onFirstLoad: (() -> Void)?

    override func load(_ request: URLRequest) -> WKNavigation? {
        requests.append(request)
        if requests.count == 1 { onFirstLoad?() }
        return nil
    }
}

@MainActor
final class HostStartupHoldCoordinatorTests: XCTestCase {
    private struct Fixture {
        let host: EngineHostModel
        let coordinator: EngineWebView.Coordinator
        let view: StartupHoldRecordingWebView
        let container: EngineWebViewContainer
    }

    private func attachedFixture(arguments: [String] = ["--hold-native-startup"]) -> Fixture {
        let host = EngineHostModel(launchArguments: arguments)
        let coordinator = EngineWebView.Coordinator(host: host)
        let view = StartupHoldRecordingWebView(frame: .zero, configuration: WKWebViewConfiguration())
        view.navigationDelegate = coordinator
        XCTAssertTrue(host.attach(to: view))
        let container = EngineWebViewContainer(webView: view)
        container.setRendererAvailable(true)
        return Fixture(host: host, coordinator: coordinator, view: view, container: container)
    }

    private func forbiddenLoad(_ fixture: Fixture, description: String) -> XCTestExpectation {
        let expectation = XCTestExpectation(description: description)
        expectation.isInverted = true
        fixture.view.onFirstLoad = { expectation.fulfill() }
        return expectation
    }

    func testFailureAndDetachBeforeDeferredArmCannotStartNavigation() async {
        let failed = attachedFixture(), detached = attachedFixture()
        defer {
            EngineWebView.dismantleUIView(failed.container, coordinator: failed.coordinator)
            EngineWebView.dismantleUIView(detached.container, coordinator: detached.coordinator)
        }
        let forbidden = [
            forbiddenLoad(failed, description: "A failed owner must not start its deferred navigation"),
            forbiddenLoad(detached, description: "A detached owner must not start its deferred navigation"),
        ]
        failed.coordinator.beginInitialDocument(in: failed.view)
        detached.coordinator.beginInitialDocument(in: detached.view)
        XCTAssertEqual(failed.host.startupHold.state, .requested)
        XCTAssertEqual(detached.host.startupHold.state, .requested)

        // No suspension occurs between scheduling and cancellation. Both real
        // coordinator tasks must encounter cancellation after this actor yields.
        let originalFailure = "Original failure before the deferred coordinator ran"
        failed.host.fail(originalFailure)
        detached.host.detach(from: detached.view)
        let result = await XCTWaiter.fulfillment(of: forbidden, timeout: 0.25)
        XCTAssertEqual(result, .completed)

        for fixture in [failed, detached] {
            XCTAssertEqual(fixture.host.startupHold.state, .cancelled)
            XCTAssertFalse(fixture.host.startupHold.release())
            XCTAssertTrue(fixture.view.requests.isEmpty)
            XCTAssertFalse(fixture.host.isReady)
        }
        XCTAssertEqual(failed.host.phase, .failed)
        XCTAssertEqual(failed.host.status, originalFailure)
        XCTAssertTrue(failed.host.isAttached(to: failed.view), "Failure alone must not be mistaken for detach.")
        XCTAssertFalse(detached.host.isAttached(to: detached.view))
    }

    func testDismantlingAnArmedCoordinatorDiscardsItsNavigationCallback() async {
        let held = attachedFixture(), ordinary = attachedFixture(arguments: [])
        defer {
            EngineWebView.dismantleUIView(held.container, coordinator: held.coordinator)
            EngineWebView.dismantleUIView(ordinary.container, coordinator: ordinary.coordinator)
        }

        // Positive control: the same override observes an actual coordinator
        // load when no hold was requested, so an empty record is meaningful.
        ordinary.coordinator.beginInitialDocument(in: ordinary.view)
        XCTAssertEqual(ordinary.view.requests.map(\.url), [BundleResourcePolicy.entryURL])

        let noLoad = forbiddenLoad(held, description: "A dismantled coordinator must not release navigation")
        let armed = XCTestExpectation(description: "The actual deferred coordinator arms its hold")
        let observation = held.host.startupHold.$state
            .first(where: { $0 == .holding })
            .sink { _ in armed.fulfill() }
        defer { observation.cancel() }
        held.coordinator.beginInitialDocument(in: held.view)
        let result = await XCTWaiter.fulfillment(of: [armed], timeout: 5)
        XCTAssertEqual(result, .completed)
        guard result == .completed else { return }
        XCTAssertEqual(held.host.startupHold.state, .holding)
        XCTAssertTrue(held.view.requests.isEmpty)

        EngineWebView.dismantleUIView(held.container, coordinator: held.coordinator)
        XCTAssertEqual(held.host.startupHold.state, .cancelled)
        XCTAssertFalse(held.host.isAttached(to: held.view))
        let originalFailure = "Original failure after the renderer owner was dismantled"
        held.host.fail(originalFailure)
        XCTAssertFalse(held.host.startupHold.release())
        held.coordinator.cancelStartupHold() // A late, repeated teardown is harmless.
        let quiet = await XCTWaiter.fulfillment(of: [noLoad], timeout: 0.25)
        XCTAssertEqual(quiet, .completed)
        XCTAssertTrue(held.view.requests.isEmpty)
        XCTAssertFalse(held.host.startupHold.release())
        XCTAssertEqual(held.host.phase, .failed)
        XCTAssertEqual(held.host.status, originalFailure)
    }
}
#endif
