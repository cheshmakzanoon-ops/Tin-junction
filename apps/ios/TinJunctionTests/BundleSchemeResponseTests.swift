import XCTest
@testable import TinJunction

@MainActor
final class BundleSchemeResponseTests: XCTestCase {
    func testCustomOriginBinaryResponsesCarrySuccessfulStatusAndExactMetadata() throws {
        for (extensionName, mimeType) in ["glb": "model/gltf-binary", "png": "image/png", "wav": "audio/wav", "wasm": "application/wasm"] {
            let url = try XCTUnwrap(URL(string: "tinjunction://bundle/probe/fixture.\(extensionName)"))
            let response = try BundleSchemeHandler.response(for: url, file: URL(fileURLWithPath: "/bundle/fixture.\(extensionName)"), byteCount: 29_356)
            XCTAssertEqual(response.url, url, "Metadata must keep the original local resource identity.")
            XCTAssertEqual(response.statusCode, 200, "Generic URLResponse yields status 0 and fails the real Fetch API success check.")
            XCTAssertEqual(response.mimeType, mimeType)
            XCTAssertEqual(response.value(forHTTPHeaderField: "Content-Type"), mimeType)
            XCTAssertEqual(response.value(forHTTPHeaderField: "Content-Length"), "29356")
            XCTAssertEqual(response.expectedContentLength, 29_356)
            XCTAssertNil(response.textEncodingName)
            XCTAssertEqual(Set(response.allHeaderFields.keys.compactMap { ($0 as? String)?.lowercased() }), ["content-type", "content-length"])
        }
    }

    func testTextEncodingAndResourceBoundsRemainExplicit() throws {
        let url = BundleResourcePolicy.entryURL
        let bytes = Data("caf\u{00e9}".utf8)
        let response = try BundleSchemeHandler.response(for: url, file: URL(fileURLWithPath: "/bundle/index.html"), byteCount: bytes.count)
        XCTAssertEqual(response.statusCode, 200)
        XCTAssertEqual(response.mimeType, "text/html")
        XCTAssertEqual(response.textEncodingName?.lowercased(), "utf-8")
        XCTAssertEqual(response.expectedContentLength, 5, "Content-Length counts bytes, not user-visible characters.")
        XCTAssertThrowsError(try BundleSchemeHandler.response(for: url, file: URL(fileURLWithPath: "/bundle/private.exe"), byteCount: 1))
        XCTAssertThrowsError(try BundleSchemeHandler.response(for: url, file: URL(fileURLWithPath: "/bundle/index.html"), byteCount: -1))
        XCTAssertThrowsError(try BundleSchemeHandler.response(for: url, file: URL(fileURLWithPath: "/bundle/index.html"), byteCount: BundleResourcePolicy.maximumAssetBytes + 1))
    }
}
