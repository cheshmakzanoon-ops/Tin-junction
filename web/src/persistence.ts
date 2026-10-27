import { parseLayoutDocument } from "./model";
import type { LayoutDocument } from "./model";

export const BROWSER_SAVE_KEY = "tin-junction.workbench.v1.current";
export const BROWSER_BACKUP_KEY = "tin-junction.workbench.v1.previous";
export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
type Generation = { format: "tin-junction-browser-generation"; storageVersion: 2; checkpoint: number; checksum: string; generationChecksum: string; document: LayoutDocument };
export type RestoreResult = { document: LayoutDocument | null; checkpoint: number; recovered: boolean; error: string | null };

/** Non-cryptographic accidental-corruption checksum. Native generations use SHA-256. */
function checksum(text: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) { value ^= text.charCodeAt(index); value = Math.imul(value, 0x01000193); }
  return (value >>> 0).toString(16).padStart(8, "0");
}
function generationChecksum(checkpoint: number, documentChecksum: string): string {
  return checksum(JSON.stringify({ checkpoint, checksum: documentChecksum, storageVersion: 2 }));
}
function generation(document: LayoutDocument, checkpoint: number): Generation {
  const digest = checksum(JSON.stringify(document));
  return { format: "tin-junction-browser-generation", storageVersion: 2, checkpoint, checksum: digest,
    generationChecksum: generationChecksum(checkpoint, digest), document };
}
const structure = (document: LayoutDocument): string => JSON.stringify([
  document.documentId, document.revision, document.name, document.seed,
  document.track, document.scenery, document.environment,
]);
function decode(raw: string | null): Generation | null {
  if (!raw || new TextEncoder().encode(raw).length > 524_288) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const item = value as Record<string, unknown>;
    const legacy = item.storageVersion === undefined;
    const keys = legacy ? ["format", "checkpoint", "checksum", "document"]
      : ["format", "storageVersion", "checkpoint", "checksum", "generationChecksum", "document"];
    if (Object.keys(item).length !== keys.length || Object.keys(item).some(key => !keys.includes(key))
      || (!legacy && item.storageVersion !== 2) || item.format !== "tin-junction-browser-generation"
      || !Number.isSafeInteger(item.checkpoint) || (item.checkpoint as number) < 0) return null;
    const parsed = parseLayoutDocument(item.document);
    if (!parsed.ok || item.checksum !== checksum(JSON.stringify(item.document))) return null;
    if (!legacy && item.generationChecksum !== generationChecksum(item.checkpoint as number, item.checksum as string)) return null;
    // Legacy checksums never protected ordering metadata. Preserve the verified
    // document and original stored bytes, but start its new session at zero.
    // Only a later successful save upgrades the wrapper; this is not a fallback
    // to an older document and must not display a lost-changes recovery notice.
    return generation(parsed.value, legacy ? 0 : item.checkpoint as number);
  } catch { return null; }
}

/** Browser-only development persistence; never used as the iOS durable authority. */
export class BrowserLayoutStore {
  private durable: Generation | null = null;
  private unavailable = false;
  constructor(private readonly storage: KeyValueStore) {}
  load(): RestoreResult {
    try {
      const raw = this.storage.getItem(BROWSER_SAVE_KEY);
      const previous = this.storage.getItem(BROWSER_BACKUP_KEY);
      const primary = decode(raw), backup = decode(previous);
      this.durable = primary ?? backup;
      this.unavailable = (raw !== null || previous !== null) && !this.durable;
      return { document: this.durable?.document ?? null, checkpoint: this.durable?.checkpoint ?? 0, recovered: !primary && backup !== null,
        error: this.unavailable ? "Your saved layout could not be read. Its original data has been preserved. Restore it before saving new changes." : null };
    } catch {
      this.unavailable = true;
      return { document: null, checkpoint: 0, recovered: false, error: "Local storage is unavailable. You can explore, but changes cannot be saved in this browser." };
    }
  }
  save(document: LayoutDocument, checkpoint: number): void {
    if (this.unavailable) throw new Error("Saving is paused to preserve unreadable layout data.");
    const parsed = parseLayoutDocument(document);
    if (!parsed.ok) throw new Error(parsed.error);
    if (!Number.isSafeInteger(checkpoint) || checkpoint < 1) throw new Error("Invalid checkpoint sequence.");
    const old = this.durable;
    if (old && (old.document.documentId !== document.documentId || document.revision < old.document.revision || checkpoint < old.checkpoint)) throw new Error("A stale checkpoint cannot replace your saved layout.");
    const digest = checksum(JSON.stringify(parsed.value));
    if (old && checkpoint === old.checkpoint) {
      if (old.checksum === digest && document.revision === old.document.revision) return;
      throw new Error("This checkpoint conflicts with the saved layout.");
    }
    if (old && old.document.revision === document.revision && structure(old.document) !== structure(parsed.value)) throw new Error("Layout changes require a new revision.");
    const next = generation(parsed.value, checkpoint);
    const bytes = JSON.stringify(next);
    if (new TextEncoder().encode(bytes).length > 524_288) throw new Error("Layout exceeds the supported save size.");
    // localStorage replaces each key atomically. A failed primary write leaves the old generation intact.
    if (old) this.storage.setItem(BROWSER_BACKUP_KEY, JSON.stringify(old));
    this.storage.setItem(BROWSER_SAVE_KEY, bytes);
    this.durable = next;
  }
}
