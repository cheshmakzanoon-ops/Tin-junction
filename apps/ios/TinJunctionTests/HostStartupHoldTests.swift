#if DEBUG
import XCTest
@testable import TinJunction

@MainActor
final class HostStartupHoldTests: XCTestCase {
    func testHoldRequiresItsExplicitLaunchArgument() {
        let hold = HostStartupHold(arguments: ["--asset-origin-probe", "--fail-renderer-once"])
        XCTAssertEqual(hold.state, .disabled)
        XCTAssertNil(hold.arm(onRelease: { XCTFail("An unrequested hold cannot release navigation.") },
                              onExpiry: { XCTFail("An unrequested hold cannot expire.") }))
        XCTAssertFalse(hold.release())
        hold.cancel()
        XCTAssertEqual(hold.state, .disabled)
    }

    func testReleaseConsumesTheHoldBeforeInvokingNavigation() throws {
        let hold = HostStartupHold(arguments: ["--hold-native-startup"])
        var releases = 0, expiries = 0
        let token = try XCTUnwrap(hold.arm(onRelease: {
            releases += 1
            XCTAssertEqual(hold.state, .released)
            XCTAssertFalse(hold.release(), "Reentrant taps cannot load a second document.")
        }, onExpiry: { expiries += 1 }))
        XCTAssertEqual(hold.state, .holding)
        XCTAssertTrue(hold.release())
        hold.expire(token: token)
        hold.cancel(token: token)
        XCTAssertFalse(hold.release())
        XCTAssertNil(hold.arm(onRelease: {}, onExpiry: {}), "The launch hold is consumed for this host.")
        XCTAssertEqual(releases, 1)
        XCTAssertEqual(expiries, 0)
        XCTAssertEqual(hold.state, .released)
    }

    func testStaleCancellationCannotTakeAnotherOwnersHold() throws {
        let hold = HostStartupHold(arguments: ["--hold-native-startup"])
        var releases = 0
        let token = try XCTUnwrap(hold.arm(onRelease: { releases += 1 }, onExpiry: {}))
        hold.cancel(token: UUID())
        hold.expire(token: UUID())
        XCTAssertEqual(hold.state, .holding)
        hold.cancel(token: token)
        XCTAssertEqual(hold.state, .cancelled)
        XCTAssertFalse(hold.release())
        hold.expire(token: token)
        XCTAssertEqual(releases, 0, "Teardown discards navigation instead of treating cancellation as release.")
    }

    func testExpiryConsumesNavigationBeforePublishingItsFailure() throws {
        let hold = HostStartupHold(arguments: ["--hold-native-startup"])
        var releases = 0, expiries = 0
        let token = try XCTUnwrap(hold.arm(onRelease: { releases += 1 }, onExpiry: {
            expiries += 1
            XCTAssertEqual(hold.state, .expired)
            XCTAssertFalse(hold.release(), "A timeout must never navigate after its native failure.")
        }))
        // Deterministically exercise the same token-checked transition used by
        // the deadline task; this fixture does not claim wall-clock timing.
        hold.expire(token: token)
        hold.expire(token: token)
        hold.cancel(token: token)
        XCTAssertNil(hold.arm(onRelease: {}, onExpiry: {}))
        XCTAssertEqual(releases, 0)
        XCTAssertEqual(expiries, 1)
        XCTAssertEqual(hold.state, .expired)
    }

    func testHostFailureCancelsBeforeAndAfterDeferredArming() throws {
        let before = EngineHostModel(launchArguments: ["--hold-native-startup"])
        defer { before.detach() }
        before.fail("Original pre-navigation failure")
        XCTAssertEqual(before.startupHold.state, .cancelled)
        XCTAssertNil(before.startupHold.arm(onRelease: {}, onExpiry: {}))
        XCTAssertEqual(before.status, "Original pre-navigation failure")

        let after = EngineHostModel(launchArguments: ["--hold-native-startup"])
        defer { after.detach() }
        let token = try XCTUnwrap(after.startupHold.arm(
            onRelease: { XCTFail("A failed host cannot resume held navigation.") },
            onExpiry: { after.fail("Late diagnostic failure") }))
        after.fail("Original attached-host failure")
        after.startupHold.expire(token: token)
        XCTAssertFalse(after.startupHold.release())
        XCTAssertEqual(after.status, "Original attached-host failure")
        XCTAssertEqual(after.phase, .failed)
    }

    func testRealNavigationAndDetachDisarmAnyPendingHold() throws {
        let host = EngineHostModel(launchArguments: ["--hold-native-startup"])
        defer { host.detach() }
        let token = try XCTUnwrap(host.startupHold.arm(
            onRelease: { XCTFail("An already loading host must not navigate twice.") },
            onExpiry: { host.fail("Late hold expiry") }))
        host.loading() // The existing navigation-start callback uses this path.
        host.startupHold.expire(token: token)
        XCTAssertEqual(host.startupHold.state, .cancelled)
        XCTAssertEqual(host.phase, .loading)
        XCTAssertFalse(host.isReady)

        let detached = EngineHostModel(launchArguments: ["--hold-native-startup"])
        detached.detach()
        XCTAssertEqual(detached.startupHold.state, .cancelled)
        XCTAssertNil(detached.startupHold.arm(onRelease: {}, onExpiry: {}))
    }
}
#endif
