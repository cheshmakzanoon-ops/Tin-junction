import Foundation

indirect enum BridgeJSON: Decodable, Equatable, Sendable {
    case null
    case boolean(Bool)
    case number(Double)
    case string(String)
    case array([BridgeJSON])
    case object([String: BridgeJSON])

    init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer()
        if value.decodeNil() { self = .null }
        else if let boolean = try? value.decode(Bool.self) { self = .boolean(boolean) }
        else if let number = try? value.decode(Double.self), number.isFinite { self = .number(number) }
        else if let string = try? value.decode(String.self) { self = .string(string) }
        else if let array = try? value.decode([BridgeJSON].self) { self = .array(array) }
        else { self = .object(try value.decode([String: BridgeJSON].self)) }
    }

    var string: String? {
        if case .string(let value) = self { return value }
        return nil
    }

    var integer: Int? {
        guard case .number(let value) = self, value.isFinite,
              value >= 0, value <= Double(LayoutDocument.maximumInteger), value.rounded() == value else { return nil }
        return Int(value)
    }

    var foundationValue: Any {
        switch self {
        case .null: return NSNull()
        case .boolean(let value): return value
        case .number(let value): return value
        case .string(let value): return value
        case .array(let values): return values.map(\.foundationValue)
        case .object(let values): return values.mapValues(\.foundationValue)
        }
    }
}

struct BridgeEnvelope: Decodable, Equatable, Sendable {
    static let maximumBytes = 65_536
    static let maximumCheckpointBytes = 524_288
    static let allowedTypes: Set<String> = ["web.ready", "engine.error", "engine.metrics", "layout.loaded", "layout.checkpoint"]

    let version: Int
    let id: String
    let type: String
    let payload: [String: BridgeJSON]

    enum Rejection: Error, Equatable {
        case invalidJSON, tooLarge, unexpectedFields, unsupportedVersion
        case invalidIdentifier, unsupportedType, invalidReadyPayload, invalidErrorPayload
        case invalidLayoutPayload
    }

    static func decode(_ body: Any) throws -> BridgeEnvelope {
        guard let object = body as? [String: Any], JSONSerialization.isValidJSONObject(object) else {
            throw Rejection.invalidJSON
        }
        guard Set(object.keys) == ["version", "id", "type", "payload"] else {
            throw Rejection.unexpectedFields
        }
        let data = try JSONSerialization.data(withJSONObject: object)
        let limit = object["type"] as? String == "layout.checkpoint" ? maximumCheckpointBytes : maximumBytes
        guard data.count <= limit else { throw Rejection.tooLarge }
        let envelope = try JSONDecoder().decode(BridgeEnvelope.self, from: data)
        guard envelope.version == 1 else { throw Rejection.unsupportedVersion }
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._:-")
        guard (1...128).contains(envelope.id.utf8.count),
              envelope.id.unicodeScalars.allSatisfy({ allowed.contains($0) }) else {
            throw Rejection.invalidIdentifier
        }
        guard allowedTypes.contains(envelope.type) else { throw Rejection.unsupportedType }
        if envelope.type == "web.ready" {
            guard [BridgeJSON.string("engineering-harness"), .string("first-railway")].contains(envelope.payload["build"] ?? .null),
                  envelope.payload["protocolVersion"] == .number(1),
                  envelope.payload["renderer"] == .string("webgl2") else {
                throw Rejection.invalidReadyPayload
            }
        }
        if envelope.type == "engine.error" {
            guard case .some(.string(let code)) = envelope.payload["code"],
                  (1...128).contains(code.utf8.count),
                  code.unicodeScalars.allSatisfy({ allowed.contains($0) }),
                  case .some(.boolean(_)) = envelope.payload["recoverable"] else {
                throw Rejection.invalidErrorPayload
            }
            if let message = envelope.payload["message"] {
                guard case .string(let text) = message, text.utf8.count <= 1_024 else {
                    throw Rejection.invalidErrorPayload
                }
            }
        }
        if envelope.type == "layout.loaded" {
            guard Set(envelope.payload.keys) == ["sessionId", "documentId", "revision"],
                  let sessionID = envelope.payload["sessionId"]?.string, LayoutDocument.isIdentifier(sessionID),
                  let documentID = envelope.payload["documentId"]?.string, LayoutDocument.isIdentifier(documentID),
                  envelope.payload["revision"]?.integer != nil else { throw Rejection.invalidLayoutPayload }
        }
        if envelope.type == "layout.checkpoint" {
            guard Set(envelope.payload.keys) == ["sessionId", "requestId", "expectedRevision", "checkpoint", "document"],
                  let sessionID = envelope.payload["sessionId"]?.string, LayoutDocument.isIdentifier(sessionID),
                  let requestID = envelope.payload["requestId"]?.string, LayoutDocument.isIdentifier(requestID),
                  envelope.payload["checkpoint"]?.integer != nil,
                  envelope.payload["expectedRevision"] == .null || envelope.payload["expectedRevision"]?.integer != nil,
                  case .some(.object(let document)) = envelope.payload["document"] else { throw Rejection.invalidLayoutPayload }
            _ = try LayoutDocument.decode(document.mapValues(\.foundationValue))
        }
        return envelope
    }
}
