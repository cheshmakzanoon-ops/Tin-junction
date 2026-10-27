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
        #if DEBUG
        context.coordinator.startupFault.install(in: configuration.userContentController)
        #endif

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
        updateAvailability(of: view)
        #if DEBUG
        view.isInspectable = true
        #endif
        guard host.attach(to: view) else {
            view.configuration.userContentController.removeScriptMessageHandler(forName: "tinJunction")
            view.navigationDelegate = nil
            return view
        }
        if assetRoot != nil {
            context.coordinator.beginInitialDocument(in: view)
        } else {
            host.fail("WebAssets missing. Run npm run bundle:ios before XcodeGen.")
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        updateAvailability(of: uiView)
    }

    private func updateAvailability(of view: WKWebView) {
        // The packaged UI failure showed that SwiftUI's accessibilityHidden
        // alone left WebKit's remote accessibility container exposed. Hide the
        // actual UIKit view and its descendants while native recovery owns the
        // surface. Preserve this same renderer for the explicit Retry path.
        let failed = host.phase == .failed
        view.isHidden = failed
        view.accessibilityElementsHidden = failed
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        coordinator.cancelPreparation()
        #if DEBUG
        coordinator.cancelStartupHold()
        coordinator.startupFault.disarm()
        #endif
        uiView.stopLoading()
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "tinJunction")
        uiView.navigationDelegate = nil
        coordinator.host.detach(from: uiView)
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let host: EngineHostModel
        #if DEBUG
        let startupFault = HostStartupFault()
        private var startupHoldTask: Task<Void, Never>?
        private var startupHoldToken: UUID?
        private var preparationTask: Task<Void, Never>?
        private var preparationTimeout: Task<Void, Never>?
        #endif
        init(host: EngineHostModel) { self.host = host }

        func beginInitialDocument(in view: WKWebView) {
            #if DEBUG
            if host.startupHold.state == .holding { return }
            if host.startupHold.state == .requested {
                startupHoldTask?.cancel()
                // Defer publication until makeUIView has returned. No actual
                // navigation or readiness timeout begins while the gate holds.
                startupHoldTask = Task { [weak self, weak view] in
                    guard let self, let view, !Task.isCancelled,
                          self.host.isAttached(to: view), self.host.phase != .failed,
                          self.host.startupHold.state == .requested else { return }
                    self.startupHoldTask = nil
                    self.startupHoldToken = self.host.startupHold.arm(
                        onRelease: { [weak self, weak view] in
                            guard let self, let view, self.host.isAttached(to: view),
                                  self.host.phase != .failed else { return }
                            self.startupHoldToken = nil
                            self.loadInitialDocument(in: view)
                        },
                        onExpiry: { [weak self, weak view] in
                            guard let self, let view, self.host.isAttached(to: view),
                                  self.host.phase != .failed else { return }
                            self.startupHoldToken = nil
                            self.host.fail("The explicit startup diagnostic expired before navigation. Try loading again.")
                        })
                }
                return
            }
            #endif
            loadInitialDocument(in: view)
        }

        #if DEBUG
        func cancelStartupHold() {
            startupHoldTask?.cancel()
            startupHoldTask = nil
            if let token = startupHoldToken { host.startupHold.cancel(token: token) }
            startupHoldToken = nil
        }
        #endif

        func loadInitialDocument(in view: WKWebView) {
            #if DEBUG
            if host.assetProbeEnabled {
                cancelPreparation()
                // The report may claim a denied network only after both public
                // WebKit operations finish, before the first navigation.
                preparationTask = Task { [weak self, weak view] in
                    guard let self, let view else { return }
                    do {
                        guard let rules = try await WKContentRuleListStore.default().compileContentRuleList(
                            forIdentifier: AssetOriginProbe.networkRuleIdentifier,
                            encodedContentRuleList: AssetOriginProbe.networkRules) else {
                            throw CocoaError(.fileReadUnknown)
                        }
                        guard !Task.isCancelled, self.host.isAttached(to: view) else { return }
                        view.configuration.userContentController.add(rules)
                        await view.configuration.websiteDataStore.removeData(
                            ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
                        guard !Task.isCancelled, self.host.isAttached(to: view) else { return }
                        self.host.assetProbeDidPrepare(networkDenied: true, webDataCleared: true,
                                                      persistentStorage: view.configuration.websiteDataStore.isPersistent)
                        self.preparationTimeout?.cancel()
                        self.preparationTimeout = nil
                        self.preparationTask = nil
                        view.load(URLRequest(url: BundleResourcePolicy.entryURL))
                    } catch {
                        guard !Task.isCancelled, self.host.isAttached(to: view) else { return }
                        self.preparationTimeout?.cancel()
                        self.preparationTimeout = nil
                        self.preparationTask = nil
                        self.host.fail("Asset diagnostic preparation failed: \(error.localizedDescription)")
                    }
                }
                preparationTimeout = Task { [weak self, weak view] in
                    do { try await Task.sleep(for: .seconds(15)) } catch { return }
                    guard let self, let view, !Task.isCancelled, self.host.isAttached(to: view) else { return }
                    self.preparationTask?.cancel()
                    self.preparationTask = nil
                    self.host.fail("Asset diagnostic preparation timed out before navigation.")
                }
                return
            }
            #endif
            view.load(URLRequest(url: BundleResourcePolicy.entryURL))
        }

        func cancelPreparation() {
            #if DEBUG
            preparationTask?.cancel()
            preparationTask = nil
            preparationTimeout?.cancel()
            preparationTimeout = nil
            #endif
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let webView = message.webView, host.isAttached(to: webView),
                  message.name == "tinJunction", message.frameInfo.isMainFrame,
                  BundleResourcePolicy.isEntryDocument(message.frameInfo.request.url) else { return }
            do {
                let envelope = try BridgeEnvelope.decode(message.body)
                #if DEBUG
                if envelope.type == "engine.error" { startupFault.disarm() }
                #endif
                host.accept(envelope)
            }
            catch { host.fail("Rejected invalid renderer bridge message.") }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
            let allowed = host.isAttached(to: webView) && navigationAction.targetFrame?.isMainFrame == true
                && BundleResourcePolicy.isEntryDocument(navigationAction.request.url)
            return allowed ? .allow : .cancel
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            guard host.isAttached(to: webView) else { return }
            PlatformStartupTrace.record("navigation.started.window=\(webView.window != nil ? 1 : 0)")
            host.loading()
        }

        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            guard host.isAttached(to: webView) else { return }
            PlatformStartupTrace.record("navigation.committed.window=\(webView.window != nil ? 1 : 0)")
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            guard host.isAttached(to: webView) else { return }
            #if DEBUG
            startupFault.disarm()
            #endif
            PlatformStartupTrace.record("navigation.finished.window=\(webView.window != nil ? 1 : 0)")
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            guard host.isAttached(to: webView) else { return }
            PlatformStartupTrace.record("navigation.provisionalFailed")
            host.fail("Document load failed: \(error.localizedDescription)")
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            guard host.isAttached(to: webView) else { return }
            PlatformStartupTrace.record("navigation.failed")
            host.fail("Navigation failed: \(error.localizedDescription)")
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            guard host.isAttached(to: webView) else { return }
            PlatformStartupTrace.record("webview.processTerminated")
            host.contentProcessTerminated()
        }
    }
}
