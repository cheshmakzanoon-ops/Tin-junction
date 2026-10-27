import Foundation

struct NativeViewport: Equatable, Sendable {
    struct Region: Equatable, Sendable {
        let x: Double
        let y: Double
        let width: Double
        let height: Double

        init(_ rect: CGRect) {
            x = Double(rect.origin.x)
            y = Double(rect.origin.y)
            width = Double(rect.width)
            height = Double(rect.height)
        }

        var json: [String: Any] {
            ["x": x, "y": y, "width": width, "height": height]
        }

        var isValid: Bool {
            [x, y, width, height].allSatisfy(\.isFinite) && width >= 0 && height >= 0
        }
    }

    let width: Double
    let height: Double
    let pixelRatio: Double
    let reservedRegions: [Region]

    var isValid: Bool {
        [width, height, pixelRatio].allSatisfy(\.isFinite)
            && width > 0 && width <= 16_384 && height > 0 && height <= 16_384
            && pixelRatio > 0 && pixelRatio <= 8 && reservedRegions.count <= 16
            && reservedRegions.allSatisfy(\.isValid)
    }

    func payload(hingeAngleDegrees: Double?) -> [String: Any] {
        [
            "width": width,
            "height": height,
            "pixelRatio": pixelRatio,
            "reservedRegions": reservedRegions.map(\.json),
            "hingeAngleDegrees": hingeAngleDegrees.map { $0 as Any } ?? NSNull()
        ]
    }
}
