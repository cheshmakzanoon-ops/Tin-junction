import CryptoKit
import Foundation
import XCTest
@testable import TinJunction

@MainActor
final class LayoutStoreTests: XCTestCase {
    private func directory() -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("tin-layout-test-\(UUID().uuidString)", isDirectory: true)
    }

    private func legacyData(document: LayoutDocument, checkpoint: Int) throws -> Data {
        let checksum = SHA256.hash(data: try document.canonicalData()).map { String(format: "%02x", $0) }.joined()
        let object = try document.bridgeObject()
        return try JSONSerialization.data(withJSONObject: [
            "storageVersion": 1, "checkpoint": checkpoint, "checksum": checksum,
            "document": object
        ], options: [.sortedKeys])
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

    func testCheckpointOnlyCorruptionRecoversWithoutTrustingDocumentChecksum() async throws {
        for changedCheckpoint in [0, LayoutDocument.maximumInteger] {
            let root = directory()
            defer { try? FileManager.default.removeItem(at: root) }
            let store = LayoutStore(directory: root)
            let first = LayoutFixtures.document()
            _ = try await store.save(document: first, checkpoint: 7, expectedRevision: nil)
            _ = try await store.save(document: LayoutFixtures.document(revision: 1), checkpoint: 8, expectedRevision: 0)
            let currentURL = root.appendingPathComponent("current.json")
            let previousURL = root.appendingPathComponent("previous.json")
            let previousBytes = try Data(contentsOf: previousURL)
            var wrapper = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: currentURL)) as? [String: Any])
            let documentChecksum = try XCTUnwrap(wrapper["checksum"] as? String)
            XCTAssertEqual(wrapper["storageVersion"] as? Int, 2)
            XCTAssertEqual((wrapper["generationChecksum"] as? String)?.count, 64)
            wrapper["checkpoint"] = changedCheckpoint // Leave document and both digests untouched.
            XCTAssertEqual(wrapper["checksum"] as? String, documentChecksum)
            let damagedBytes = try JSONSerialization.data(withJSONObject: wrapper)
            try damagedBytes.write(to: currentURL)

            let recovered = try await LayoutStore(directory: root).load()
            XCTAssertEqual(recovered?.document, first)
            XCTAssertEqual(recovered?.checkpoint, 7)
            XCTAssertEqual(recovered?.recovered, true)
            XCTAssertEqual(try Data(contentsOf: currentURL), damagedBytes)
            XCTAssertEqual(try Data(contentsOf: previousURL), previousBytes)

            // A forged maximum must not wedge saving, and a lowered counter
            // must not become the authority for ordering the next checkpoint.
            let next = LayoutFixtures.document(revision: 2)
            let saved = try await store.save(document: next, checkpoint: 8, expectedRevision: 0)
            XCTAssertEqual(saved.document, next)
            XCTAssertEqual(saved.checkpoint, 8)
            XCTAssertEqual(try Data(contentsOf: previousURL), previousBytes)
            XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("damaged-current.json")), damagedBytes)
        }
    }

    func testLegacyDocumentRestartsOrderingWithoutRewritingOrClaimingRecovery() async throws {
        for legacyCheckpoint in [27, LayoutDocument.maximumInteger] {
            let root = directory()
            defer { try? FileManager.default.removeItem(at: root) }
            try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
            let document = LayoutFixtures.document(revision: 4)
            let legacyBytes = try legacyData(document: document, checkpoint: legacyCheckpoint)
            let currentURL = root.appendingPathComponent("current.json")
            let previousURL = root.appendingPathComponent("previous.json")
            try legacyBytes.write(to: currentURL)
            let store = LayoutStore(directory: root)
            let loaded = try await store.load()
            XCTAssertEqual(loaded?.document, document)
            XCTAssertEqual(loaded?.checkpoint, 0, "A legacy document checksum cannot certify its saved counter.")
            XCTAssertEqual(loaded?.recovered, false, "Current verified content was not replaced by a previous save.")
            XCTAssertEqual(try Data(contentsOf: currentURL), legacyBytes)
            XCTAssertFalse(FileManager.default.fileExists(atPath: previousURL.path))

            var conflict = document
            conflict.name = "Changed without a revision"
            do {
                _ = try await store.save(document: conflict, checkpoint: 1, expectedRevision: 4)
                XCTFail("Legacy normalization must retain same-revision structural protection.")
            } catch { XCTAssertEqual(error as? LayoutStore.Failure, .revisionConflict) }
            XCTAssertEqual(try Data(contentsOf: currentURL), legacyBytes)

            var next = document
            next.tick = 42
            next.train.distance = 0.15
            let saved = try await store.save(document: next, checkpoint: 1, expectedRevision: 4)
            XCTAssertEqual(saved.document, next)
            XCTAssertEqual(saved.checkpoint, 1)
            XCTAssertFalse(saved.recovered)
            XCTAssertEqual(try Data(contentsOf: previousURL), legacyBytes)
            let protected = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: currentURL)) as? [String: Any])
            XCTAssertEqual(protected["storageVersion"] as? Int, 2)
            XCTAssertEqual((protected["generationChecksum"] as? String)?.count, 64)
            XCTAssertEqual(saved.checksum, SHA256.hash(data: try next.canonicalData()).map { String(format: "%02x", $0) }.joined(),
                           "The bridge checksum still identifies the document, not the new wrapper.")
            let reloaded = try await LayoutStore(directory: root).load()
            XCTAssertEqual(reloaded, saved)
        }
    }

    func testCorruptLegacyPayloadRecoversPreviousAndPreservesOriginalBytes() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let first = LayoutFixtures.document()
        let previousBytes = try legacyData(document: first, checkpoint: 27)
        let currentBytes = try legacyData(document: LayoutFixtures.document(revision: 1), checkpoint: 28)
        var wrapper = try XCTUnwrap(JSONSerialization.jsonObject(with: currentBytes) as? [String: Any])
        var document = try XCTUnwrap(wrapper["document"] as? [String: Any])
        document["name"] = "Corrupt legacy contents"
        wrapper["document"] = document
        let damagedBytes = try JSONSerialization.data(withJSONObject: wrapper)
        let currentURL = root.appendingPathComponent("current.json")
        let previousURL = root.appendingPathComponent("previous.json")
        try damagedBytes.write(to: currentURL)
        try previousBytes.write(to: previousURL)

        let store = LayoutStore(directory: root)
        let recovered = try await store.load()
        XCTAssertEqual(recovered?.document, first)
        XCTAssertEqual(recovered?.checkpoint, 0)
        XCTAssertEqual(recovered?.recovered, true)
        XCTAssertEqual(try Data(contentsOf: currentURL), damagedBytes)
        XCTAssertEqual(try Data(contentsOf: previousURL), previousBytes)
        _ = try await store.save(document: LayoutFixtures.document(revision: 2), checkpoint: 1, expectedRevision: 0)
        XCTAssertEqual(try Data(contentsOf: previousURL), previousBytes)
        XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("damaged-current.json")), damagedBytes)
    }

    func testGenerationVersionAndIntegrityFieldsCannotBeOmittedOrDowngraded() async throws {
        let root = directory()
        defer { try? FileManager.default.removeItem(at: root) }
        _ = try await LayoutStore(directory: root).save(document: LayoutFixtures.document(), checkpoint: 1, expectedRevision: nil)
        let currentURL = root.appendingPathComponent("current.json")
        let original = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: currentURL)) as? [String: Any])
        var missingDigest = original
        missingDigest.removeValue(forKey: "generationChecksum")
        var downgraded = original
        downgraded["storageVersion"] = 1
        var futureVersion = original
        futureVersion["storageVersion"] = 3
        var changedDigest = original
        let digest = try XCTUnwrap(original["generationChecksum"] as? String)
        changedDigest["generationChecksum"] = (digest.first == "0" ? "1" : "0") + String(digest.dropFirst())
        let legacyBytes = try legacyData(document: LayoutFixtures.document(), checkpoint: 27)
        var legacyExtraField = try XCTUnwrap(JSONSerialization.jsonObject(with: legacyBytes) as? [String: Any])
        legacyExtraField["generationChecksum"] = NSNull()

        for wrapper in [missingDigest, downgraded, futureVersion, changedDigest, legacyExtraField] {
            let damagedBytes = try JSONSerialization.data(withJSONObject: wrapper)
            try damagedBytes.write(to: currentURL)
            do {
                _ = try await LayoutStore(directory: root).load()
                XCTFail("A strict versioned wrapper is required before trusting its generation.")
            } catch { XCTAssertEqual(error as? LayoutStore.Failure, .noValidSave) }
            XCTAssertEqual(try Data(contentsOf: currentURL), damagedBytes)
        }
    }

    func testInterruptedLegacyUpgradePreservesACompleteDocumentAtEveryBoundary() async throws {
        for stage: LayoutStore.SaveStage in [.beforeWrite, .afterBackup, .beforeReplace, .afterReplace] {
            let root = directory()
            defer { try? FileManager.default.removeItem(at: root) }
            try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
            let first = LayoutFixtures.document(revision: 4)
            let second = LayoutFixtures.document(revision: 5)
            let legacyBytes = try legacyData(document: first, checkpoint: LayoutDocument.maximumInteger)
            let currentURL = root.appendingPathComponent("current.json")
            try legacyBytes.write(to: currentURL)
            do {
                _ = try await LayoutStore(directory: root, failAt: stage).save(document: second, checkpoint: 1, expectedRevision: 4)
                XCTFail("An interrupted wrapper upgrade must not acknowledge successful storage.")
            } catch { XCTAssertEqual(error as? LayoutStore.Failure, .injectedWriteFailure) }
            let reopened = try await LayoutStore(directory: root).load()
            XCTAssertEqual(reopened?.document, stage == .afterReplace ? second : first)
            XCTAssertEqual(reopened?.checkpoint, stage == .afterReplace ? 1 : 0)
            XCTAssertEqual(reopened?.recovered, false)
            if stage != .afterReplace { XCTAssertEqual(try Data(contentsOf: currentURL), legacyBytes) }

            let retry = try await LayoutStore(directory: root).save(document: second, checkpoint: 1, expectedRevision: 4)
            XCTAssertEqual(retry.document, second)
            XCTAssertEqual(retry.checkpoint, 1)
            XCTAssertEqual(try Data(contentsOf: root.appendingPathComponent("previous.json")), legacyBytes)
        }
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
