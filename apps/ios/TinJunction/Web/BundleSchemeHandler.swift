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
            let response = try Self.response(for: requestURL, file: file, byteCount: data.count)
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

    /// WebKit exposes status 0 to fetch for a generic URLResponse. Explicit
    /// success metadata is required even though the bytes use our local scheme.
    /// Only policy-owned MIME and measured length are returned; request headers
    /// cannot add permissions, cookies, redirects or CORS exceptions.
    static func response(for requestURL: URL, file: URL, byteCount: Int) throws -> HTTPURLResponse {
        let extensionName = file.pathExtension.lowercased()
        guard let mimeType = BundleResourcePolicy.mimeTypes[extensionName] else {
            throw BundleResourcePolicy.Rejection.unsupportedType
        }
        guard (0...BundleResourcePolicy.maximumAssetBytes).contains(byteCount) else {
            throw BundleResourcePolicy.Rejection.assetTooLarge
        }
        let isText = ["html", "js", "css", "json", "gltf", "svg"].contains(extensionName)
        guard let response = HTTPURLResponse(url: requestURL, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: [
            "Content-Type": mimeType + (isText ? "; charset=utf-8" : ""),
            "Content-Length": String(byteCount)
        ]) else { throw BundleResourcePolicy.Rejection.invalidURL }
        return response
    }
}
