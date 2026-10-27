#if DEBUG
import XCTest
@testable import TinJunction

final class WebStartupDiagnosticTests: XCTestCase {
    private var snapshot: [String: Any] {
        ["formatVersion": 1, "readyState": "complete", "hidden": false, "visibilityState": "visible",
         "receiverExists": true, "diagnosticsExists": true, "renderer": "webgl2", "frameCount": 0,
         "initialized": false, "loaded": false, "lifecycle": "running", "failureObserverExists": true,
         "scriptErrorCount": 0, "unhandledRejectionCount": 0]
    }

    func testSnapshotDistinguishesDocumentReadinessFromFirstFrameWithoutLeakingArbitraryData() throws {
        let events = try XCTUnwrap(WebStartupSnapshot.events(from: snapshot))
        XCTAssertEqual(events, [
            "web.snapshot.document=complete.visibility=visible.hidden=0",
            "web.snapshot.receiver=1.diagnostics=1",
            "web.snapshot.observer=1.errors=0.rejections=0",
            "web.snapshot.renderer=webgl2.initialized=0.frames=0",
            "web.snapshot.loaded=0.lifecycle=running"
        ])
        var trace = PlatformTraceBuffer()
        for event in events { XCTAssertTrue(trace.append(event: event, elapsed: 1)) }
        var complete = snapshot
        complete["frameCount"] = 23
        complete["initialized"] = true
        complete["loaded"] = true
        XCTAssertEqual(WebStartupSnapshot.events(from: complete)?.last, "web.snapshot.loaded=1.lifecycle=running")
        var hidden = snapshot
        hidden["hidden"] = true
        hidden["visibilityState"] = "hidden"
        hidden["lifecycle"] = "paused"
        XCTAssertEqual(WebStartupSnapshot.events(from: hidden)?.first, "web.snapshot.document=complete.visibility=hidden.hidden=1")
        XCTAssertEqual(WebStartupSnapshot.events(from: hidden)?.last, "web.snapshot.loaded=0.lifecycle=paused")
    }

    func testAbsentDiagnosticsRemainDistinctFromAZeroFrameRenderer() throws {
        var absent = snapshot
        absent["diagnosticsExists"] = false
        absent["receiverExists"] = false
        for key in ["renderer", "frameCount", "initialized", "loaded", "lifecycle"] { absent[key] = NSNull() }
        XCTAssertEqual(WebStartupSnapshot.events(from: absent)?.count, 3)
        absent["frameCount"] = 0
        XCTAssertNil(WebStartupSnapshot.events(from: absent))
    }

    func testUnknownFieldsEnumsNestedValuesAndNumericBooleanSubstitutesAreRejected() {
        XCTAssertNil(WebStartupSnapshot.events(from: [Any]()))
        for key in snapshot.keys {
            var missing = snapshot
            missing.removeValue(forKey: key)
            XCTAssertNil(WebStartupSnapshot.events(from: missing), key)
        }
        var extra = snapshot
        extra["documentName"] = "Must never enter the startup trace"
        XCTAssertNil(WebStartupSnapshot.events(from: extra))
        let invalidValues: [(String, Any)] = [
            ("renderer", "private/path" as Any), ("lifecycle", "unexpected"), ("readyState", "loaded"),
            ("visibilityState", "unknown"), ("frameCount", -1), ("frameCount", 1.25), ("frameCount", 1_000_000_001),
            ("frameCount", Double.nan), ("frameCount", Double.infinity), ("frameCount", true),
            ("formatVersion", true), ("formatVersion", 2), ("hidden", 0), ("receiverExists", 1),
            ("diagnosticsExists", 1), ("initialized", 0), ("loaded", 1), ("renderer", ["nested": "value"]),
            ("failureObserverExists", 1), ("scriptErrorCount", 33), ("unhandledRejectionCount", -1),
            ("scriptErrorCount", false), ("unhandledRejectionCount", NSNull())
        ]
        for (key, invalid) in invalidValues {
            var value = snapshot
            value[key] = invalid
            XCTAssertNil(WebStartupSnapshot.events(from: value), key)
        }
    }

    func testBoundedFailureCountsAndAbsentObserverRemainExplicit() {
        var failures = snapshot
        failures["scriptErrorCount"] = 32
        failures["unhandledRejectionCount"] = 2
        XCTAssertTrue(WebStartupSnapshot.events(from: failures)?.contains("web.snapshot.observer=1.errors=32.rejections=2") == true)
        failures["failureObserverExists"] = false
        XCTAssertNil(WebStartupSnapshot.events(from: failures))
        failures["scriptErrorCount"] = NSNull()
        failures["unhandledRejectionCount"] = NSNull()
        XCTAssertTrue(WebStartupSnapshot.events(from: failures)?.contains("web.snapshot.observer=0") == true)
    }
}
#endif
