import { ovalLength, wrapDistance } from "./geometry";
import { createStarterLayout } from "./layout";
import { ACCELERATION, BRAKE_DECELERATION, HISTORY_LIMIT, MAX_COUNTER, MAX_SPEED, REPLAY_LIMIT, STEP_SECONDS } from "./types";
import type { CommandEnvelope, CommandResult, LayoutDocument, ModelCommand, OperatingMode, ReplayEntry, ReplayLog } from "./types";
import { cloneLayout, counter, exactKeys, finiteRange, parseLayoutDocument, plainObject, sceneryShapeError, stateDigest, validId, validName } from "./validation";

type EditableState = Pick<LayoutDocument, "name" | "track" | "scenery" | "environment">;
interface HistoryEntry { before: EditableState; after: EditableState }
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const editable = (document: LayoutDocument): EditableState => copy({ name: document.name, track: document.track, scenery: document.scenery, environment: document.environment });

export function commandShapeError(value: unknown): string | null {
  if (!plainObject(value) || typeof value.type !== "string") return "Command must have a known type.";
  switch (value.type) {
    case "stop": case "reverse": case "undo": case "redo":
      return exactKeys(value, ["type"]) ? null : "Command has unknown fields.";
    case "throttle":
      return exactKeys(value, ["type", "value"]) && finiteRange(value.value, 0, 1) ? null : "Throttle must be between zero and one.";
    case "mode":
      return exactKeys(value, ["type", "value"]) && (value.value === "operate" || value.value === "edit") ? null : "Unknown operating mode.";
    case "environment":
      return exactKeys(value, ["type", "value"]) && (value.value === "day" || value.value === "dusk" || value.value === "night") ? null : "Unknown lighting preset.";
    case "rename":
      return exactKeys(value, ["type", "value"]) && validName(value.value) ? null : "Name must contain 1–80 characters without control characters.";
    case "scenery.add":
      return exactKeys(value, ["type", "item"]) ? sceneryShapeError(value.item) : "Scenery command has unknown fields.";
    case "scenery.move":
      return exactKeys(value, ["type", "id", "x", "z"], ["rotation"]) && validId(value.id)
        && finiteRange(value.x, -0.4, 0.4) && finiteRange(value.z, -0.25, 0.25)
        && (value.rotation === undefined || finiteRange(value.rotation, -2 * Math.PI, 2 * Math.PI)) ? null : "Invalid scenery transform.";
    case "scenery.remove":
      return exactKeys(value, ["type", "id"]) && validId(value.id) ? null : "Scenery command needs a stable ID.";
    case "track":
      return exactKeys(value, ["type", "value"]) && plainObject(value.value) && exactKeys(value.value, ["kind", "straightLength", "radius"])
        && value.value.kind === "oval" && finiteRange(value.value.straightLength, 0.1, 0.5) && finiteRange(value.value.radius, 0.10, 0.2) ? null : "Invalid oval dimensions.";
    default: return "Unknown model command.";
  }
}

/** Renderer-independent operating-loop model. All changes enter through validated commands. */
export class RailwayModel {
  private document: LayoutDocument;
  private readonly initial: LayoutDocument;
  private operatingMode: OperatingMode = "operate";
  private undoHistory: HistoryEntry[] = [];
  private redoHistory: HistoryEntry[] = [];
  private sequence = 0;
  private records: ReplayEntry[] = [];
  private droppedRecords = 0;
  private recentRequests = new Map<string, { key: string; result: CommandResult }>();
  private diagnosticMessages: string[] = [];

  constructor(document: LayoutDocument = createStarterLayout(), options: { restoreStopped?: boolean } = {}) {
    const parsed = parseLayoutDocument(document);
    if (!parsed.ok) throw new Error(parsed.error);
    this.document = parsed.value;
    if (options.restoreStopped !== false) { this.document.train.speed = 0; this.document.train.throttle = 0; }
    this.initial = cloneLayout(this.document);
  }

  /** Read-only view; use snapshot() when retaining a detached document for storage. */
  get state(): Readonly<LayoutDocument> { return this.document; }
  get mode(): OperatingMode { return this.operatingMode; }
  get canUndo(): boolean { return this.operatingMode === "edit" && this.undoHistory.length > 0; }
  get canRedo(): boolean { return this.operatingMode === "edit" && this.redoHistory.length > 0; }
  get historyLength(): number { return this.undoHistory.length; }
  get replayLength(): number { return this.records.length; }
  get nextSequence(): number { return this.sequence + 1; }
  get diagnostics(): readonly string[] { return [...this.diagnosticMessages]; }
  snapshot(): LayoutDocument { return cloneLayout(this.document); }
  digest(): string { return stateDigest(this.document); }
  setMode(value: OperatingMode): CommandResult { return this.apply({ type: "mode", value }); }
  undo(): CommandResult { return this.apply({ type: "undo" }); }
  redo(): CommandResult { return this.apply({ type: "redo" }); }

  private result(ok: boolean, changed: boolean, code: string, message: string): CommandResult {
    return { ok, changed, code, message, revision: this.document.revision };
  }
  private diagnostic(message: string): void {
    this.diagnosticMessages.push(message);
    if (this.diagnosticMessages.length > 32) this.diagnosticMessages.shift();
  }

  /** Advances integer 60 Hz ticks. Hidden, suspended, or paused callers must not call this method. */
  step(ticks = 1): void {
    if (!Number.isInteger(ticks) || ticks < 0 || ticks > 360_000) throw new RangeError("Advance requires 0–360000 fixed ticks.");
    if (this.operatingMode === "edit" || ticks === 0) return;
    if (ticks > MAX_COUNTER - this.document.tick) throw new RangeError("Simulation tick limit reached.");
    const length = ovalLength(this.document.track);
    for (let index = 0; index < ticks; index++) {
      const train = this.document.train, target = train.throttle * MAX_SPEED;
      const acceleration = target > train.speed ? ACCELERATION : BRAKE_DECELERATION;
      const difference = target - train.speed, timeToTarget = Math.abs(difference) / acceleration;
      let speed: number, traveled: number;
      if (timeToTarget >= STEP_SECONDS) {
        speed = train.speed + Math.sign(difference) * acceleration * STEP_SECONDS;
        traveled = (train.speed + speed) * STEP_SECONDS / 2;
      } else {
        speed = target;
        traveled = (train.speed + target) * timeToTarget / 2 + target * (STEP_SECONDS - timeToTarget);
      }
      speed = Math.max(0, Math.min(MAX_SPEED, speed));
      const signedTravel = traveled * train.direction;
      const wheelTravel = train.wheelTravel + signedTravel;
      if (!Number.isFinite(wheelTravel) || Math.abs(wheelTravel) > 1e9) {
        this.document.train = { ...train, speed: 0, throttle: 0 };
        this.diagnostic("Wheel travel limit reached; train stopped without moving.");
      } else {
        this.document.train = { ...train, speed, distance: wrapDistance(train.distance + signedTravel, length), wheelTravel };
      }
      this.document.tick++;
    }
  }

  apply(command: ModelCommand, expectedRevision = this.document.revision): CommandResult {
    return this.dispatch({ id: `local-${this.nextSequence}`, sequence: this.nextSequence, expectedRevision, command });
  }

  /** Ordered session-local envelopes are useful for replay and protect against duplicate reverse/edit commands. */
  dispatch(envelope: CommandEnvelope): CommandResult {
    if (!plainObject(envelope) || !exactKeys(envelope, ["id", "sequence", "expectedRevision", "command"])
      || !validId(envelope.id) || !counter(envelope.sequence) || envelope.sequence === 0 || !counter(envelope.expectedRevision)) {
      return this.result(false, false, "invalid_envelope", "Invalid command identity or sequence.");
    }
    let key: string;
    try { key = JSON.stringify(envelope); } catch { return this.result(false, false, "invalid_command", "Command is not valid JSON."); }
    if (key.length > 4096) return this.result(false, false, "invalid_command", "Command exceeds the bounded input limit.");
    const cached = this.recentRequests.get(envelope.id);
    if (cached) return cached.key === key ? { ...cached.result, changed: false } : this.result(false, false, "command_conflict", "A command ID was reused with different content.");
    if (envelope.sequence !== this.sequence + 1) return this.result(false, false, "stale_sequence", "Command sequence is stale or out of order.");
    const shapeError = commandShapeError(envelope.command);
    if (shapeError) return this.result(false, false, "invalid_command", shapeError);
    const beforeTick = this.document.tick;
    const result = envelope.expectedRevision !== this.document.revision
      ? this.result(false, false, "stale_revision", "The layout changed. Try the command against its current revision.")
      : this.perform(envelope.command);
    this.sequence = envelope.sequence;
    this.recentRequests.set(envelope.id, { key, result: { ...result } });
    while (this.recentRequests.size > REPLAY_LIMIT) this.recentRequests.delete(this.recentRequests.keys().next().value!);
    this.records.push({ ...copy(envelope), tick: beforeTick, resultCode: result.code });
    if (this.records.length > REPLAY_LIMIT) { this.records.shift(); this.droppedRecords++; }
    if (!result.ok) this.diagnostic(`${result.code}: ${result.message}`);
    return result;
  }

  private perform(command: ModelCommand): CommandResult {
    switch (command.type) {
      case "mode": {
        const changed = this.operatingMode !== command.value;
        this.operatingMode = command.value;
        if (command.value === "edit") this.document.train = { ...this.document.train, speed: 0, throttle: 0 };
        return this.result(true, changed, "mode", command.value === "edit" ? "Train parked. Arrange your miniature world." : "Ready to run.");
      }
      case "throttle": {
        if (this.operatingMode !== "operate" && command.value > 0) return this.result(false, false, "editing", "Return to Run before moving the train.");
        const changed = command.value !== this.document.train.throttle;
        this.document.train = { ...this.document.train, throttle: command.value };
        return this.result(true, changed, "throttle", command.value > 0 ? "Throttle set." : "Braking to a stop.");
      }
      case "stop": {
        const changed = this.document.train.throttle !== 0;
        this.document.train = { ...this.document.train, throttle: 0 };
        return this.result(true, changed, "stop", this.document.train.speed > 0 ? "Braking to a stop." : "Train stopped.");
      }
      case "reverse": {
        if (this.document.train.speed > 1e-8 || this.document.train.throttle !== 0) return this.result(false, false, "moving", "Stop the train before changing direction.");
        this.document.train = { ...this.document.train, direction: this.document.train.direction === 1 ? -1 : 1 };
        return this.result(true, true, "reverse", this.document.train.direction === 1 ? "Forward selected." : "Reverse selected.");
      }
      case "undo": return this.restoreHistory("undo");
      case "redo": return this.restoreHistory("redo");
      default: return this.edit(command);
    }
  }

  private edit(command: Exclude<ModelCommand, { type: "mode" | "throttle" | "stop" | "reverse" | "undo" | "redo" }>): CommandResult {
    if (command.type !== "environment" && command.type !== "rename" && this.operatingMode !== "edit") return this.result(false, false, "editing_required", "Park the train in Arrange before changing the layout.");
    if (this.document.revision >= MAX_COUNTER) return this.result(false, false, "revision_limit", "Layout revision limit reached.");
    const candidate = cloneLayout(this.document), before = editable(this.document);
    switch (command.type) {
      case "scenery.add":
        if (candidate.scenery.some((item) => item.id === command.item.id)) return this.result(false, false, "duplicate_id", "An object already uses this ID.");
        candidate.scenery.push({ ...command.item });
        break;
      case "scenery.remove": {
        const index = candidate.scenery.findIndex((item) => item.id === command.id);
        if (index < 0) return this.result(false, false, "missing_object", "That scenery object no longer exists.");
        candidate.scenery.splice(index, 1);
        break;
      }
      case "scenery.move": {
        const item = candidate.scenery.find((item) => item.id === command.id);
        if (!item) return this.result(false, false, "missing_object", "That scenery object no longer exists.");
        item.x = command.x; item.z = command.z;
        if (command.rotation !== undefined) item.rotation = command.rotation;
        break;
      }
      case "environment": candidate.environment.timeOfDay = command.value; break;
      case "rename": candidate.name = command.value; break;
      case "track": {
        const oldLength = ovalLength(candidate.track);
        candidate.track = { ...command.value };
        let newLength: number;
        try { newLength = ovalLength(candidate.track); } catch { return this.result(false, false, "invalid_layout", "Track dimensions do not fit the case."); }
        candidate.train.distance = candidate.train.distance / oldLength * newLength;
        break;
      }
    }
    const after = editable(candidate);
    if (JSON.stringify(before) === JSON.stringify(after)) return this.result(true, false, "unchanged", "No layout change.");
    candidate.revision++;
    const parsed = parseLayoutDocument(candidate);
    if (!parsed.ok) return this.result(false, false, "invalid_layout", parsed.error);
    this.document = parsed.value;
    this.undoHistory.push({ before, after });
    if (this.undoHistory.length > HISTORY_LIMIT) this.undoHistory.shift();
    this.redoHistory = [];
    return this.result(true, true, "edited", command.type === "environment" ? "Lighting changed." : "Layout updated.");
  }

  private restoreHistory(direction: "undo" | "redo"): CommandResult {
    if (this.operatingMode !== "edit") return this.result(false, false, "editing_required", "Park the train in Arrange to undo or redo.");
    const source = direction === "undo" ? this.undoHistory : this.redoHistory;
    const target = direction === "undo" ? this.redoHistory : this.undoHistory;
    const entry = source[source.length - 1];
    if (!entry) return this.result(false, false, "empty_history", `Nothing to ${direction}.`);
    if (this.document.revision >= MAX_COUNTER) return this.result(false, false, "revision_limit", "Layout revision limit reached.");
    const replacement = copy(direction === "undo" ? entry.before : entry.after);
    const candidate = cloneLayout(this.document), oldLength = ovalLength(candidate.track);
    Object.assign(candidate, replacement);
    candidate.train.distance = candidate.train.distance / oldLength * ovalLength(candidate.track);
    candidate.revision++;
    const parsed = parseLayoutDocument(candidate);
    if (!parsed.ok) return this.result(false, false, "invalid_history", parsed.error);
    source.pop(); target.push(entry);
    if (target.length > HISTORY_LIMIT) target.shift();
    this.document = parsed.value;
    return this.result(true, true, direction, direction === "undo" ? "Change undone." : "Change restored.");
  }

  exportReplay(): ReplayLog {
    return { initial: cloneLayout(this.initial), entries: copy(this.records), finalTick: this.document.tick, finalDigest: this.digest(), complete: this.droppedRecords === 0 };
  }

  /** Explicit diagnostic probe, never a per-frame full-document walk. */
  assertInvariants(): void {
    const parsed = parseLayoutDocument(this.document);
    if (!parsed.ok) throw new Error(`Invariant failed at tick ${this.document.tick}, seed ${this.document.seed}: ${parsed.error}`);
    if (this.undoHistory.length > HISTORY_LIMIT || this.redoHistory.length > HISTORY_LIMIT || this.records.length > REPLAY_LIMIT || this.diagnosticMessages.length > 32) throw new Error("Model diagnostic/history bound exceeded.");
  }
}

/** Reproduces an untruncated recorded command stream, rejecting altered order or outcomes. */
export function replayCommands(log: ReplayLog): RailwayModel {
  if (!log.complete || log.entries.length > REPLAY_LIMIT) throw new Error("Replay log was truncated; reproduce from its seed and a fresh recording.");
  const model = new RailwayModel(log.initial, { restoreStopped: false });
  for (const record of log.entries) {
    if (!counter(record.tick) || record.tick < model.state.tick || record.tick - model.state.tick > 360_000) throw new Error("Replay tick is out of range or out of order.");
    model.step(record.tick - model.state.tick);
    if (model.state.tick !== record.tick) throw new Error("Replay advances time while editing.");
    const result = model.dispatch({ id: record.id, sequence: record.sequence, expectedRevision: record.expectedRevision, command: copy(record.command) });
    if (result.code !== record.resultCode) throw new Error(`Replay diverged at command ${record.id}: ${result.code}.`);
  }
  if (!counter(log.finalTick) || log.finalTick < model.state.tick || log.finalTick - model.state.tick > 360_000) throw new Error("Replay final tick is out of range.");
  model.step(log.finalTick - model.state.tick);
  if (model.state.tick !== log.finalTick || model.digest() !== log.finalDigest) throw new Error("Replay final state differs from its recorded digest.");
  return model;
}
