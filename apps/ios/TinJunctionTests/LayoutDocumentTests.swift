import Foundation
import XCTest
@testable import TinJunction

enum LayoutFixtures {
    static func document(revision: Int = 0) -> LayoutDocument {
        LayoutDocument(
            format: "tin-junction-layout", schemaVersion: 1, documentId: "test-railway", revision: revision,
            name: "My little railway", seed: 12345,
            track: .init(kind: "oval", straightLength: 0.36, radius: 0.15),
            train: .init(distance: 0.12, speed: 0, throttle: 0, direction: 1, wheelTravel: 0),
            scenery: [], environment: .init(timeOfDay: "day"), tick: 0
        )
    }
}

final class LayoutDocumentTests: XCTestCase {
    func testTypeScriptStarterFixtureDecodesWithIdenticalModelBounds() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "starter-layout", withExtension: "json"))
        let document = try LayoutDocument.decode(Data(contentsOf: url))
        XCTAssertEqual(document.documentId, "layout-\(String(20_261_026, radix: 16))")
        XCTAssertEqual(document.name, "Alpine afternoon")
        XCTAssertEqual(document.scenery.count, 29)
        XCTAssertEqual(document.track.straightLength, 0.34)
        XCTAssertEqual(document.track.radius, 0.145)
        XCTAssertEqual(try LayoutDocument.decode(document.canonicalData()), document)
    }

    func testRoundTripPreservesIdentityAndModel() throws {
        let document = LayoutFixtures.document(revision: 7)
        XCTAssertEqual(try LayoutDocument.decode(document.canonicalData()), document)
        XCTAssertEqual(try document.canonicalData(), try document.canonicalData())
    }

    func testUnknownFieldsAndFutureSchemaAreRejected() throws {
        var raw = try LayoutFixtures.document().bridgeObject()
        raw["script"] = "alert(1)"
        XCTAssertThrowsError(try LayoutDocument.decode(raw))
        raw.removeValue(forKey: "script")
        raw["schemaVersion"] = 2
        XCTAssertThrowsError(try LayoutDocument.decode(raw))
        raw["schemaVersion"] = 1
        var train = try XCTUnwrap(raw["train"] as? [String: Any])
        train["path"] = "../private"
        raw["train"] = train
        XCTAssertThrowsError(try LayoutDocument.decode(raw))
    }

    func testInvalidNumericTypesAndRangesAreRejected() throws {
        for invalid: Any in [true, -1, 9_000_000_000_000_001 as Int, 1.5] {
            var raw = try LayoutFixtures.document().bridgeObject()
            raw["revision"] = invalid
            XCTAssertThrowsError(try LayoutDocument.decode(raw))
        }
        var document = LayoutFixtures.document()
        document.train.speed = 0.181
        XCTAssertThrowsError(try document.validate())
        document.train.speed = 0
        document.train.distance = document.track.length
        XCTAssertThrowsError(try document.validate())
        document.train.distance = 0
        document.train.wheelTravel = .infinity
        XCTAssertThrowsError(try document.validate())
        document.train.wheelTravel = 0
        document.track.radius = 0.06
        XCTAssertThrowsError(try document.validate(), "The consist needs a supported curve radius.")
        document.track.radius = 0.15
        document.track.straightLength = 0.5
        XCTAssertThrowsError(try document.validate(), "Oval must fit inside the case margin.")
    }

    func testNamesCountScalarsAndRejectControlCharacters() throws {
        var document = LayoutFixtures.document()
        document.name = String(repeating: "🚂", count: 80)
        XCTAssertNoThrow(try document.validate())
        document.name += "x"
        XCTAssertThrowsError(try document.validate())
        document.name = "Railway\u{0085}name"
        XCTAssertThrowsError(try document.validate())
        document.name = "Railway\nname"
        XCTAssertThrowsError(try document.validate())
        document.name = "  \u{feff} "
        XCTAssertThrowsError(try document.validate())
    }

    func testSceneryChecksIdentityBoardRailAndFixedFixtures() throws {
        var document = LayoutFixtures.document()
        let fir = LayoutDocument.Scenery(id: "fir-1", kind: "fir", x: -0.30, z: -0.20, rotation: 0, scale: 1)
        document.scenery = [fir]
        XCTAssertNoThrow(try document.validate())
        document.scenery.append(fir)
        XCTAssertThrowsError(try document.validate())
        document.scenery = [fir]
        document.scenery[0].x = 0.389
        XCTAssertThrowsError(try document.validate(), "Footprint must fit, not only the pivot.")
        document.scenery[0].x = 0
        document.scenery[0].z = 0.15
        XCTAssertThrowsError(try document.validate(), "Rail clearance is independent of mesh picking.")
        document.scenery[0].z = -0.09
        XCTAssertThrowsError(try document.validate(), "Station footprint is reserved.")
        document.scenery[0].x = 0.20
        document.scenery[0].z = 0.06
        XCTAssertThrowsError(try document.validate(), "Pond footprint is reserved.")
    }

    func testRestoreStopsTrainWithoutMutatingSavedDocument() {
        var document = LayoutFixtures.document(revision: 9)
        document.train.speed = 0.1
        document.train.throttle = 0.8
        document.tick = 400
        let restored = document.stoppedForRestore()
        XCTAssertEqual(restored.train.speed, 0)
        XCTAssertEqual(restored.train.throttle, 0)
        XCTAssertEqual(restored.train.distance, document.train.distance)
        XCTAssertEqual(restored.revision, 9)
        XCTAssertEqual(restored.tick, 400)
        XCTAssertEqual(document.train.throttle, 0.8)
    }

    func testSourceSizeIsBoundedBeforeDecoding() {
        XCTAssertThrowsError(try LayoutDocument.decode(Data(repeating: 32, count: LayoutDocument.maximumBytes + 1)))
    }
}
