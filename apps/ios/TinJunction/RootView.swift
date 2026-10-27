import SwiftUI

/// An engineering harness. This is intentionally not the final game chrome.
struct RootView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.displayScale) private var displayScale
    @StateObject private var host = EngineHostModel()

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Tin Junction — engineering harness")
                    .font(.headline)
                    .accessibilityIdentifier("host.title")
                Text(host.status)
                    .font(.caption)
                    .accessibilityIdentifier(host.isReady ? "host.ready" : "host.status")
                Text("Duo API probe · \(host.hingeDescription)")
                    .font(.caption2)
                    .accessibilityIdentifier("host.hinge")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(.regularMaterial)

            GeometryReader { proxy in
                let viewport = NativeViewport(
                    width: Double(proxy.size.width),
                    height: Double(proxy.size.height),
                    pixelRatio: Double(displayScale),
                    // Region frames are measured in this view's coordinate space.
                    // No guessed hinge width, screen size, or angle threshold.
                    reservedRegions: (
                        proxy.reservedRegions(kind: .division).map(\.frame)
                        + proxy.reservedRegions(kind: .occlusion).map(\.frame)
                    ).map(NativeViewport.Region.init)
                )
                EngineWebView(host: host)
                    .onChange(of: viewport, initial: true) { _, newValue in
                        host.updateViewport(newValue)
                    }
            }
        }
        .onHingeChange { _, context in
            host.updateHinge(angleDegrees: context.hinge?.angle.degrees)
        }
        .onChange(of: scenePhase, initial: true) { _, phase in
            switch phase {
            case .active: host.updateLifecycle(.active)
            case .inactive: host.updateLifecycle(.inactive)
            case .background: host.updateLifecycle(.background)
            @unknown default: host.updateLifecycle(.inactive)
            }
        }
    }
}
