import Foundation
import WebKit

/// Small, immutable, bundled files only. This synchronous harness handler has no
/// outstanding work after `start` returns, so `stop` has no task to cancel.
/// Streaming/large-asset IO must replace this before the production asset phase.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL

    init(root: URL) {
        self.root = root
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        do {
            let file = try BundleResourcePolicy.resolve(urlSchemeTask.request, root: root)
            let data = try Data(contentsOf: file, options: .mappedIfSafe)
            // Only the known bundled extension and byte count; never log a path.
            PlatformStartupTrace.record("resource.ready.type=\(file.pathExtension).bytes=\(data.count)")
            guard data.count <= BundleResourcePolicy.maximumAssetBytes else {
                throw BundleResourcePolicy.Rejection.assetTooLarge
            }
            guard let requestURL = urlSchemeTask.request.url else { throw BundleResourcePolicy.Rejection.invalidURL }
            let response = URLResponse(
                url: requestURL,
                mimeType: BundleResourcePolicy.mimeTypes[file.pathExtension.lowercased()],
                expectedContentLength: data.count,
                textEncodingName: ["html", "js", "css", "json", "gltf", "svg"].contains(file.pathExtension.lowercased()) ? "utf-8" : nil
            )
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch {
            PlatformStartupTrace.record("resource.rejected")
            urlSchemeTask.didFailWithError(error)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // Requests are fulfilled synchronously. Never call a task after this method.
    }
}
