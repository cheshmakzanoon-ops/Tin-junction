import { parseLayoutDocument } from "./model";
import type { LayoutDocument } from "./model";

export const BROWSER_SAVE_KEY = "tin-junction.workbench.v1.current";
export const BROWSER_BACKUP_KEY = "tin-junction.workbench.v1.previous";
export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
type Generation = { format: "tin-junction-browser-generation"; checkpoint: number; checksum: string; document: LayoutDocument };
export type RestoreResult = { document: LayoutDocument | null; checkpoint: number; recovered: boolean; error: string | null };

/** Non-cryptographic accidental-corruption checksum. Native generations use SHA-256. */
function checksum(text: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) { value ^= text.charCodeAt(index); value = Math.imul(value, 0x01000193); }
  return (value >>> 0).toString(16).padStart(8, "0");
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
    if (Object.keys(item).some(key => !["format", "checkpoint", "checksum", "document"].includes(key)) || item.format !== "tin-junction-browser-generation" || !Number.isSafeInteger(item.checkpoint) || (item.checkpoint as number) < 0) return null;
    const parsed = parseLayoutDocument(item.document);
    if (!parsed.ok || item.checksum !== checksum(JSON.stringify(item.document))) return null;
    return { format: "tin-junction-browser-generation", checkpoint: item.checkpoint as number, checksum: checksum(JSON.stringify(parsed.value)), document: parsed.value };
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
    const next: Generation = { format: "tin-junction-browser-generation", checkpoint, checksum: digest, document: parsed.value };
    const bytes = JSON.stringify(next);
    if (new TextEncoder().encode(bytes).length > 524_288) throw new Error("Layout exceeds the supported save size.");
    // localStorage replaces each key atomically. A failed primary write leaves the old generation intact.
    if (old) this.storage.setItem(BROWSER_BACKUP_KEY, JSON.stringify(old));
    this.storage.setItem(BROWSER_SAVE_KEY, bytes);
    this.durable = next;
  }
}
