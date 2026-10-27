#if DEBUG
import XCTest
@testable import TinJunction

@MainActor
final class PlatformProbeTests: XCTestCase {
    private func report(_ host: EngineHostModel) throws -> [String: Any] {
        try XCTUnwrap(JSONSerialization.jsonObject(with: Data(host.platformProbeJSON.utf8)) as? [String: Any])
    }

    func testObservedNilIsNotInventedZeroOrMissingCallback() throws {
        let host = EngineHostModel()
        host.updateViewport(NativeViewport(width: 400, height: 600, pixelRatio: 2, reservedRegions: []))
        XCTAssertEqual(try report(host)["hingeObservation"] as? String, "awaiting")
        host.updateHinge(angleDegrees: nil)
        XCTAssertEqual(try report(host)["hingeObservation"] as? String, "unavailable")
        XCTAssertTrue(try report(host)["hingeAngleDegrees"] is NSNull)
        host.updateHinge(angleDegrees: 0)
        XCTAssertEqual(try report(host)["hingeObservation"] as? String, "measured")
        XCTAssertEqual(try report(host)["hingeAngleDegrees"] as? Double, 0)
    }

    func testMeasuredGeometryPreservesUnitsAndReservedRectangles() throws {
        let host = EngineHostModel()
        let region = NativeViewport.Region(CGRect(x: 120, y: 20, width: 12, height: 300))
        host.updateViewport(NativeViewport(width: 400, height: 600, pixelRatio: 3, reservedRegions: [region]))
        host.updateHinge(angleDegrees: 135)
        let viewport = try XCTUnwrap(try report(host)["viewport"] as? [String: Any])
        XCTAssertEqual(viewport["width"] as? Double, 400)
        XCTAssertEqual(viewport["pixelRatio"] as? Double, 3)
        let regions = try XCTUnwrap(viewport["reservedRegions"] as? [[String: Double]])
        XCTAssertEqual(regions, [["x": 120, "y": 20, "width": 12, "height": 300]])
        XCTAssertEqual(viewport["hingeAngleDegrees"] as? Double, 135)
    }

    func testRejectedMeasurementsCannotReplaceLastValidObservation() {
        let host = EngineHostModel()
        host.updateViewport(NativeViewport(width: 400, height: 600, pixelRatio: 2, reservedRegions: []))
        host.updateHinge(angleDegrees: 90)
        let before = host.platformProbeJSON
        host.updateHinge(angleDegrees: .nan)
        host.updateHinge(angleDegrees: -1)
        host.updateViewport(NativeViewport(width: .infinity, height: 600, pixelRatio: 2, reservedRegions: []))
        host.updateViewport(NativeViewport(width: 0, height: 600, pixelRatio: 2, reservedRegions: []))
        XCTAssertEqual(host.platformProbeJSON, before)
    }
}
#endif
