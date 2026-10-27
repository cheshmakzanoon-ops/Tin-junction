import XCTest
@testable import TinJunction

final class BundleResourcePolicyTests: XCTestCase {
    private func withFixture(_ body: (URL) throws -> Void) throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("tin-junction-policy-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: root.appendingPathComponent("assets"), withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        try Data("<html></html>".utf8).write(to: root.appendingPathComponent("index.html"))
        try Data("/* fixture */".utf8).write(to: root.appendingPathComponent("assets/main.js"))
        try body(root)
    }

    func testResolvesOnlyWithinBundle() throws {
        try withFixture { root in
            let request = URLRequest(url: URL(string: "tinjunction://bundle/assets/main.js")!)
            let resolved = try BundleResourcePolicy.resolve(request, root: root)
            XCTAssertEqual(resolved, root.appendingPathComponent("assets/main.js").resolvingSymlinksInPath())
        }
    }

    func testRejectsTraversalAndEncodedSeparators() throws {
        try withFixture { root in
            for path in ["/%2e%2e/index.html", "/assets/%2e%2e/index.html", "/assets%2fmain.js", "/assets%5cmain.js", "/%252e%252e/index.html", "/assets//main.js", "/assets/%00main.js"] {
                let request = URLRequest(url: URL(string: "tinjunction://bundle" + path)!)
                XCTAssertThrowsError(try BundleResourcePolicy.resolve(request, root: root), path)
            }
        }
    }

    func testRejectsRemoteSourcesCredentialsAndQueries() throws {
        try withFixture { root in
            for raw in ["https://bundle/index.html", "tinjunction://other/index.html", "tinjunction://user@bundle/index.html", "tinjunction://bundle:123/index.html", "tinjunction://bundle/index.html?path=other", "tinjunction://bundle/index.html#frame"] {
                XCTAssertThrowsError(try BundleResourcePolicy.resolve(URLRequest(url: URL(string: raw)!), root: root), raw)
            }
        }
    }

    func testRejectsPostAndUnknownResources() throws {
        try withFixture { root in
            var post = URLRequest(url: BundleResourcePolicy.entryURL)
            post.httpMethod = "POST"
            XCTAssertThrowsError(try BundleResourcePolicy.resolve(post, root: root))
            XCTAssertThrowsError(try BundleResourcePolicy.resolve(URLRequest(url: URL(string: "tinjunction://bundle/missing.js")!), root: root))
            XCTAssertThrowsError(try BundleResourcePolicy.resolve(URLRequest(url: URL(string: "tinjunction://bundle/code.exe")!), root: root))
        }
    }

    func testRejectsSymlinkEscape() throws {
        try withFixture { root in
            let outside = root.deletingLastPathComponent().appendingPathComponent("tin-junction-outside-\(UUID().uuidString).js")
            try Data("outside".utf8).write(to: outside)
            defer { try? FileManager.default.removeItem(at: outside) }
            try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("escape.js"), withDestinationURL: outside)
            XCTAssertThrowsError(try BundleResourcePolicy.resolve(URLRequest(url: URL(string: "tinjunction://bundle/escape.js")!), root: root))
        }
    }

    func testEntryNavigationIsExact() {
        XCTAssertTrue(BundleResourcePolicy.isEntryDocument(BundleResourcePolicy.entryURL))
        XCTAssertFalse(BundleResourcePolicy.isEntryDocument(URL(string: "tinjunction://bundle/assets/main.js")))
        XCTAssertFalse(BundleResourcePolicy.isEntryDocument(URL(string: "https://example.com")))
        XCTAssertFalse(BundleResourcePolicy.isEntryDocument(nil))
    }

    func testAppContainsGeneratedBundle() throws {
        let root = try XCTUnwrap(Bundle.main.url(forResource: "WebAssets", withExtension: nil))
        let entry = try BundleResourcePolicy.resolve(URLRequest(url: BundleResourcePolicy.entryURL), root: root)
        let document = try String(contentsOf: entry, encoding: .utf8)
        XCTAssertTrue(document.contains("<script"), "Bundle must include the built renderer, not a native placeholder.")
        XCTAssertFalse(document.contains("type=\"module\""), "Initial native spike packages a classic IIFE; module adoption needs explicit CORS evidence.")
    }
}
