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
}

struct BridgeEnvelope: Decodable, Equatable, Sendable {
    static let maximumBytes = 65_536
    static let allowedTypes: Set<String> = ["web.ready", "engine.error", "engine.metrics"]

    let version: Int
    let id: String
    let type: String
    let payload: [String: BridgeJSON]

    enum Rejection: Error, Equatable {
        case invalidJSON, tooLarge, unexpectedFields, unsupportedVersion
        case invalidIdentifier, unsupportedType, invalidReadyPayload, invalidErrorPayload
    }

    static func decode(_ body: Any) throws -> BridgeEnvelope {
        guard let object = body as? [String: Any], JSONSerialization.isValidJSONObject(object) else {
            throw Rejection.invalidJSON
        }
        guard Set(object.keys) == ["version", "id", "type", "payload"] else {
            throw Rejection.unexpectedFields
        }
        let data = try JSONSerialization.data(withJSONObject: object)
        guard data.count <= maximumBytes else { throw Rejection.tooLarge }
        let envelope = try JSONDecoder().decode(BridgeEnvelope.self, from: data)
        guard envelope.version == 1 else { throw Rejection.unsupportedVersion }
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._:-")
        guard (1...128).contains(envelope.id.utf8.count),
              envelope.id.unicodeScalars.allSatisfy({ allowed.contains($0) }) else {
            throw Rejection.invalidIdentifier
        }
        guard allowedTypes.contains(envelope.type) else { throw Rejection.unsupportedType }
        if envelope.type == "web.ready" {
            guard envelope.payload["build"] == .string("engineering-harness"),
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
        return envelope
    }
}
