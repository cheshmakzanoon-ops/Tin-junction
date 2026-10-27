import Foundation

/// Detached schema-v2 design boundary. The live schema-v1 document and store
/// remain unchanged. This validates authored joins and retained motion, while
/// board/track operating clearance still needs its separate certification.
struct LayoutDesignDocument: Equatable, Sendable {
    static let maximumBytes = 524_288
    static let catalogVersion = "tin-junction-layout-kit-v1"
    static let vehicleCatalogVersion = "tin-junction-vehicles-v1"

    enum ValidationError: Error, Equatable {
        case invalidJSON, tooLarge, unsupportedVersion, unsupportedCatalog
        case unexpectedFields, invalidIdentity, invalidTopology, invalidSelections
        case invalidTrain, invalidMotion, invalidScenery, invalidEnvironment

        /// A newer catalog/version must be retained for a compatible reader.
        var isUnsupportedData: Bool {
            self == .unsupportedVersion || self == .unsupportedCatalog
        }
    }

    private typealias Object = [String: BridgeJSON]
    private let payload: Object
    var documentId: String { payload["documentId"]!.string! }
    var name: String { payload["name"]!.string! }
    var revision: Int { payload["revision"]!.integer! }

    private init(payload: Object) { self.payload = payload }

    static func decode(_ data: Data) throws -> LayoutDesignDocument {
        guard data.count <= maximumBytes else { throw ValidationError.tooLarge }
        try validateJSONBudget(data)
        let value: BridgeJSON
        do { value = try JSONDecoder().decode(BridgeJSON.self, from: data) }
        catch { throw ValidationError.invalidJSON }
        guard case .object(let object) = value else { throw ValidationError.invalidJSON }
        try validate(object)
        return LayoutDesignDocument(payload: normalized(object))
    }

    static func decode(_ object: [String: Any]) throws -> LayoutDesignDocument {
        guard JSONSerialization.isValidJSONObject(object) else { throw ValidationError.invalidJSON }
        return try decode(JSONSerialization.data(withJSONObject: object))
    }

    func canonicalData() throws -> Data {
        let data = try JSONSerialization.data(withJSONObject: payload.mapValues(\.foundationValue),
                                               options: [.sortedKeys, .withoutEscapingSlashes])
        guard data.count <= Self.maximumBytes else { throw ValidationError.tooLarge }
        return data
    }

    func bridgeObject() -> [String: Any] { payload.mapValues(\.foundationValue) }

    private static let safeInteger = Double(LayoutDocument.maximumInteger)
    private static let contactTolerance = 1e-10
    private static let lengthTolerance = 1e-9

    /// Count the same root/property/array values as the web boundary before
    /// recursively decoding the typed JSON tree. Object keys are not values.
    private static func validateJSONBudget(_ data: Data) throws {
        let root: Any
        do { root = try JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]) }
        catch { throw ValidationError.invalidJSON }
        var stack: [(Any, Int)] = [(root, 0)], count = 0
        while let (value, depth) = stack.popLast() {
            count += 1
            guard count <= 40_000, depth <= 32 else { throw ValidationError.tooLarge }
            if let object = value as? [String: Any] {
                for child in object.values { stack.append((child, depth + 1)) }
            } else if let array = value as? [Any] {
                for child in array { stack.append((child, depth + 1)) }
            }
        }
    }

    /// Sort only unordered identity collections. Vehicle and retained interval
    /// order are physical state and must remain exactly as supplied.
    private static func normalized(_ source: Object) -> Object {
        func sorted(_ value: BridgeJSON?, by key: String) -> BridgeJSON {
            guard case .some(.array(let items)) = value else { return .array([]) }
            return .array(items.sorted { a, b in
                guard case .object(let left) = a, case .object(let right) = b else { return false }
                return (left[key]?.string ?? "") < (right[key]?.string ?? "")
            })
        }
        var result = source
        if case .some(.object(var track)) = result["track"] {
            for key in ["pieces", "turnouts", "connections"] { track[key] = sorted(track[key], by: "id") }
            result["track"] = .object(track)
        }
        result["selections"] = sorted(result["selections"], by: "turnoutId")
        result["scenery"] = sorted(result["scenery"], by: "id")
        if case .some(.object(var train)) = result["train"],
           case .some(.object(var motion)) = train["motion"],
           case .some(.object(var consist)) = motion["consist"] {
            consist["selections"] = sorted(consist["selections"], by: "turnoutId")
            motion["consist"] = .object(consist); train["motion"] = .object(motion); result["train"] = .object(train)
        }
        return result
    }

    private static func object(_ value: BridgeJSON?, keys: Set<String>, error: ValidationError) throws -> Object {
        guard case .some(.object(let result)) = value, Set(result.keys) == keys else { throw error }
        return result
    }

    private static func array(_ value: BridgeJSON?, maximum: Int, minimum: Int = 0,
                              error: ValidationError) throws -> [BridgeJSON] {
        guard case .some(.array(let result)) = value, result.count >= minimum,
              result.count <= maximum else { throw error }
        return result
    }

    private static func string(_ value: BridgeJSON?, error: ValidationError) throws -> String {
        guard case .some(.string(let result)) = value else { throw error }
        return result
    }

    private static func identifier(_ value: BridgeJSON?, maximum: Int = 128,
                                   error: ValidationError) throws -> String {
        let result = try string(value, error: error)
        guard LayoutDocument.isIdentifier(result), result.utf8.count <= maximum else { throw error }
        return result
    }

    private static func number(_ value: BridgeJSON?, minimum: Double, maximum: Double,
                               integral: Bool = false, error: ValidationError) throws -> Double {
        guard case .some(.number(let result)) = value, result.isFinite,
              result >= minimum, result <= maximum,
              !integral || result.rounded() == result else { throw error }
        return result
    }

    private static func boolean(_ value: BridgeJSON?, error: ValidationError) throws -> Bool {
        guard case .some(.boolean(let result)) = value else { throw error }
        return result
    }

    private static func validate(_ document: Object) throws {
        guard document["format"] == .string("tin-junction-layout"),
              document["schemaVersion"] == .number(2) else { throw ValidationError.unsupportedVersion }
        guard Set(document.keys) == ["format", "schemaVersion", "documentId", "revision", "name", "seed",
                                     "catalogVersion", "boardId", "track", "selections", "train", "scenery", "environment"] else {
            throw ValidationError.unexpectedFields
        }
        guard document["catalogVersion"] == .string(catalogVersion),
              document["boardId"] == .string("workbench.case") else { throw ValidationError.unsupportedCatalog }
        _ = try identifier(document["documentId"], error: .invalidIdentity)
        _ = try number(document["revision"], minimum: 0, maximum: Double(LayoutDocument.maximumInteger), integral: true, error: .invalidIdentity)
        _ = try number(document["seed"], minimum: 0, maximum: Double(UInt32.max), integral: true, error: .invalidIdentity)
        let name = try string(document["name"], error: .invalidIdentity)
        let trim = CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: "\u{feff}"))
        guard (1...80).contains(name.unicodeScalars.count), !name.trimmingCharacters(in: trim).isEmpty,
              name.unicodeScalars.allSatisfy({ $0.value >= 32 && !((127...159).contains($0.value)) }) else {
            throw ValidationError.invalidIdentity
        }
        let network = try compileTopology(document["track"], selections: document["selections"])
        if document["train"] != .null { try validateTrain(document["train"], topology: network) }
        try validateScenery(document["scenery"])
        let environment = try object(document["environment"], keys: ["timeOfDay"], error: .invalidEnvironment)
        guard [BridgeJSON.string("day"), .string("dusk"), .string("night")].contains(environment["timeOfDay"] ?? .null) else {
            throw ValidationError.invalidEnvironment
        }
    }

    private struct Pose {
        let x: Double, y: Double, z: Double, yaw: Double
    }
    private struct Piece {
        let id: String, pose: Pose, length: Double, curvature: Double
        let turnoutID: String?, route: String?

        func socket(_ name: String) -> Connector {
            let distance = name == "entrance" ? 0 : length
            let angle = curvature * distance
            let halfSine = sin(angle / 2)
            let localX = curvature == 0 ? 0 : 2 * halfSine * halfSine / curvature
            let localZ = curvature == 0 ? distance : sin(angle) / curvature
            let c = cos(pose.yaw), s = sin(pose.yaw), heading = pose.yaw + angle
            let sign = name == "entrance" ? -1.0 : 1.0
            return Connector(x: pose.x + c * localX + s * localZ, y: pose.y,
                             z: pose.z - s * localX + c * localZ,
                             outwardX: sin(heading) * sign, outwardZ: cos(heading) * sign)
        }
    }
    private struct Connector {
        let x: Double, y: Double, z: Double, outwardX: Double, outwardZ: Double
    }
    private struct Socket: Hashable {
        let pieceID: String, socketID: String
    }
    private struct Edge {
        let id: String, piece: Piece, direction: Int, next: String?
    }
    private struct Topology {
        let revision: Double, selections: [String: String], edges: [String: Edge]
    }
    private struct Interval {
        let edge: Edge, from: Double, to: Double
    }

    private static func pose(_ value: BridgeJSON?) throws -> Pose {
        let o = try object(value, keys: ["x", "y", "z", "yaw"], error: .invalidTopology)
        return try Pose(
            x: number(o["x"], minimum: -100, maximum: 100, error: .invalidTopology),
            y: number(o["y"], minimum: -100, maximum: 100, error: .invalidTopology),
            z: number(o["z"], minimum: -100, maximum: 100, error: .invalidTopology),
            yaw: number(o["yaw"], minimum: -2 * .pi, maximum: 2 * .pi, error: .invalidTopology))
    }

    private static func straightLength(_ value: BridgeJSON?) throws -> Double {
        try number(value, minimum: 0.001, maximum: 2, error: .invalidTopology)
    }

    private static func arc(_ radiusValue: BridgeJSON?, _ sweepValue: BridgeJSON?, maximumSweep: Double) throws -> (Double, Double) {
        let radius = try number(radiusValue, minimum: 0.1, maximum: 1, error: .invalidTopology)
        let sweep = try number(sweepValue, minimum: -maximumSweep, maximum: maximumSweep, error: .invalidTopology)
        let length = radius * abs(sweep)
        guard length >= 0.001, length <= 2 * .pi else { throw ValidationError.invalidTopology }
        return (length, (sweep < 0 ? -1 : 1) / radius)
    }

    private static func selections(_ value: BridgeJSON?, turnoutIDs: Set<String>) throws -> [String: String] {
        let values = try array(value, maximum: 64, error: .invalidSelections)
        guard values.count == turnoutIDs.count else { throw ValidationError.invalidSelections }
        var result: [String: String] = [:]
        for value in values {
            let o = try object(value, keys: ["turnoutId", "route"], error: .invalidSelections)
            let id = try identifier(o["turnoutId"], error: .invalidSelections)
            let route = try string(o["route"], error: .invalidSelections)
            guard turnoutIDs.contains(id), result[id] == nil, ["straight", "diverging"].contains(route) else {
                throw ValidationError.invalidSelections
            }
            result[id] = route
        }
        return result
    }

    private static func compileTopology(_ value: BridgeJSON?, selections selectionValue: BridgeJSON?) throws -> Topology {
        let o = try object(value, keys: ["revision", "pieces", "turnouts", "connections"], error: .invalidTopology)
        let revision = try number(o["revision"], minimum: 0, maximum: safeInteger, integral: true, error: .invalidTopology)
        let ordinary = try array(o["pieces"], maximum: 500, error: .invalidTopology)
        let turnouts = try array(o["turnouts"], maximum: 64, error: .invalidTopology)
        let connections = try array(o["connections"], maximum: 500, error: .invalidTopology)
        guard ordinary.count + turnouts.count * 2 <= 500 else { throw ValidationError.invalidTopology }
        var pieces: [String: Piece] = [:], allIDs: Set<String> = [], ordinaryIDs: Set<String> = [], turnoutIDs: Set<String> = []
        for value in ordinary {
            let item = try object(value, keys: ["id", "centerline", "pose", "gauge", "profile"], error: .invalidTopology)
            let id = try identifier(item["id"], error: .invalidTopology)
            guard allIDs.insert(id).inserted, item["gauge"] == .number(0.0165),
                  item["profile"] == .string("tin-ho-profile-v1") else { throw ValidationError.invalidTopology }
            ordinaryIDs.insert(id)
            guard case .some(.object(let shape)) = item["centerline"] else { throw ValidationError.invalidTopology }
            let dimensions: (length: Double, curvature: Double)
            if shape["kind"] == .string("straight") {
                guard Set(shape.keys) == ["kind", "length"] else { throw ValidationError.invalidTopology }
                dimensions = (try straightLength(shape["length"]), 0)
            } else if shape["kind"] == .string("arc") {
                guard Set(shape.keys) == ["kind", "radius", "sweep"] else { throw ValidationError.invalidTopology }
                dimensions = try arc(shape["radius"], shape["sweep"], maximumSweep: 2 * .pi)
            } else { throw ValidationError.invalidTopology }
            pieces[id] = try Piece(id: id, pose: pose(item["pose"]), length: dimensions.length,
                                   curvature: dimensions.curvature, turnoutID: nil, route: nil)
        }
        for value in turnouts {
            let item = try object(value, keys: ["id", "pose", "straightLength", "radius", "sweep"], error: .invalidTopology)
            let id = try identifier(item["id"], maximum: 100, error: .invalidTopology)
            guard allIDs.insert(id).inserted else { throw ValidationError.invalidTopology }
            turnoutIDs.insert(id)
            let placement = try pose(item["pose"])
            let length = try straightLength(item["straightLength"])
            let (arcLength, curvature) = try arc(item["radius"], item["sweep"], maximumSweep: .pi / 2)
            for route in ["straight", "diverging"] {
                let pieceID = id + ":route:" + route
                guard allIDs.insert(pieceID).inserted else { throw ValidationError.invalidTopology }
                pieces[pieceID] = Piece(id: pieceID, pose: placement,
                                       length: route == "straight" ? length : arcLength,
                                       curvature: route == "straight" ? 0 : curvature,
                                       turnoutID: id, route: route)
            }
        }
        let selected = try selections(selectionValue, turnoutIDs: turnoutIDs)
        var connectionIDs: Set<String> = [], physicalSockets: Set<Socket> = [], joined: [Socket: Socket] = [:]
        func endpoint(_ value: BridgeJSON?) throws -> Socket {
            let item = try object(value, keys: ["pieceId", "socketId"], error: .invalidTopology)
            let id = try identifier(item["pieceId"], error: .invalidTopology)
            let name = try string(item["socketId"], error: .invalidTopology)
            let allowed = turnoutIDs.contains(id) ? ["stock", "straight", "diverging"] : ordinaryIDs.contains(id) ? ["entrance", "exit"] : []
            guard allowed.contains(name) else { throw ValidationError.invalidTopology }
            return Socket(pieceID: id, socketID: name)
        }
        func mapped(_ socket: Socket) -> Socket {
            guard let route = selected[socket.pieceID] else { return socket }
            return Socket(pieceID: socket.pieceID + ":route:" + (socket.socketID == "stock" ? route : socket.socketID),
                          socketID: socket.socketID == "stock" ? "entrance" : "exit")
        }
        for value in connections {
            let item = try object(value, keys: ["id", "a", "b"], error: .invalidTopology)
            let id = try identifier(item["id"], error: .invalidTopology)
            let a = try endpoint(item["a"]), b = try endpoint(item["b"])
            guard connectionIDs.insert(id).inserted, a.pieceID != b.pieceID,
                  physicalSockets.insert(a).inserted, physicalSockets.insert(b).inserted else { throw ValidationError.invalidTopology }
            let ma = mapped(a), mb = mapped(b)
            guard let pa = pieces[ma.pieceID], let pb = pieces[mb.pieceID] else { throw ValidationError.invalidTopology }
            let ca = pa.socket(ma.socketID), cb = pb.socket(mb.socketID)
            let gap = hypot(hypot(ca.x - cb.x, ca.y - cb.y), ca.z - cb.z)
            let opposition = ca.outwardX * cb.outwardX + ca.outwardZ * cb.outwardZ
            guard gap <= 0.0002, opposition <= -cos(.pi / 720), joined[ma] == nil, joined[mb] == nil else {
                throw ValidationError.invalidTopology
            }
            joined[ma] = mb; joined[mb] = ma
        }
        var edges: [String: Edge] = [:]
        for piece in pieces.values {
            for direction in [1, -1] {
                let id = piece.id + (direction == 1 ? "/forward" : "/reverse")
                let exit = Socket(pieceID: piece.id, socketID: direction == 1 ? "exit" : "entrance")
                let next = joined[exit].map { $0.pieceID + ($0.socketID == "entrance" ? "/forward" : "/reverse") }
                edges[id] = Edge(id: id, piece: piece, direction: direction, next: next)
            }
        }
        return Topology(revision: revision, selections: selected, edges: edges)
    }

    private static func validateTrain(_ value: BridgeJSON?, topology: Topology) throws {
        let train = try object(value, keys: ["id", "catalogVersion", "vehicles", "motion"], error: .invalidTrain)
        let id = try identifier(train["id"], error: .invalidTrain)
        guard train["catalogVersion"] == .string(vehicleCatalogVersion) else { throw ValidationError.unsupportedCatalog }
        let vehicles = try array(train["vehicles"], maximum: 8, minimum: 1, error: .invalidTrain)
        var ids: Set<String> = [], bodyMicrometres = 0
        for (index, value) in vehicles.enumerated() {
            let item = try object(value, keys: ["id", "catalogId"], error: .invalidTrain)
            let vehicleID = try identifier(item["id"], error: .invalidTrain)
            let catalogID = try string(item["catalogId"], error: .invalidTrain)
            guard ["steam-01", "coach-01", "wagon-01"].contains(catalogID) else { throw ValidationError.unsupportedCatalog }
            let canonicalOrder = index == 0 ? catalogID == "steam-01" : catalogID != "steam-01"
            guard ids.insert(vehicleID).inserted, canonicalOrder else { throw ValidationError.invalidTrain }
            bodyMicrometres += (catalogID == "steam-01" ? 74_000 : 46_000) + 3_000
        }
        // Catalog v1's conservative routed footprint, including solver stretch,
        // couplers, gaps and 2 mm swept clearance at both ends. Integer first.
        let footprintMicrometres = 3 * (bodyMicrometres + 6_000 * (vehicles.count - 1)) / 2 + 4_000
        let length = Double(footprintMicrometres) / 1_000_000
        try validateMotion(train["motion"], trainID: id, expectedLength: length, topology: topology)
    }

    private static func validateMotion(_ value: BridgeJSON?, trainID: String, expectedLength: Double, topology: Topology) throws {
        let motion = try object(value, keys: ["format", "schemaVersion", "profile", "consist", "tick", "speed", "throttle", "signedTravel", "emergency"], error: .invalidMotion)
        guard motion["format"] == .string("tin-junction-routed-motion"), motion["schemaVersion"] == .number(1) else { throw ValidationError.invalidMotion }
        _ = try number(motion["tick"], minimum: 0, maximum: Double(LayoutDocument.maximumInteger), integral: true, error: .invalidMotion)
        _ = try number(motion["signedTravel"], minimum: -1e9, maximum: 1e9, error: .invalidMotion)
        let throttle = try number(motion["throttle"], minimum: 0, maximum: 1, error: .invalidMotion)
        let emergency = try boolean(motion["emergency"], error: .invalidMotion)
        guard !emergency || throttle == 0 else { throw ValidationError.invalidMotion }
        let profile = try object(motion["profile"], keys: ["maxSpeed", "acceleration", "brakeDeceleration", "emergencyDeceleration", "endClearance"], error: .invalidMotion)
        let maxSpeed = try number(profile["maxSpeed"], minimum: 0.001, maximum: 0.18, error: .invalidMotion)
        _ = try number(profile["acceleration"], minimum: 0.01, maximum: 1, error: .invalidMotion)
        let brake = try number(profile["brakeDeceleration"], minimum: 0.02, maximum: 1, error: .invalidMotion)
        let emergencyBrake = try number(profile["emergencyDeceleration"], minimum: brake, maximum: 2, error: .invalidMotion)
        let endClearance = try number(profile["endClearance"], minimum: 0.0002, maximum: 0.02, error: .invalidMotion)
        let horizon = maxSpeed * maxSpeed / (2 * brake) + maxSpeed * (1.0 / 60.0) + endClearance
        guard horizon <= 0.99 else { throw ValidationError.invalidMotion }
        let speed = try number(motion["speed"], minimum: 0, maximum: maxSpeed, error: .invalidMotion)
        let consist = try object(motion["consist"], keys: ["format", "schemaVersion", "topologyRevision", "switchRevision", "selections", "trainId", "length", "direction", "intervals"], error: .invalidMotion)
        guard consist["format"] == .string("tin-junction-routed-consist"), consist["schemaVersion"] == .number(1),
              consist["topologyRevision"] == .number(topology.revision), consist["trainId"] == .string(trainID) else { throw ValidationError.invalidMotion }
        _ = try number(consist["switchRevision"], minimum: 0, maximum: safeInteger, integral: true, error: .invalidMotion)
        let selected = try selections(consist["selections"], turnoutIDs: Set(topology.selections.keys))
        guard selected == topology.selections else { throw ValidationError.invalidMotion }
        let length = try number(consist["length"], minimum: 0.001, maximum: 1, error: .invalidMotion)
        guard abs(length - expectedLength) <= lengthTolerance,
              consist["direction"] == .number(1) || consist["direction"] == .number(-1) else { throw ValidationError.invalidMotion }
        let values = try array(consist["intervals"], maximum: 2048, minimum: 1, error: .invalidMotion)
        var intervals: [Interval] = [], occupied: [String: [(Double, Double)]] = [:], turnoutRoutes: [String: String] = [:]
        var measured = 0.0
        for value in values {
            let item = try object(value, keys: ["edgeId", "from", "to"], error: .invalidMotion)
            let id = try string(item["edgeId"], error: .invalidMotion)
            guard let edge = topology.edges[id] else { throw ValidationError.invalidMotion }
            let from = try number(item["from"], minimum: 0, maximum: edge.piece.length, error: .invalidMotion)
            let to = try number(item["to"], minimum: 0, maximum: edge.piece.length, error: .invalidMotion)
            guard from < to else { throw ValidationError.invalidMotion }
            if let previous = intervals.last {
                guard previous.edge.next == id, abs(previous.to - previous.edge.piece.length) <= contactTolerance,
                      from == 0 else { throw ValidationError.invalidMotion }
            }
            let canonical = edge.direction == 1 ? (from, to) : (edge.piece.length - to, edge.piece.length - from)
            let existing = occupied[edge.piece.id] ?? []
            guard !existing.contains(where: { min($0.1, canonical.1) - max($0.0, canonical.0) > contactTolerance }) else {
                throw ValidationError.invalidMotion
            }
            occupied[edge.piece.id, default: []].append(canonical)
            if let owner = edge.piece.turnoutID {
                guard topology.selections[owner] == edge.piece.route,
                      turnoutRoutes[owner] == nil || turnoutRoutes[owner] == edge.piece.id else { throw ValidationError.invalidMotion }
                turnoutRoutes[owner] = edge.piece.id
            }
            measured += to - from
            intervals.append(Interval(edge: edge, from: from, to: to))
        }
        guard abs(measured - length) <= lengthTolerance else { throw ValidationError.invalidMotion }
        let first = intervals[0], last = intervals[intervals.count - 1]
        if intervals.count > 1 {
            let sameEdgeContact = first.edge.id == last.edge.id && abs(first.from - last.to) <= contactTolerance
            let jointContact = first.from <= contactTolerance && abs(last.to - last.edge.piece.length) <= contactTolerance && last.edge.next == first.edge.id
            guard !sameEdgeContact, !jointContact else { throw ValidationError.invalidMotion }
        }
        let available = try clearance(from: last, horizon: horizon + 0.000001, topology: topology)
        let deceleration = emergency ? emergencyBrake : brake
        guard !available.blocked || speed * speed / (2 * deceleration) <= max(0, available.distance - endClearance) + contactTolerance else {
            throw ValidationError.invalidMotion
        }
    }

    private static func clearance(from front: Interval, horizon: Double, topology: Topology) throws -> (distance: Double, blocked: Bool) {
        var edge = front.edge, offset = front.to, distance = 0.0, transitions = 0
        while true {
            let available = edge.piece.length - offset
            if distance + available > horizon { return (horizon, false) }
            distance += available
            guard let nextID = edge.next, let next = topology.edges[nextID] else { return (distance, true) }
            if let owner = next.piece.turnoutID, topology.selections[owner] != next.piece.route { return (distance, true) }
            if distance >= horizon { return (horizon, false) }
            edge = next; offset = 0; transitions += 1
            guard transitions <= 2048 else { throw ValidationError.invalidMotion }
        }
    }

    private static func validateScenery(_ value: BridgeJSON?) throws {
        let values = try array(value, maximum: 128, error: .invalidScenery)
        var ids: Set<String> = []
        for value in values {
            let item = try object(value, keys: ["id", "kind", "x", "z", "rotation", "scale"], error: .invalidScenery)
            let id = try identifier(item["id"], error: .invalidScenery)
            let kind = try string(item["kind"], error: .invalidScenery)
            guard ids.insert(id).inserted, let radius = LayoutDocument.Scenery.footprints[kind] else { throw ValidationError.invalidScenery }
            let x = try number(item["x"], minimum: -0.4, maximum: 0.4, error: .invalidScenery)
            let z = try number(item["z"], minimum: -0.25, maximum: 0.25, error: .invalidScenery)
            _ = try number(item["rotation"], minimum: -2 * .pi, maximum: 2 * .pi, error: .invalidScenery)
            let scale = try number(item["scale"], minimum: 0.5, maximum: 2, error: .invalidScenery)
            guard abs(x) + radius * scale <= 0.39 + contactTolerance,
                  abs(z) + radius * scale <= 0.24 + contactTolerance else { throw ValidationError.invalidScenery }
        }
    }
}
