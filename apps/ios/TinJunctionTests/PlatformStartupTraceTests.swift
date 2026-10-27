#if DEBUG
import XCTest
@testable import TinJunction

final class PlatformStartupTraceTests: XCTestCase {
    func testTraceBoundAndFieldValidation() {
        var trace = PlatformTraceBuffer()
        XCTAssertFalse(trace.append(event: "user document name", elapsed: 1))
        XCTAssertFalse(trace.append(event: "/private/path", elapsed: 1))
        XCTAssertFalse(trace.append(event: String(repeating: "a", count: 97), elapsed: 1))
        XCTAssertFalse(trace.append(event: "web.ready", elapsed: .nan))
        XCTAssertFalse(trace.append(event: "web.ready", elapsed: -1))
        for index in 0..<128 { XCTAssertTrue(trace.append(event: "resource.ready.bytes=42", elapsed: Double(index))) }
        XCTAssertFalse(trace.append(event: "resource.ready", elapsed: 129))
        XCTAssertEqual(trace.entries.count, 128)
    }
}
#endif
