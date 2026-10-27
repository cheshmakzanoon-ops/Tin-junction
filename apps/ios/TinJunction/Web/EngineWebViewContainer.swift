import Combine
import UIKit
import WebKit

/// Keeps one renderer alive across native recovery without leaving its remote
/// accessibility tree attached to the visible UIKit hierarchy.
@MainActor
final class EngineWebViewContainer: UIView {
    let webView: WKWebView
    private var phaseObservation: AnyCancellable?

    init(webView: WKWebView) {
        self.webView = webView
        super.init(frame: .zero)
        isAccessibilityElement = false
        clipsToBounds = true
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("Use init(webView:)") }

    func observeAvailability(of host: EngineHostModel) {
        stopObservingAvailability()
        phaseObservation = host.$phase.sink { [weak self, weak host] phase in
            guard let self, let host else { return }
            // Published emits synchronously before its stored value changes.
            // Use the emitted phase so Retry reattaches before the host's
            // following load call, without waiting for a SwiftUI update.
            self.setRendererAvailable(host.isAttached(to: self.webView) && phase != .failed)
        }
    }

    func stopObservingAvailability() {
        phaseObservation?.cancel()
        phaseObservation = nil
    }

    func setRendererAvailable(_ available: Bool) {
        accessibilityElementsHidden = !available
        if available {
            guard webView.superview !== self else { return }
            webView.frame = bounds
            addSubview(webView)
        } else {
            // Hiding the WKWebView itself still exposed host.webview in the
            // actual packaged UI result. Remove it from the hierarchy while
            // retaining this exact instance for the explicit Retry operation.
            webView.removeFromSuperview()
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if webView.superview === self { webView.frame = bounds }
    }
}
