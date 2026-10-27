import Foundation
import XCTest
@testable import TinJunction

@MainActor
final class LayoutStoreTests: XCTestCase {
    private func directory() -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("tin-layout-test-\(UUID().uuidString)", isDirectory: true)
    }

    func testFirstSaveReloadAndIdempotentRetry() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        let store = LayoutStore(directory: root)
        let empty = try await store.load()
        XCTAssertNil(empty)
        let document = LayoutFixtures.document()
        let saved = try await store.save(document: document, checkpoint: 1, expectedRevision: nil)
        XCTAssertEqual(saved.checksum.count, 64)
        let reloaded = try await LayoutStore(directory: root).load()
        XCTAssertEqual(reloaded?.document, document)
        let duplicate = try await store.save(document: document, checkpoint: 1, expectedRevision: nil)
        XCTAssertEqual(duplicate, saved)
    }

    func testStaleConflictingAndForeignSavesNeverReplaceLatest() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        let store = LayoutStore(directory: root)
        let first = LayoutFixtures.document()
        _ = try await store.save(document: first, checkpoint: 1, expectedRevision: nil)
        let second = LayoutFixtures.document(revision: 1)
        _ = try await store.save(document: second, checkpoint: 2, expectedRevision: 0)
        do {
            _ = try await store.save(document: first, checkpoint: 1, expectedRevision: 0)
            XCTFail("A stale checkpoint must not overwrite the latest save.")
        } catch { XCTAssertEqual(error as? LayoutStore.Failure, .staleCheckpoint) }
        var conflict = second
        conflict.name = "Conflicting contents"
        do {
            _ = try await store.save(document: conflict, checkpoint: 2, expectedRevision: 1)
            XCTFail("The same checkpoint cannot refer to different contents.")
        } catch { XCTAssertEqual(error as? LayoutStore.Failure, .checkpointConflict) }
        do {
            _ = try await store.save(document: conflict, checkpoint: 3, expectedRevision: 0)
            XCTFail("An incorrect prior durable revision is rejected.")
        } catch { XCTAssertEqual(error as? LayoutStore.Failure, .revisionConflict) }
        do {
            _ = try await store.save(document: conflict, checkpoint: 3, expectedRevision: 1)
            XCTFail("Structural changes must increment the document revision.")
        } catch { XCTAssertEqual(error as? LayoutStore.Failure, .revisionConflict) }
        var foreign = second
        foreign.documentId = "another-layout"
        do {
            _ = try await store.save(document: foreign, checkpoint: 3, expectedRevision: 1)
            XCTFail("Document switches need a deliberate library operation.")
        } catch { XCTAssertEqual(error as? LayoutStore.Failure, .differentDocument) }
        let reloaded = try await store.load()
        XCTAssertEqual(reloaded?.document, second)
    }

    func testCorruptPrimaryRecoversVerifiedPreviousWithoutRewritingIt() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        let store = LayoutStore(directory: root)
        let first = LayoutFixtures.document()
        _ = try await store.save(document: first, checkpoint: 1, expectedRevision: nil)
        _ = try await store.save(document: LayoutFixtures.document(revision: 1), checkpoint: 2, expectedRevision: 0)
        let previousURL = root.appendingPathComponent("previous.json")
        let priorBytes = try Data(contentsOf: previousURL)
        let corruptBytes = Data("{incomplete".utf8)
        try corruptBytes.write(to: root.appendingPathComponent("current.json"))
        let recovered = try await store.load()
        XCTAssertEqual(recovered?.document, first)
        XCTAssertEqual(recovered?.recovered, true)
        XCTAssertEqual(try Data(contentsOf: previousURL), priorBytes)
        XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("current.json")), corruptBytes)
        _ = try await store.save(document: LayoutFixtures.document(revision: 2), checkpoint: 3, expectedRevision: 0)
        XCTAssertEqual(try Data(contentsOf: previousURL), priorBytes)
        XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("damaged-current.json")), corruptBytes)
    }

    func testChecksumDetectsValidJSONCorruption() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        let store = LayoutStore(directory: root)
        _ = try await store.save(document: LayoutFixtures.document(), checkpoint: 1, expectedRevision: nil)
        _ = try await store.save(document: LayoutFixtures.document(revision: 1), checkpoint: 2, expectedRevision: 0)
        let currentURL = root.appendingPathComponent("current.json")
        var wrapper = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: currentURL)) as? [String: Any])
        var document = try XCTUnwrap(wrapper["document"] as? [String: Any])
        document["name"] = "Changed without updating checksum"
        wrapper["document"] = document
        try JSONSerialization.data(withJSONObject: wrapper).write(to: currentURL)
        let recovered = try await store.load()
        XCTAssertEqual(recovered?.document.revision, 0)
        XCTAssertEqual(recovered?.recovered, true)
    }

    func testBothCorruptFilesRemainUntouchedAndBlockFactoryOverwrite() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let corrupt = Data("damaged-user-data".utf8)
        for name in ["current.json", "previous.json"] { try corrupt.write(to: root.appendingPathComponent(name)) }
        let store = LayoutStore(directory: root)
        do { _ = try await store.load(); XCTFail("Corrupt saves must not become a fresh layout.") }
        catch { XCTAssertEqual(error as? LayoutStore.Failure, .noValidSave) }
        do {
            _ = try await store.save(document: LayoutFixtures.document(), checkpoint: 1, expectedRevision: nil)
            XCTFail("A factory snapshot cannot overwrite unrecovered personal data.")
        } catch { XCTAssertEqual(error as? LayoutStore.Failure, .noValidSave) }
        for name in ["current.json", "previous.json"] {
            XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent(name)), corrupt)
        }
    }

    func testInterruptedWritesPreserveCompleteGenerationAtEveryBoundary() async throws {
        for stage: LayoutStore.SaveStage in [.beforeWrite, .afterBackup, .beforeReplace, .afterReplace] {
            let root = directory()
            defer { try? FileManager.default.removeItem(at: root) }
            let first = LayoutFixtures.document()
            let second = LayoutFixtures.document(revision: 1)
            _ = try await LayoutStore(directory: root).save(document: first, checkpoint: 1, expectedRevision: nil)
            let faulty = LayoutStore(directory: root, failAt: stage)
            do {
                _ = try await faulty.save(document: second, checkpoint: 2, expectedRevision: 0)
                XCTFail("Injected write failure must prevent successful acknowledgement.")
            } catch { XCTAssertEqual(error as? LayoutStore.Failure, .injectedWriteFailure) }
            let reopened = try await LayoutStore(directory: root).load()
            XCTAssertEqual(reopened?.document, stage == .afterReplace ? second : first)
            XCTAssertEqual(reopened?.recovered, false)
            if stage == .afterReplace {
                let retry = try await LayoutStore(directory: root).save(document: second, checkpoint: 2, expectedRevision: 0)
                XCTAssertEqual(retry.document, second, "A lost acknowledgement can be retried idempotently.")
            }
        }
    }
}
