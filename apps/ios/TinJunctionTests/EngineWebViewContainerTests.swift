import UIKit
import WebKit
import XCTest
@testable import TinJunction

@MainActor
private final class RecoveryRecordingWebView: WKWebView {
    private(set) var requests: [URLRequest] = []
    var onLoad: (() -> Void)?

    override func load(_ request: URLRequest) -> WKNavigation? {
        requests.append(request)
        onLoad?()
        return nil
    }
}

@MainActor
final class EngineWebViewContainerTests: XCTestCase {
    func testFailureRemovesRendererFromWindowAndRetryReusesItsAuthority() {
        let host = EngineHostModel(launchArguments: [])
        let renderer = RecoveryRecordingWebView(frame: .zero, configuration: WKWebViewConfiguration())
        let container = EngineWebViewContainer(webView: renderer)
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 600))
        container.frame = window.bounds
        window.addSubview(container)
        XCTAssertTrue(host.attach(to: renderer))
        defer {
            container.stopObservingAvailability()
            host.detach(from: renderer)
            container.setRendererAvailable(false)
            container.removeFromSuperview()
        }

        container.observeAvailability(of: host)
        XCTAssertTrue(renderer.window === window, "The positive control must attach a real WKWebView to a real window.")
        let failedSession = host.sessionID
        host.fail("Controlled renderer failure")
        XCTAssertNil(renderer.superview, "The emitted failure must remove the renderer before a later SwiftUI update.")
        XCTAssertNil(renderer.window)
        container.setRendererAvailable(false)
        container.setRendererAvailable(false)
        XCTAssertNil(renderer.superview)
        XCTAssertNil(renderer.window)
        XCTAssertTrue(container.subviews.isEmpty)
        XCTAssertTrue(container.accessibilityElementsHidden)
        XCTAssertTrue(host.isAttached(to: renderer), "Removing unavailable content must not release application authority.")

        var loadsWithWindow = 0
        renderer.onLoad = {
            XCTAssertTrue(renderer.window === window,
                          "Retry must reattach before the actual public load call, not await a later SwiftUI update.")
            XCTAssertEqual(renderer.frame, container.bounds)
            loadsWithWindow += 1
        }
        defer { renderer.onLoad = nil }
        host.retryLoading()
        XCTAssertEqual(loadsWithWindow, 1)
        XCTAssertEqual(renderer.requests.map(\.url), [BundleResourcePolicy.entryURL])
        XCTAssertNotEqual(host.sessionID, failedSession)
        XCTAssertEqual(host.phase, .loading)
        container.setRendererAvailable(true)
        container.setRendererAvailable(true)
        XCTAssertTrue(container.webView === renderer)
        XCTAssertTrue(renderer.window === window)
        XCTAssertEqual(container.subviews.count, 1)
        XCTAssertTrue(container.subviews.first === renderer)
        XCTAssertFalse(container.accessibilityElementsHidden)
        XCTAssertFalse(host.attach(to: WKWebView()), "Retry cannot introduce a competing renderer.")
    }

    func testDetachedRendererIsRetainedAndFitsTheCurrentBoundsWhenRestored() {
        weak var original: WKWebView?
        let container: EngineWebViewContainer = {
            let renderer = WKWebView()
            original = renderer
            return EngineWebViewContainer(webView: renderer)
        }()
        container.frame = CGRect(x: 0, y: 0, width: 320, height: 480)
        container.setRendererAvailable(true)
        container.layoutIfNeeded()
        XCTAssertEqual(container.webView.frame, container.bounds)

        container.setRendererAvailable(false)
        XCTAssertNotNil(original, "The container owns its renderer even while it has no superview.")
        container.frame = CGRect(x: 0, y: 0, width: 640, height: 360)
        container.setRendererAvailable(true)
        container.layoutIfNeeded()
        XCTAssertTrue(original === container.webView)
        XCTAssertEqual(container.webView.frame, container.bounds)
        container.frame.size = CGSize(width: 420, height: 720)
        container.layoutIfNeeded()
        XCTAssertEqual(container.webView.frame, container.bounds)
        container.setRendererAvailable(false)
    }

    func testDismantlingUnavailableRendererDetachesOnlyItsOwnHost() {
        let host = EngineHostModel(launchArguments: [])
        let renderer = WKWebView()
        let coordinator = EngineWebView.Coordinator(host: host)
        let container = EngineWebViewContainer(webView: renderer)
        XCTAssertTrue(host.attach(to: renderer))
        renderer.navigationDelegate = coordinator
        container.observeAvailability(of: host)
        host.fail("Controlled renderer failure")
        container.setRendererAvailable(false)

        EngineWebView.dismantleUIView(container, coordinator: coordinator)
        XCTAssertFalse(host.isAttached(to: renderer))
        XCTAssertNil(renderer.navigationDelegate)
        XCTAssertNil(renderer.superview)

        XCTAssertTrue(host.attach(to: renderer))
        host.loading()
        XCTAssertNil(renderer.superview,
                     "The cancelled observer must stay silent even if this same renderer acquires authority again.")
        host.detach(from: renderer)

        let replacement = WKWebView()
        XCTAssertTrue(host.attach(to: replacement))
        host.loading()
        XCTAssertNil(renderer.superview, "Dismantling cancels observation before any future phase change.")
        EngineWebView.dismantleUIView(container, coordinator: coordinator)
        XCTAssertTrue(host.isAttached(to: replacement), "Repeated old teardown cannot detach a later renderer owner.")
        host.detach(from: replacement)
    }
}
