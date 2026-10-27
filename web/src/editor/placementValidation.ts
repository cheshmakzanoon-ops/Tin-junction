import { buildTurnoutTopology } from "../track/turnout";
import type { TurnoutTopology } from "../track/turnout";
import { validateTrackClearance, validClearanceEnvelope } from "../track/clearance";
import type { ClearanceEnvelope, ClearanceResult, PlacementDiagnostic } from "../track/clearance";
import { RoutedConsist } from "../simulation/routedConsist";

export interface TrackDraftPreview {
  readonly structurallyValid: boolean;
  readonly readyForPlacement: boolean;
  readonly topology: TurnoutTopology | null;
  readonly diagnostics: readonly PlacementDiagnostic[];
  readonly clearance: ClearanceResult | null;
}
export interface DraftEditResult { readonly ok: boolean; readonly revision: number; readonly code: string; readonly message: string; readonly preview: TrackDraftPreview }
export type TrainPlacementResult =
  | { readonly ok: true; readonly consist: RoutedConsist; readonly revision: number }
  | { readonly ok: false; readonly code: string; readonly message: string; readonly diagnostics: readonly PlacementDiagnostic[]; readonly revision: number };
export const PLACEMENT_DRAFT_LIMITS = Object.freeze({ bytes: 524_288, nodes: 10_000 });
const record = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);
const item = (code: string, pieceIds: readonly string[], message: string): PlacementDiagnostic => Object.freeze({ code, pieceIds: Object.freeze([...new Set(pieceIds)].sort()), message });
const failedPreview = (diagnostics: readonly PlacementDiagnostic[]): TrackDraftPreview => Object.freeze({ structurallyValid: false, readyForPlacement: false, topology: null, diagnostics: Object.freeze([...diagnostics]), clearance: null });

function unsupportedGeometry(input: unknown): PlacementDiagnostic | null {
  if (!record(input)) return null;
  for (const group of [input.pieces, input.turnouts]) {
    if (!Array.isArray(group)) continue;
    for (const value of group.slice(0, 501)) {
      if (!record(value)) continue;
      const id = typeof value.id === "string" ? value.id : "unnamed track";
      if (Object.hasOwn(value, "grade") || (record(value.pose) && (Object.hasOwn(value.pose, "pitch") || Object.hasOwn(value.pose, "roll")))) return item("unsupported-grade", [id], `${id} uses a grade or bank angle that this planar kit does not support. Keep the track level and use its yaw rotation only.`);
      if (record(value.centerline) && value.centerline.kind !== "straight" && value.centerline.kind !== "arc") return item("unsupported-geometry", [id], `${id} uses unsupported track geometry. Choose a straight, circular arc or authored turnout from this kit.`);
    }
  }
  return null;
}

/** Returns diagnostics for a draft without moving, repairing, discarding or operating its pieces. */
export function previewTrackDraft(input: unknown, envelope: unknown): TrackDraftPreview {
  const unsupported = unsupportedGeometry(input);
  if (unsupported) return failedPreview([unsupported]);
  const built = buildTurnoutTopology(input);
  if (!built.ok) {
    const connections = record(input) && Array.isArray(input.connections) ? input.connections : [];
    const pieces = record(input) && Array.isArray(input.pieces) ? input.pieces : [];
    const turnouts = record(input) && Array.isArray(input.turnouts) ? input.turnouts : [];
    return failedPreview(built.diagnostics.map(diagnostic => {
      const connection = connections.find(value => record(value) && value.id === diagnostic.target);
      const ids = record(connection) ? [connection.a, connection.b].flatMap(value => record(value) && typeof value.pieceId === "string" ? [value.pieceId] : [])
        : [...pieces, ...turnouts].some(value => record(value) && value.id === diagnostic.target) ? [diagnostic.target] : [];
      const action = diagnostic.code === "misaligned-socket" ? " Align the indicated sockets before connecting them." : " Repair the indicated draft entries before placing a train.";
      return item(diagnostic.code, ids, diagnostic.message + action);
    }));
  }
  const clearance = validateTrackClearance(built.value, envelope);
  return Object.freeze({ structurallyValid: true, readyForPlacement: clearance.ok, topology: built.value, diagnostics: clearance.diagnostics, clearance });
}

function encodeDraft(input: unknown): string {
  let nodes = 0;
  const encoded = JSON.stringify(input, (_key, value: unknown) => {
    if (++nodes > PLACEMENT_DRAFT_LIMITS.nodes) throw new RangeError("Draft exceeds its bounded node count.");
    if (typeof value === "number" && !Number.isFinite(value)) throw new RangeError("Draft numbers must be finite.");
    if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) throw new RangeError("Draft must contain JSON values only.");
    if (typeof value === "string" && value.length > PLACEMENT_DRAFT_LIMITS.bytes) throw new RangeError("Draft string exceeds its bounded length.");
    return value;
  });
  if (typeof encoded !== "string" || new TextEncoder().encode(encoded).byteLength > PLACEMENT_DRAFT_LIMITS.bytes) throw new RangeError("Draft exceeds its bounded byte size.");
  return encoded;
}

/**
 * Transient editing transaction. Invalid geometry remains an editable draft; only a valid
 * explicit placement replaces the committed train/topology. No native document is written.
 */
export class TrackPlacementDraft {
  private encoded: string;
  private draftRevision = 0;
  private currentPreview: TrackDraftPreview;
  private readonly envelope: ClearanceEnvelope;
  private placement: RoutedConsist | null = null;

  constructor(input: unknown, envelope: ClearanceEnvelope) {
    if (!validClearanceEnvelope(envelope)) throw new RangeError("Choose a supported vehicle clearance profile.");
    this.envelope = Object.freeze({ ...envelope });
    this.encoded = encodeDraft(input);
    this.currentPreview = previewTrackDraft(JSON.parse(this.encoded), this.envelope);
  }

  get revision(): number { return this.draftRevision; }
  get preview(): TrackDraftPreview { return this.currentPreview; }
  get activeTrain(): RoutedConsist | null { return this.placement; }
  snapshot(): unknown { return JSON.parse(this.encoded) as unknown; }

  replace(input: unknown, expectedRevision: number): DraftEditResult {
    const fail = (code: string, message: string): DraftEditResult => ({ ok: false, revision: this.draftRevision, code, message, preview: this.currentPreview });
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== this.draftRevision) return fail("stale-draft", "The draft changed. Use its current revision before replacing it.");
    if (!Number.isSafeInteger(this.draftRevision + 1)) return fail("revision-limit", "The draft revision limit was reached.");
    let encoded: string;
    try { encoded = encodeDraft(input); } catch { return fail("invalid-draft-data", "Keep the draft within the supported JSON size and numeric limits."); }
    const preview = previewTrackDraft(JSON.parse(encoded), this.envelope);
    this.encoded = encoded; this.currentPreview = preview; this.draftRevision++;
    return { ok: true, revision: this.draftRevision, code: "draft-retained", message: preview.readyForPlacement ? "Draft retained and ready for train placement." : "Draft retained for editing. Resolve its highlighted conflicts before placing a train.", preview };
  }

  placeTrain(input: unknown, expectedRevision: number, mode: "edit" | "operate"): TrainPlacementResult {
    const fail = (code: string, message: string, diagnostics: readonly PlacementDiagnostic[] = []): TrainPlacementResult => ({ ok: false, code, message, diagnostics, revision: this.draftRevision });
    if (mode !== "edit") return fail("editing-required", "Park the train and enter edit mode before replacing its placement.");
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== this.draftRevision) return fail("stale-draft", "The draft changed. Review the current preview before placing the train.");
    // Revalidate the detached candidate at the transaction boundary; a preview is never authority.
    const preview = previewTrackDraft(JSON.parse(this.encoded), this.envelope);
    if (!preview.readyForPlacement || !preview.topology) return fail("unsafe-placement", "Keep editing this draft; its track is not yet safe for train placement.", preview.diagnostics);
    const placed = RoutedConsist.place(preview.topology, input);
    if (!placed.ok) {
      const edgeId = record(input) && record(input.rear) && typeof input.rear.edgeId === "string" ? input.rear.edgeId : null;
      const ids = edgeId ? [preview.topology.pieces.find(piece => edgeId === `${piece.id}/forward` || edgeId === `${piece.id}/reverse`)?.id].filter((id): id is string => id !== undefined) : [];
      return fail(placed.code, placed.message, [item(placed.code, ids, placed.message)]);
    }
    this.placement = placed.consist;
    return { ok: true, consist: placed.consist, revision: this.draftRevision };
  }
}
