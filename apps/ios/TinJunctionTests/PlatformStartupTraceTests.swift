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

    func testSnapshotPreservesBoundedEventOrderAndElapsedTime() throws {
        var trace = PlatformTraceBuffer()
        XCTAssertTrue(trace.append(event: "webview.created", elapsed: 0))
        XCTAssertTrue(trace.append(event: "navigation.started.window=1", elapsed: 1.25))
        XCTAssertFalse(trace.append(event: "user-layout-name", elapsed: .infinity))
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(trace.snapshotJSON().utf8)) as? [String: Any])
        XCTAssertEqual(object["formatVersion"] as? Int, 1)
        XCTAssertEqual(object["capacity"] as? Int, 128)
        let events = try XCTUnwrap(object["events"] as? [[String: Any]])
        XCTAssertEqual(events.count, 2)
        XCTAssertEqual(events[0]["event"] as? String, "webview.created")
        XCTAssertEqual(events[0]["elapsedSeconds"] as? Double, 0)
        XCTAssertEqual(events[1]["event"] as? String, "navigation.started.window=1")
        XCTAssertEqual(events[1]["elapsedSeconds"] as? Double, 1.25)
        for index in 2..<128 { XCTAssertTrue(trace.append(event: "resource.ready.bytes=42", elapsed: Double(index))) }
        XCTAssertLessThanOrEqual(trace.snapshotJSON().utf8.count, 32_768)
        XCTAssertFalse(trace.append(event: "overflow", elapsed: 128))
    }
}
#endif
