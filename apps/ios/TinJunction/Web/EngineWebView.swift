import SwiftUI
import WebKit

struct EngineWebView: UIViewRepresentable {
    @ObservedObject var host: EngineHostModel

    func makeCoordinator() -> Coordinator { Coordinator(host: host) }

    func makeUIView(context: Context) -> WKWebView {
        PlatformStartupTrace.record("webview.created")
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        configuration.allowsAirPlayForMediaPlayback = false
        configuration.mediaTypesRequiringUserActionForPlayback = .all
        configuration.userContentController.add(context.coordinator, name: "tinJunction")

        let assetRoot = Bundle.main.url(forResource: "WebAssets", withExtension: nil)
        if let assetRoot {
            configuration.setURLSchemeHandler(BundleSchemeHandler(root: assetRoot), forURLScheme: BundleResourcePolicy.scheme)
        }
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.scrollView.isScrollEnabled = false
        view.scrollView.bounces = false
        view.accessibilityIdentifier = "host.webview"
        #if DEBUG
        view.isInspectable = true
        #endif
        host.attach(view)
        if assetRoot != nil {
            view.load(URLRequest(url: BundleResourcePolicy.entryURL))
        } else {
            host.fail("WebAssets missing. Run npm run bundle:ios before XcodeGen.")
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.stopLoading()
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "tinJunction")
        uiView.navigationDelegate = nil
        coordinator.host.detach()
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let host: EngineHostModel
        init(host: EngineHostModel) { self.host = host }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "tinJunction", message.frameInfo.isMainFrame,
                  BundleResourcePolicy.isEntryDocument(message.frameInfo.request.url) else { return }
            do { host.accept(try BridgeEnvelope.decode(message.body)) }
            catch { host.fail("Rejected invalid renderer bridge message.") }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
            let allowed = navigationAction.targetFrame?.isMainFrame == true
                && BundleResourcePolicy.isEntryDocument(navigationAction.request.url)
            return allowed ? .allow : .cancel
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            PlatformStartupTrace.record("navigation.started.window=\(webView.window != nil ? 1 : 0)")
            host.loading()
        }

        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            PlatformStartupTrace.record("navigation.committed.window=\(webView.window != nil ? 1 : 0)")
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            PlatformStartupTrace.record("navigation.finished.window=\(webView.window != nil ? 1 : 0)")
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            PlatformStartupTrace.record("navigation.provisionalFailed")
            host.fail("Document load failed: \(error.localizedDescription)")
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            PlatformStartupTrace.record("navigation.failed")
            host.fail("Navigation failed: \(error.localizedDescription)")
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            PlatformStartupTrace.record("webview.processTerminated")
            host.contentProcessTerminated()
        }
    }
}
