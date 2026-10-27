#if DEBUG
import SwiftUI
import UIKit

/// Explicit test-only observation, independent of a working canvas or bridge.
/// Accessibility reads a fresh bounded native snapshot without a polling task.
struct StartupTraceDiagnostic: UIViewRepresentable {
    final class Label: UILabel {
        override var accessibilityValue: String? {
            get { PlatformStartupTrace.snapshotJSON() }
            set { /* The diagnostic is read-only. */ }
        }
    }

    func makeUIView(context: Context) -> Label {
        let label = Label()
        label.text = "Startup diagnostics"
        label.font = .preferredFont(forTextStyle: .caption2)
        label.textColor = UIColor(red: 0.10, green: 0.16, blue: 0.14, alpha: 1)
        label.textAlignment = .center
        label.isAccessibilityElement = true
        label.accessibilityIdentifier = "host.startupTrace"
        label.accessibilityLabel = "Startup diagnostics"
        return label
    }

    func updateUIView(_ uiView: Label, context: Context) {}
}
#endif
