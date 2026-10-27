#if DEBUG
import Combine
import Foundation

/// Explicit, one-shot UI-test instrumentation before the first navigation.
/// The actual renderer readiness deadline starts unchanged when navigation
/// begins. Releasing this hold never fabricates a bridge or layout response.
@MainActor
final class HostStartupHold: ObservableObject {
    enum State: Equatable { case disabled, requested, holding, released, cancelled, expired }

    @Published private(set) var state: State
    private var activeToken: UUID?
    private var releaseAction: (() -> Void)?
    private var expiryAction: (() -> Void)?
    private var deadlineTask: Task<Void, Never>?

    init(arguments: [String]) {
        state = arguments.contains("--hold-native-startup") ? .requested : .disabled
    }

    /// Call after the representable's creation/update has returned, so arming
    /// does not publish a SwiftUI change while it is constructing the view.
    @discardableResult
    func arm(onRelease: @escaping () -> Void, onExpiry: @escaping () -> Void) -> UUID? {
        guard state == .requested else { return nil }
        let token = UUID()
        activeToken = token
        releaseAction = onRelease
        expiryAction = onExpiry
        state = .holding
        deadlineTask = Task { [weak self] in
            // This bounds the explicit diagnostic hold only. The normal
            // 20-second renderer timeout is neither started nor extended here.
            do { try await Task.sleep(for: .seconds(60)) }
            catch { return }
            guard !Task.isCancelled else { return }
            self?.expire(token: token)
        }
        return token
    }

    @discardableResult
    func release() -> Bool {
        guard state == .holding, let action = releaseAction else { return false }
        finish(.released)
        action()
        return true
    }

    /// An old coordinator may cancel only its own outstanding operation.
    func cancel(token: UUID) {
        guard state == .holding, activeToken == token else { return }
        finish(.cancelled)
    }

    /// The owning host uses this on a real load, failure or detach, including
    /// cancellation before the coordinator's deferred arm has executed.
    func cancel() {
        guard state == .requested || state == .holding else { return }
        finish(.cancelled)
    }

    func expire(token: UUID) {
        guard state == .holding, activeToken == token, let action = expiryAction else { return }
        finish(.expired)
        action()
    }

    private func finish(_ nextState: State) {
        // Consume callbacks before publishing or calling client code. Reentrant
        // release, late expiry and teardown cannot start another navigation.
        deadlineTask?.cancel()
        deadlineTask = nil
        activeToken = nil
        releaseAction = nil
        expiryAction = nil
        state = nextState
    }
}
#endif
