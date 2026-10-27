import SwiftUI

/// Native document status and recovery remain available if the 3D view fails.
struct RootView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.displayScale) private var displayScale
    @ObservedObject var host: EngineHostModel
    @State private var showingHelp = false

    private let ink = Color(red: 0.10, green: 0.16, blue: 0.14)
    private let paper = Color(red: 0.96, green: 0.94, blue: 0.88)

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Tin Junction")
                        .font(.system(.headline, design: .serif))
                        .accessibilityIdentifier("host.title")
                    Text(host.isReady ? host.saveDescription : host.status)
                        .font(.caption)
                        .foregroundStyle(ink.opacity(0.75))
                        .accessibilityIdentifier(host.isReady ? "host.ready" : "host.status")
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                Button(action: host.requestCheckpoint) {
                    Image(systemName: host.saveState == .blocked ? "lock.fill" : host.saveState == .failed ? "arrow.clockwise" : "square.and.arrow.down")
                        .frame(minWidth: 44, minHeight: 44)
                }
                .accessibilityLabel(host.saveState == .blocked ? "Saving paused to protect your saved railway" : host.saveState == .failed ? "Retry saving railway" : "Save railway")
                .accessibilityIdentifier("host.save")
                .disabled(!host.isReady || host.saveState == .saving || host.saveState == .blocked)
                Button { showingHelp = true } label: {
                    Image(systemName: "questionmark.circle").frame(minWidth: 44, minHeight: 44)
                }
                .accessibilityLabel("Railway help and save details")
                .accessibilityIdentifier("host.help")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
            .foregroundStyle(ink)
            .background(paper)

            #if DEBUG
            if host.assetProbeEnabled {
                Text("Bundled asset origin observations")
                    .font(.caption2)
                    .frame(maxWidth: .infinity)
                    .background(paper)
                    .accessibilityIdentifier("host.assetProbe")
                    .accessibilityValue(host.assetProbeJSON)
            }
            #endif

            if host.isReady && (host.saveState == .saved || host.saveState == .recovered) {
                Text(host.hasRestoredLayout ? "Saved railway restored" : "Railway saved on this iPhone")
                    .font(.caption2)
                    .foregroundStyle(ink.opacity(0.7))
                    .frame(maxWidth: .infinity)
                    .padding(.bottom, 4)
                    .background(paper)
                    .accessibilityIdentifier(host.hasRestoredLayout ? "host.restored" : "host.saved")
                    .accessibilityValue("Revision \(host.durableRevision ?? 0), checkpoint \(host.durableCheckpoint ?? 0)")
            }

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
                    .overlay {
                        if host.phase == .failed {
                            VStack(spacing: 16) {
                                Image(systemName: "tram.fill").font(.largeTitle)
                                Text("Let's reopen your railway")
                                    .font(.system(.title2, design: .serif))
                                Text(host.status).multilineTextAlignment(.center)
                                Button("Try loading again", action: host.retryLoading)
                                    .buttonStyle(.borderedProminent)
                                    .accessibilityIdentifier("host.retry")
                            }
                            .padding(28)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(paper)
                            .foregroundStyle(ink)
                            .accessibilityIdentifier("host.recovery")
                        } else if !host.isReady {
                            VStack(spacing: 14) {
                                ProgressView()
                                    .controlSize(.large)
                                Text(host.phase == .recovering ? "Restoring your railway view" : "Opening your railway")
                                    .font(.system(.title3, design: .serif))
                                Text(host.status)
                                    .font(.callout)
                                    .multilineTextAlignment(.center)
                            }
                            .padding(28)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(paper)
                            .foregroundStyle(ink)
                            .accessibilityElement(children: .combine)
                            .accessibilityIdentifier("host.loading")
                        }
                    }
                    .onChange(of: viewport, initial: true) { _, newValue in
                        host.updateViewport(newValue)
                    }
            }
        }
        .tint(ink)
        .background(paper)
        .sheet(isPresented: $showingHelp) {
            NavigationStack {
                List {
                    Section("A railway of your own") {
                        Text("Use the throttle to set your train moving. Stop before changing direction. Drag the scene to look around, or choose a camera view.")
                        Text("Enter Arrange to place miniature scenery. Every placement can be undone. The train stays stopped while you arrange your railway.")
                    }
                    Section("Your layout") {
                        LabeledContent("Save status", value: host.saveDescription)
                        if let revision = host.durableRevision {
                            LabeledContent("Saved revision", value: String(revision))
                        }
                        Text("Layouts are stored privately on this iPhone. The app keeps the previous verified save for recovery. A restored train always starts stopped.")
                        if host.saveState == .recovered {
                            Text("A previous save was recovered. Changes made after that save may be missing; the damaged file has been retained.")
                        }
                        if host.saveState == .blocked {
                            Text("Saving is paused to avoid overwriting conflicting or unreadable saved data. Your current edits are still open. Reopening attempts to load saved data and discards unsaved changes.")
                        }
                    }
                    Section("Development edition") {
                        Text("This first operating railway uses an oval track and original procedural miniatures. More track shapes and final artwork are still in development.")
                        Text("Duo context: \(host.hingeDescription)")
                            .font(.caption)
                            .accessibilityIdentifier("host.hinge")
                        #if DEBUG
                        Text("Platform observations (simulator or device; not hardware approval)")
                            .font(.caption)
                            .accessibilityIdentifier("host.platformProbe")
                            .accessibilityValue(host.platformProbeJSON)
                        #endif
                    }
                }
                .accessibilityIdentifier("host.help.contents")
                .navigationTitle("Railway guide")
                // Keep dismissal in the sheet's safe area. The adaptive
                // navigation bar can omit its toolbar action from the Duo
                // accessibility tree after the List scrolls.
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    VStack(spacing: 0) {
                        Button { showingHelp = false } label: {
                            // The advertised accessibility frame must also be
                            // interactive, including Duo's asymmetric safe area.
                            Text("Done")
                                .frame(maxWidth: .infinity, minHeight: 44)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.borderedProminent)
                        .accessibilityIdentifier("host.help.done")
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(paper)
                }
            }
            .tint(ink)
        }
        .onHingeChange { _, context in
            host.updateHinge(angleDegrees: context.hinge?.angle.degrees)
        }
        .onChange(of: scenePhase, initial: true) { _, _ in
            updateHostLifecycle()
        }
        .onChange(of: showingHelp) { _, _ in
            updateHostLifecycle()
        }
    }

    private func updateHostLifecycle() {
        switch scenePhase {
        case .active: host.updateLifecycle(showingHelp ? .inactive : .active)
        case .inactive: host.updateLifecycle(.inactive)
        case .background: host.updateLifecycle(.background)
        @unknown default: host.updateLifecycle(.inactive)
        }
    }
}
