import Foundation

enum BundleResourcePolicy {
    static let scheme = "tinjunction"
    static let host = "bundle"
    static let maximumAssetBytes = 64 * 1024 * 1024
    static let entryURL = URL(string: "tinjunction://bundle/index.html")!
    static let mimeTypes = [
        "html": "text/html", "js": "text/javascript", "css": "text/css",
        "json": "application/json", "glb": "model/gltf-binary", "gltf": "model/gltf+json",
        "bin": "application/octet-stream", "wasm": "application/wasm", "ktx2": "image/ktx2",
        "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "webp": "image/webp", "avif": "image/avif", "svg": "image/svg+xml",
        "woff2": "font/woff2", "wav": "audio/wav", "mp3": "audio/mpeg", "ogg": "audio/ogg"
    ]

    enum Rejection: Error, Equatable {
        case invalidURL, invalidMethod, invalidPath, unsupportedType, outsideBundle
        case missingFile, assetTooLarge
    }

    static func isEntryDocument(_ url: URL?) -> Bool {
        guard let url, let parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return false }
        return parts.scheme == scheme && parts.host == host && parts.path == "/index.html"
            && parts.user == nil && parts.password == nil && parts.port == nil
            && parts.query == nil && parts.fragment == nil
    }

    static func resolve(_ request: URLRequest, root: URL) throws -> URL {
        guard request.httpMethod == nil || request.httpMethod == "GET" else { throw Rejection.invalidMethod }
        guard let url = request.url, let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.scheme == scheme, parts.host == host,
              parts.user == nil, parts.password == nil, parts.port == nil,
              parts.query == nil, parts.fragment == nil else { throw Rejection.invalidURL }

        let encoded = parts.percentEncodedPath.lowercased()
        guard !["%2f", "%5c", "%00"].contains(where: encoded.contains),
              let path = parts.percentEncodedPath.removingPercentEncoding,
              path.hasPrefix("/"), !path.contains("\\"), !path.contains("%"), !path.contains("\0") else {
            throw Rejection.invalidPath
        }
        let segments = path.dropFirst().split(separator: "/", omittingEmptySubsequences: false)
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
        guard !segments.isEmpty, segments.allSatisfy({ segment in
            !segment.isEmpty && segment != "." && segment != ".."
                && segment.unicodeScalars.allSatisfy { allowed.contains($0) }
        }) else { throw Rejection.invalidPath }

        let canonicalRoot = root.standardizedFileURL.resolvingSymlinksInPath()
        let candidate = canonicalRoot.appendingPathComponent(String(path.dropFirst()))
            .standardizedFileURL.resolvingSymlinksInPath()
        guard candidate.path.hasPrefix(canonicalRoot.path + "/") else { throw Rejection.outsideBundle }
        guard mimeTypes[candidate.pathExtension.lowercased()] != nil else { throw Rejection.unsupportedType }
        guard let values = try? candidate.resourceValues(forKeys: [.isRegularFileKey, .fileSizeKey]),
              values.isRegularFile == true, let size = values.fileSize else { throw Rejection.missingFile }
        guard size <= maximumAssetBytes else { throw Rejection.assetTooLarge }
        return candidate
    }
}
