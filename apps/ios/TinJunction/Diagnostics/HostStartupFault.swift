#if DEBUG
import Foundation
import WebKit

/// An explicit UI-test fault at the real WebGL2 creation boundary. It does not
/// synthesize a host error or change production navigation/security policy.
/// The first renderer error disarms it, allowing the actual Retry path to run.
@MainActor
final class HostStartupFault {
    private var injectedScript: WKUserScript?
    private weak var controller: WKUserContentController?

    func install(in controller: WKUserContentController) {
        guard ProcessInfo.processInfo.arguments.contains("--fail-renderer-once"),
              injectedScript == nil else { return }
        let script = WKUserScript(source: """
        (() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
            if (kind === 'webgl2') return null;
            return original.call(this, kind, ...args);
          };
        })();
        """, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        self.controller = controller
        injectedScript = script
        controller.addUserScript(script)
    }

    func disarm() {
        guard let script = injectedScript, let controller else { return }
        // Preserve every other installed script and only remove this fault.
        let retained = controller.userScripts.filter { $0 !== script }
        controller.removeAllUserScripts()
        retained.forEach(controller.addUserScript)
        injectedScript = nil
        self.controller = nil
    }
}
#endif
