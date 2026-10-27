import CryptoKit
import Foundation

struct StoredLayout: Equatable, Sendable {
    let document: LayoutDocument
    let checkpoint: Int
    let checksum: String
    let recovered: Bool
}

protocol LayoutStoring: Sendable {
    func load() async throws -> StoredLayout?
    func save(document: LayoutDocument, checkpoint: Int, expectedRevision: Int?) async throws -> StoredLayout
}

/// A single serialized writer. Two checksum-verified generations survive
/// application-level interruption; this is not a hardware power-loss guarantee.
actor LayoutStore: LayoutStoring {
    enum SaveStage: Equatable, Sendable { case beforeWrite, afterBackup, beforeReplace, afterReplace }
    enum Failure: String, Error, Equatable {
        case noValidSave = "no_valid_save"
        case staleCheckpoint = "stale_checkpoint"
        case revisionConflict = "revision_conflict"
        case checkpointConflict = "checkpoint_conflict"
        case differentDocument = "different_document"
        case invalidCheckpoint = "invalid_checkpoint"
        case injectedWriteFailure = "write_failed"
        case invalidStoredGeneration = "invalid_stored_generation"
    }

    private struct Generation: Codable {
        let storageVersion: Int
        let checkpoint: Int
        let checksum: String
        let document: LayoutDocument

        func checked(recovered: Bool) throws -> StoredLayout {
            guard storageVersion == 1, (0...LayoutDocument.maximumInteger).contains(checkpoint),
                  checksum == LayoutStore.digest(try document.canonicalData()) else {
                throw Failure.invalidStoredGeneration
            }
            return StoredLayout(document: document, checkpoint: checkpoint, checksum: checksum, recovered: recovered)
        }
    }

    private let directory: URL?
    private let failAt: SaveStage?

    init(directory: URL? = nil, failAt: SaveStage? = nil) {
        self.directory = directory
        self.failAt = failAt
    }

    private func storageDirectory(create: Bool) throws -> URL {
        let root: URL
        if let directory { root = directory }
        else {
            root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask,
                                              appropriateFor: nil, create: create)
                .appendingPathComponent("TinJunction", isDirectory: true)
        }
        if create { try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true) }
        return root
    }

    private static func digest(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }

    private func read(_ url: URL, recovered: Bool) throws -> StoredLayout {
        let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard size <= LayoutDocument.maximumBytes + 1_024 else { throw Failure.invalidStoredGeneration }
        let data = try Data(contentsOf: url)
        guard let raw = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              Set(raw.keys) == ["storageVersion", "checkpoint", "checksum", "document"],
              let document = raw["document"] as? [String: Any] else { throw Failure.invalidStoredGeneration }
        // Codable intentionally gets a strict preflight: unknown fields in a
        // corrupted or future-format save must not disappear silently.
        _ = try LayoutDocument.decode(document)
        return try JSONDecoder().decode(Generation.self, from: data).checked(recovered: recovered)
    }

    func load() throws -> StoredLayout? {
        let root = try storageDirectory(create: false)
        let current = root.appendingPathComponent("current.json")
        let previous = root.appendingPathComponent("previous.json")
        let hasCurrent = FileManager.default.fileExists(atPath: current.path)
        let hasPrevious = FileManager.default.fileExists(atPath: previous.path)
        guard hasCurrent || hasPrevious else { return nil }
        if hasCurrent, let value = try? read(current, recovered: false) { return value }
        if hasPrevious, let value = try? read(previous, recovered: true) { return value }
        // Do not remove, rewrite, or replace either damaged file with factory data.
        throw Failure.noValidSave
    }

    func save(document: LayoutDocument, checkpoint: Int, expectedRevision: Int?) throws -> StoredLayout {
        let documentData = try document.canonicalData()
        guard (0...LayoutDocument.maximumInteger).contains(checkpoint),
              expectedRevision.map({ (0...LayoutDocument.maximumInteger).contains($0) }) ?? true else {
            throw Failure.invalidCheckpoint
        }
        let checksum = Self.digest(documentData)
        let current = try load()
        if let current {
            guard current.document.documentId == document.documentId else { throw Failure.differentDocument }
            // Retrying a lost acknowledgement is safe, even if its expected
            // revision describes the state before this already committed save.
            if current.checkpoint == checkpoint {
                guard current.checksum == checksum else { throw Failure.checkpointConflict }
                return current
            }
            guard checkpoint > current.checkpoint, document.revision >= current.document.revision else {
                throw Failure.staleCheckpoint
            }
            guard expectedRevision == current.document.revision else { throw Failure.revisionConflict }
            if document.revision == current.document.revision {
                var structural = document
                structural.train = current.document.train
                structural.tick = current.document.tick
                guard structural == current.document else { throw Failure.revisionConflict }
            }
        } else {
            guard expectedRevision == nil else { throw Failure.revisionConflict }
        }
        try inject(.beforeWrite)
        let root = try storageDirectory(create: true)
        let currentURL = root.appendingPathComponent("current.json")
        let previousURL = root.appendingPathComponent("previous.json")
        if let current {
            if current.recovered {
                // Retain damaged evidence, and never overwrite the only verified
                // backup with the corrupt primary during recovery.
                if FileManager.default.fileExists(atPath: currentURL.path) {
                    let damaged = try Data(contentsOf: currentURL)
                    try damaged.write(to: root.appendingPathComponent("damaged-current.json"), options: [.atomic])
                }
            } else {
                let previousData = try Data(contentsOf: currentURL)
                try previousData.write(to: previousURL, options: [.atomic])
            }
        }
        try inject(.afterBackup)
        let generation = Generation(storageVersion: 1, checkpoint: checkpoint, checksum: checksum, document: document)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        let data = try encoder.encode(generation)
        try inject(.beforeReplace)
        // Foundation's atomic option writes a sibling temporary file and replaces
        // the destination only after the complete write succeeds.
        try data.write(to: currentURL, options: [.atomic])
        try inject(.afterReplace)
        let stored = try read(currentURL, recovered: false)
        guard stored.checkpoint == checkpoint, stored.checksum == checksum else {
            throw Failure.invalidStoredGeneration
        }
        return stored
    }

    private func inject(_ stage: SaveStage) throws {
        if failAt == stage { throw Failure.injectedWriteFailure }
    }
}
