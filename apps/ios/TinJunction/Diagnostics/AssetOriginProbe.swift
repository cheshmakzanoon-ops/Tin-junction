#if DEBUG
import Foundation

/// Explicit development instrumentation. It never changes production loading
/// policy, a user's layout, or the application renderer.
enum AssetOriginProbe {
    static let launchArgument = "--asset-origin-probe"
    static let networkRuleIdentifier = "TinJunctionAssetOriginProbe.DenyHTTP.v1"
    static let networkRules = #"[{"trigger":{"url-filter":"^https?://"},"action":{"type":"block"}}]"#
    static let names: Set<String> = ["glb", "texture", "worker", "wasm", "ktx2", "audio"]

    static func isRequested(arguments: [String]) -> Bool { arguments.contains(launchArgument) }

    static func isValid(_ payload: [String: BridgeJSON]) -> Bool {
        guard Set(payload.keys) == ["formatVersion", "sessionId", "documentURL", "stage", "webgl2", "results", "observed"],
              payload["formatVersion"] == .number(1),
              let session = payload["sessionId"]?.string, LayoutDocument.isIdentifier(session),
              payload["documentURL"] == .string(BundleResourcePolicy.entryURL.absoluteString),
              let stage = payload["stage"]?.string, ["running", "ready", "complete"].contains(stage),
              case .some(.boolean(_)) = payload["webgl2"],
              case .some(.object(let results)) = payload["results"], Set(results.keys) == names,
              case .some(.object(let observed)) = payload["observed"],
              Set(observed.keys) == ["meshCount", "triangleCount", "textureWidth", "textureHeight", "glbVisiblePixels", "textureMatchedQuadrants",
                                     "audioSampleRate", "audioFrames", "audioChannels", "audioState", "wasmValue", "workerMessage"] else { return false }
        var states: [String: String] = [:]
        for (name, value) in results {
            guard case .object(let result) = value, Set(result.keys) == ["status", "detail"],
                  let status = result["status"]?.string, ["pending", "passed", "blocked", "failed"].contains(status),
                  let detail = result["detail"]?.string, (1...300).contains(detail.unicodeScalars.count) else { return false }
            states[name] = status
        }
        let limits = ["meshCount": 10_000, "triangleCount": 2_000_000, "textureWidth": 8, "textureHeight": 8,
                      "glbVisiblePixels": 16_384, "textureMatchedQuadrants": 4, "audioSampleRate": 192_000,
                      "audioFrames": 192_000, "audioChannels": 2]
        for (name, maximum) in limits {
            guard let value = observed[name]?.integer, value <= maximum else { return false }
        }
        guard let audioState = observed["audioState"]?.string,
              ["unavailable", "suspended", "running", "closed", "interrupted"].contains(audioState),
              observed["wasmValue"] == .null || observed["wasmValue"] == .number(42),
              observed["workerMessage"] == .null || observed["workerMessage"] == .string("asset-worker-ready:42") else { return false }
        if states["glb"] == "passed" {
            guard payload["webgl2"] == .boolean(true), (observed["meshCount"]?.integer ?? 0) > 0,
                  (observed["triangleCount"]?.integer ?? 0) > 0, (observed["glbVisiblePixels"]?.integer ?? 0) >= 32 else { return false }
        }
        if states["texture"] == "passed" {
            guard payload["webgl2"] == .boolean(true), observed["textureWidth"] == .number(8),
                  observed["textureHeight"] == .number(8), observed["textureMatchedQuadrants"] == .number(4) else { return false }
        }
        if states["worker"] == "passed" && observed["workerMessage"] != .string("asset-worker-ready:42") { return false }
        if states["wasm"] == "passed" && observed["wasmValue"] != .number(42) { return false }
        if states["audio"] == "passed" {
            guard audioState == "running", (observed["audioFrames"]?.integer ?? 0) > 0,
                  (observed["audioSampleRate"]?.integer ?? 0) > 0, observed["audioChannels"] == .number(1) else { return false }
        }
        if stage == "ready" {
            guard states["audio"] == "pending", (observed["audioFrames"]?.integer ?? 0) > 0,
                  names.subtracting(["audio"]).allSatisfy({ states[$0] != "pending" }) else { return false }
        }
        if stage == "complete" && states.values.contains("pending") { return false }
        return true
    }

    /// These policy observations are supplied by the native host after WebKit
    /// completed preparation, never accepted from renderer messages.
    static func encodeVerifiedReport(_ payload: [String: BridgeJSON]) -> String? {
        guard isValid(payload) else { return nil }
        #if targetEnvironment(simulator)
        let simulator = true
        #else
        let simulator = false
        #endif
        let wrapper: [String: Any] = [
            "formatVersion": 1, "networkPolicy": "http-https-denied", "webDataCleared": true,
            "persistentStorage": false, "isSimulator": simulator, "report": payload.mapValues(\.foundationValue)
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: wrapper, options: [.sortedKeys]), data.count <= 16_384 else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
#endif
