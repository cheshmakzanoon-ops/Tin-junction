import SwiftUI

@main
struct TinJunctionApp: App {
    @StateObject private var session = ApplicationSession()

    var body: some Scene {
        WindowGroup {
            RootView(host: session.host)
        }
    }
}
