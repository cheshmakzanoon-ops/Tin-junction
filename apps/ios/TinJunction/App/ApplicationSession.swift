import Combine

/// The application owns one layout authority. Recreating the presentation or
/// changing display geometry must not create a competing native save session.
/// Info.plist separately disables multiple application scenes; the WebView
/// attachment guard rejects an unexpected second renderer for this authority.
@MainActor
final class ApplicationSession: ObservableObject {
    let host: EngineHostModel

    init(store: any LayoutStoring = LayoutStore()) {
        host = EngineHostModel(store: store)
    }
}
