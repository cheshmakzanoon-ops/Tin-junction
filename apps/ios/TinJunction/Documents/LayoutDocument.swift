import Foundation

/// The deliberately bounded first-loop document from ADR-0006. Render objects,
/// filenames and executable content never cross this boundary.
struct LayoutDocument: Codable, Equatable, Sendable {
    struct Track: Codable, Equatable, Sendable {
        var kind: String
        var straightLength: Double
        var radius: Double

        var length: Double { 2 * straightLength + 2 * .pi * radius }
        func distanceToRail(x: Double, z: Double) -> Double {
            abs(hypot(max(abs(x) - straightLength / 2, 0), z) - radius)
        }
    }

    struct Train: Codable, Equatable, Sendable {
        var distance: Double
        var speed: Double
        var throttle: Double
        var direction: Int
        var wheelTravel: Double
    }

    struct Scenery: Codable, Equatable, Sendable {
        var id: String
        var kind: String
        var x: Double
        var z: Double
        var rotation: Double
        var scale: Double

        static let footprints: [String: Double] = [
            "fir": 0.010, "oak": 0.018, "house": 0.028,
            "lamp": 0.004, "bench": 0.012, "rock": 0.014
        ]
    }

    struct Environment: Codable, Equatable, Sendable { var timeOfDay: String }

    static let maximumBytes = 524_288
    static let maximumInteger = 9_000_000_000_000_000
    var format: String
    var schemaVersion: Int
    var documentId: String
    var revision: Int
    var name: String
    var seed: UInt32
    var track: Track
    var train: Train
    var scenery: [Scenery]
    var environment: Environment
    var tick: Int

    enum ValidationError: Error, Equatable {
        case invalidJSON, tooLarge, unexpectedFields, unsupportedVersion
        case invalidIdentity, invalidTrack, invalidTrain, invalidScenery, invalidEnvironment
    }

    static func isIdentifier(_ value: String) -> Bool {
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._:-")
        return (1...128).contains(value.utf8.count)
            && value.unicodeScalars.allSatisfy { allowed.contains($0) }
    }

    static func decode(_ data: Data) throws -> LayoutDocument {
        guard data.count <= maximumBytes else { throw ValidationError.tooLarge }
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ValidationError.invalidJSON
        }
        try validateKeys(object)
        let document = try JSONDecoder().decode(LayoutDocument.self, from: data)
        try document.validate()
        return document
    }

    static func decode(_ object: [String: Any]) throws -> LayoutDocument {
        guard JSONSerialization.isValidJSONObject(object) else { throw ValidationError.invalidJSON }
        return try decode(JSONSerialization.data(withJSONObject: object))
    }

    private static func validateKeys(_ object: [String: Any]) throws {
        guard Set(object.keys) == ["format", "schemaVersion", "documentId", "revision", "name", "seed", "track", "train", "scenery", "environment", "tick"],
              let track = object["track"] as? [String: Any],
              Set(track.keys) == ["kind", "straightLength", "radius"],
              let train = object["train"] as? [String: Any],
              Set(train.keys) == ["distance", "speed", "throttle", "direction", "wheelTravel"],
              let environment = object["environment"] as? [String: Any],
              Set(environment.keys) == ["timeOfDay"],
              let scenery = object["scenery"] as? [[String: Any]], scenery.count <= 128,
              scenery.allSatisfy({ Set($0.keys) == ["id", "kind", "x", "z", "rotation", "scale"] }) else {
            throw ValidationError.unexpectedFields
        }
    }

    func validate() throws {
        guard format == "tin-junction-layout", schemaVersion == 1 else { throw ValidationError.unsupportedVersion }
        let trimCharacters = CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: "\u{feff}"))
        guard Self.isIdentifier(documentId), (0...Self.maximumInteger).contains(revision),
              (0...Self.maximumInteger).contains(tick), (1...80).contains(name.unicodeScalars.count),
              !name.trimmingCharacters(in: trimCharacters).isEmpty,
              name.unicodeScalars.allSatisfy({ $0.value >= 32 && !((127...159).contains($0.value)) }) else {
            throw ValidationError.invalidIdentity
        }
        let epsilon = 0.000_000_000_1
        guard track.kind == "oval", track.straightLength.isFinite, track.radius.isFinite,
              (0.1...0.5).contains(track.straightLength), (0.10...0.2).contains(track.radius),
              track.straightLength + 2 * track.radius <= 0.76 + epsilon,
              2 * track.radius <= 0.44 + epsilon else { throw ValidationError.invalidTrack }
        guard [train.distance, train.speed, train.throttle, train.wheelTravel].allSatisfy(\.isFinite),
              train.distance >= 0, train.distance < track.length,
              (0...0.18).contains(train.speed), (0...1).contains(train.throttle),
              train.direction == 1 || train.direction == -1,
              abs(train.wheelTravel) <= 1_000_000_000 else { throw ValidationError.invalidTrain }
        guard scenery.count <= 128, Set(scenery.map(\.id)).count == scenery.count else {
            throw ValidationError.invalidScenery
        }
        for item in scenery {
            guard Self.isIdentifier(item.id), let baseFootprint = Scenery.footprints[item.kind],
                  [item.x, item.z, item.rotation, item.scale].allSatisfy(\.isFinite),
                  abs(item.x) <= 0.4, abs(item.z) <= 0.25,
                  (-2 * .pi...2 * .pi).contains(item.rotation), (0.5...2).contains(item.scale) else {
                throw ValidationError.invalidScenery
            }
            let footprint = baseFootprint * item.scale
            guard abs(item.x) + footprint <= 0.39 + epsilon,
                  abs(item.z) + footprint <= 0.24 + epsilon,
                  track.distanceToRail(x: item.x, z: item.z) + epsilon >= footprint + 0.018 else {
                throw ValidationError.invalidScenery
            }
            // The station and pond are fixed first-loop fixtures. Match the
            // model's collision shapes, independently of rendered triangles.
            for rectangle in [(-0.112, 0.112, -0.138, -0.055), (0.155, 0.255, 0.030, 0.100)] {
                let dx = max(max(rectangle.0 - item.x, 0), item.x - rectangle.1)
                let dz = max(max(rectangle.2 - item.z, 0), item.z - rectangle.3)
                guard hypot(dx, dz) + epsilon >= footprint else { throw ValidationError.invalidScenery }
            }
        }
        guard ["day", "dusk", "night"].contains(environment.timeOfDay) else {
            throw ValidationError.invalidEnvironment
        }
    }

    func canonicalData() throws -> Data {
        try validate()
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        let data = try encoder.encode(self)
        guard data.count <= Self.maximumBytes else { throw ValidationError.tooLarge }
        return data
    }

    func bridgeObject() throws -> [String: Any] {
        guard let value = try JSONSerialization.jsonObject(with: canonicalData()) as? [String: Any] else {
            throw ValidationError.invalidJSON
        }
        return value
    }

    func stoppedForRestore() -> LayoutDocument {
        var restored = self
        restored.train.speed = 0
        restored.train.throttle = 0
        return restored
    }
}
