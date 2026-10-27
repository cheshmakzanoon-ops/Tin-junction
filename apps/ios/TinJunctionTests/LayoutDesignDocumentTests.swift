import Foundation
import XCTest
@testable import TinJunction

final class LayoutDesignDocumentTests: XCTestCase {
    private typealias Object = [String: Any]

    private func piece(_ id: String, z: Double = 0, length: Double = 0.5) -> Object {
        ["id": id, "centerline": ["kind": "straight", "length": length],
         "pose": ["x": 0.0, "y": 0.0, "z": z, "yaw": 0.0],
         "gauge": 0.0165, "profile": "tin-ho-profile-v1"]
    }

    private func document() -> Object {
        let profile: Object = ["maxSpeed": 0.18, "acceleration": 0.09, "brakeDeceleration": 0.18,
                               "emergencyDeceleration": 0.36, "endClearance": 0.001]
        let consist: Object = ["format": "tin-junction-routed-consist", "schemaVersion": 1,
                               "topologyRevision": 3, "switchRevision": 0, "selections": [],
                               "trainId": "train-one", "length": 0.1195, "direction": -1,
                               "intervals": [["edgeId": "main/forward", "from": 0.03, "to": 0.1495]]]
        let motion: Object = ["format": "tin-junction-routed-motion", "schemaVersion": 1, "profile": profile,
                              "tick": 137, "speed": 0.05, "throttle": 0.4, "signedTravel": -2.34,
                              "emergency": false, "consist": consist]
        let train: Object = ["id": "train-one", "catalogVersion": "tin-junction-vehicles-v1",
                             "vehicles": [["id": "vehicle-one", "catalogId": "steam-01"]], "motion": motion]
        let track: Object = ["revision": 3, "pieces": [piece("main")], "turnouts": [], "connections": []]
        return ["format": "tin-junction-layout", "schemaVersion": 2,
                "documentId": "design-railway", "revision": 7, "name": "A retained railway", "seed": 12345,
                "catalogVersion": "tin-junction-layout-kit-v1", "boardId": "workbench.case", "track": track,
                "selections": [], "scenery": [], "environment": ["timeOfDay": "dusk"], "train": train]
    }

    private func editingMotion(_ source: Object, _ edit: (inout Object) -> Void) -> Object {
        var result = source, train = source["train"] as! Object
        var motion = train["motion"] as! Object
        edit(&motion); train["motion"] = motion; result["train"] = train
        return result
    }

    private func editingConsist(_ source: Object, _ edit: (inout Object) -> Void) -> Object {
        editingMotion(source) { motion in
            var consist = motion["consist"] as! Object
            edit(&consist); motion["consist"] = consist
        }
    }

    func testExactRoundTripPreservesSavedMotionInsteadOfParkingTheDesign() throws {
        let raw = document(), decoded = try LayoutDesignDocument.decode(raw)
        XCTAssertEqual(decoded.documentId, "design-railway")
        XCTAssertEqual(decoded.revision, 7)
        XCTAssertEqual(try LayoutDesignDocument.decode(decoded.canonicalData()), decoded)
        XCTAssertEqual(try decoded.canonicalData(), try decoded.canonicalData())
        let train = try XCTUnwrap(decoded.bridgeObject()["train"] as? Object)
        let motion = try XCTUnwrap(train["motion"] as? Object)
        XCTAssertEqual(motion["speed"] as? Double, 0.05)
        XCTAssertEqual(motion["throttle"] as? Double, 0.4)
        XCTAssertEqual(motion["signedTravel"] as? Double, -2.34)
        XCTAssertEqual(motion["tick"] as? Double, 137)
        XCTAssertEqual(NSDictionary(dictionary: decoded.bridgeObject()), NSDictionary(dictionary: raw))
    }

    func testEmptyAndEditableDesignsRemainDistinctFromOperatingCertification() throws {
        var raw = document()
        raw["train"] = NSNull()
        raw["track"] = ["revision": 3, "pieces": [], "turnouts": [], "connections": []]
        raw["scenery"] = [["id": "house", "kind": "house", "x": 0.0, "z": -0.09, "rotation": 0, "scale": 1]]
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw), "V1's rendered station is not a V2 document exclusion.")
        var outside = piece("editable")
        outside["pose"] = ["x": 10.0, "y": 0.0, "z": 0.0, "yaw": 0.0]
        raw["track"] = ["revision": 3, "pieces": [outside], "turnouts": [], "connections": []]
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw), "Operating board clearance is a separate mandatory gate.")
        raw["scenery"] = [["id": "house", "kind": "house", "x": 0.38, "z": 0, "rotation": 0, "scale": 1]]
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "The scenery's full footprint must fit its board.")
    }

    func testRejectsUnknownFieldsAndNonNumericBooleanValues() {
        var raw = document(); raw["runtime"] = ["script": "untrusted"]
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        raw = document(); raw["revision"] = true
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        let badTick = editingMotion(document()) { $0["tick"] = true }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(badTick))
        let badDirection = editingConsist(document()) { $0["direction"] = true }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(badDirection))
        let authority = editingConsist(document()) { $0["nativeHandle"] = 7 }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(authority))
        var track = document()["track"] as! Object, invalid = piece("main")
        invalid["centerline"] = ["kind": "straight", "length": true]
        track["pieces"] = [invalid]; raw = document(); raw["track"] = track
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
    }

    func testConnectedRetainedPathRejectsMissingMisalignedAndReusedJoins() throws {
        let join: Object = ["id": "joint", "a": ["pieceId": "main", "socketId": "exit"],
                            "b": ["pieceId": "next", "socketId": "entrance"]]
        var raw = editingConsist(document()) {
            $0["intervals"] = [["edgeId": "main/forward", "from": 0.25, "to": 0.3],
                               ["edgeId": "next/forward", "from": 0.0, "to": 0.0695]]
        }
        var track: Object = ["revision": 3, "pieces": [piece("main", length: 0.3), piece("next", z: 0.3, length: 0.3)],
                             "turnouts": [], "connections": [join]]
        raw["track"] = track
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw))
        track["connections"] = []; raw["track"] = track
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "Intervals cannot jump between unjoined pieces.")
        track["connections"] = [join]
        var misaligned = piece("next", z: 0.3, length: 0.3)
        misaligned["pose"] = ["x": 0.00021, "y": 0.0, "z": 0.3, "yaw": 0.0]
        track["pieces"] = [piece("main", length: 0.3), misaligned]; raw["track"] = track
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "A join beyond 0.2 mm is invalid.")
        misaligned["pose"] = ["x": 0.0, "y": 0.0, "z": 0.3, "yaw": 0.005]
        track["pieces"] = [piece("main", length: 0.3), misaligned]; raw["track"] = track
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "Socket tangents must oppose within 0.25 degrees.")
        track["pieces"] = [piece("main", length: 0.3), piece("next", z: 0.3, length: 0.3)]
        var duplicate = join; duplicate["id"] = "joint-two"
        track["connections"] = [join, duplicate]; raw["track"] = track
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "Physical sockets cannot be joined twice.")
    }

    func testTurnoutSelectionMustMatchDocumentAndEntireRetainedRoute() throws {
        let straight: [Object] = [["turnoutId": "points", "route": "straight"]]
        let diverging: [Object] = [["turnoutId": "points", "route": "diverging"]]
        var raw = editingMotion(document()) { $0["speed"] = 0; $0["throttle"] = 0 }
        raw = editingConsist(raw) {
            $0["selections"] = straight
            $0["intervals"] = [["edgeId": "points:route:straight/forward", "from": 0, "to": 0.1195]]
        }
        raw["track"] = ["revision": 3, "pieces": [], "connections": [],
                        "turnouts": [["id": "points", "pose": ["x": 0, "y": 0, "z": 0, "yaw": 0],
                                      "straightLength": 0.15, "radius": 0.3, "sweep": Double.pi / 6]]]
        raw["selections"] = straight
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw))
        raw["selections"] = diverging
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        raw = editingConsist(raw) { $0["selections"] = diverging }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "A body cannot occupy the unselected virtual route.")
        raw = editingConsist(raw) { $0["intervals"] = [["edgeId": "points:route:diverging/forward", "from": 0, "to": 0.1195]] }
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw))
    }

    func testCatalogFootprintVehicleOrderAndIdentityAreAuthoritative() throws {
        var raw = document(), train = raw["train"] as! Object
        train["vehicles"] = [["id": "engine", "catalogId": "steam-01"],
                             ["id": "coach", "catalogId": "coach-01"],
                             ["id": "wagon", "catalogId": "wagon-01"]]
        raw["train"] = train
        raw = editingConsist(raw) {
            $0["length"] = 0.2845
            $0["intervals"] = [["edgeId": "main/forward", "from": 0.03, "to": 0.3145]]
        }
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw))
        let tooShort = editingConsist(raw) {
            $0["length"] = 0.1195
            $0["intervals"] = [["edgeId": "main/forward", "from": 0.03, "to": 0.1495]]
        }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(tooShort), "Matching interval length cannot conceal missing swept footprint.")
        let foreignID = editingConsist(raw) { $0["trainId"] = "foreign" }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(foreignID))
        train = raw["train"] as! Object
        train["vehicles"] = [["id": "same", "catalogId": "steam-01"], ["id": "same", "catalogId": "coach-01"]]
        raw["train"] = train
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        train["vehicles"] = [["id": "coach", "catalogId": "coach-01"]]; raw["train"] = train
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw), "The first vehicle must be the supported locomotive.")
    }

    func testUnsafeExactMotionIsNotAcceptedOnThePromiseOfAStoppedRestore() throws {
        var raw = editingConsist(document()) {
            $0["intervals"] = [["edgeId": "main/forward", "from": 0.3795, "to": 0.499]]
        }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        raw = editingMotion(raw) { $0["speed"] = 0; $0["throttle"] = 0 }
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw))
        let invalidEmergency = editingMotion(document()) { $0["emergency"] = true }
        XCTAssertThrowsError(try LayoutDesignDocument.decode(invalidEmergency))
    }

    func testUnsupportedVersionsRemainDistinctAndScalarBoundsAreStrict() throws {
        let unsupported: [(String, Any)] = [("schemaVersion", 3), ("catalogVersion", "future-kit"), ("boardId", "future-board")]
        for (key, value) in unsupported {
            var raw = document(); raw[key] = value
            XCTAssertThrowsError(try LayoutDesignDocument.decode(raw)) { error in
                XCTAssertEqual((error as? LayoutDesignDocument.ValidationError)?.isUnsupportedData, true)
            }
        }
        for invalid: Any in [-1, 4_294_967_296 as Int, 1.5, true] {
            var raw = document(); raw["seed"] = invalid
            XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        }
        var raw = document(); raw["name"] = String(repeating: "🚂", count: 80)
        XCTAssertNoThrow(try LayoutDesignDocument.decode(raw))
        raw["name"] = String(repeating: "🚂", count: 81)
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        raw["name"] = "Railway\u{0085}name"
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw))
        XCTAssertThrowsError(try LayoutDesignDocument.decode(Data(repeating: 32, count: LayoutDesignDocument.maximumBytes + 1)))
    }

    func testSharedTypeScriptAndSwiftConformanceCorpus() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "layout-design-v2-corpus", withExtension: "json"))
        let corpus = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? Object)
        XCTAssertEqual(corpus["format"] as? String, "tin-junction-design-conformance")
        XCTAssertEqual(corpus["schemaVersion"] as? Int, 1)
        let cases = try XCTUnwrap(corpus["cases"] as? [Object])
        XCTAssertFalse(cases.isEmpty)
        for fixture in cases {
            let id = try XCTUnwrap(fixture["id"] as? String)
            let expected = try XCTUnwrap(fixture["valid"] as? Bool)
            let input = try XCTUnwrap(fixture["input"])
            let data = try JSONSerialization.data(withJSONObject: input, options: [.fragmentsAllowed])
            do {
                let document = try LayoutDesignDocument.decode(data)
                XCTAssertTrue(expected, "Rejected corpus case was accepted: \(id)")
                XCTAssertEqual(try LayoutDesignDocument.decode(document.canonicalData()), document, id)
            } catch {
                XCTAssertFalse(expected, "Accepted corpus case was rejected: \(id): \(error)")
            }
        }
    }

    func testCanonicalOrderingPreservesPhysicalVehicleAndHistoryOrder() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "layout-design-v2-corpus", withExtension: "json"))
        let corpus = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? Object)
        let cases = try XCTUnwrap(corpus["cases"] as? [Object])
        let fixture = try XCTUnwrap(cases.first { $0["id"] as? String == "occupied-turnout" })
        var raw = try XCTUnwrap(fixture["input"] as? Object)
        raw["scenery"] = [["id": "z-fir", "kind": "fir", "x": 0, "z": 0, "rotation": 0, "scale": 1],
                          ["id": "a-fir", "kind": "fir", "x": 0.02, "z": 0, "rotation": 0, "scale": 1]]
        let expected = try LayoutDesignDocument.decode(raw)
        var track = try XCTUnwrap(raw["track"] as? Object)
        for key in ["pieces", "turnouts", "connections"] {
            track[key] = Array(try XCTUnwrap(track[key] as? [Object]).reversed())
        }
        raw["track"] = track
        raw["scenery"] = Array(try XCTUnwrap(raw["scenery"] as? [Object]).reversed())
        let reordered = try LayoutDesignDocument.decode(raw)
        XCTAssertEqual(try reordered.canonicalData(), try expected.canonicalData())
        let beforeTrain = try XCTUnwrap(raw["train"] as? Object)
        let afterTrain = try XCTUnwrap(reordered.bridgeObject()["train"] as? Object)
        XCTAssertEqual(NSArray(array: try XCTUnwrap(beforeTrain["vehicles"] as? [Object])),
                       NSArray(array: try XCTUnwrap(afterTrain["vehicles"] as? [Object])))
        let beforeMotion = try XCTUnwrap(beforeTrain["motion"] as? Object)
        let afterMotion = try XCTUnwrap(afterTrain["motion"] as? Object)
        let beforeConsist = try XCTUnwrap(beforeMotion["consist"] as? Object)
        let afterConsist = try XCTUnwrap(afterMotion["consist"] as? Object)
        XCTAssertEqual(NSArray(array: try XCTUnwrap(beforeConsist["intervals"] as? [Object])),
                       NSArray(array: try XCTUnwrap(afterConsist["intervals"] as? [Object])))
    }

    func testStructuralBudgetsRejectBeforeTypedDocumentTraversal() {
        var raw = document()
        raw["excess"] = Array(repeating: 0, count: 40_000)
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw)) { error in
            XCTAssertEqual(error as? LayoutDesignDocument.ValidationError, .tooLarge)
        }
        var nested: Any = 0
        for _ in 0..<33 { nested = [nested] }
        raw = document(); raw["deep"] = nested
        XCTAssertThrowsError(try LayoutDesignDocument.decode(raw)) { error in
            XCTAssertEqual(error as? LayoutDesignDocument.ValidationError, .tooLarge)
        }
    }
}
