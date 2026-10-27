/** Bounded fixed-step accumulator. This is infrastructure, not a train physics model. */
export class FixedStepClock {
  private previous: number | null = null;
  private accumulator = 0;
  constructor(readonly stepSeconds = 1 / 60, readonly maxSteps = 8) {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0 || !Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new Error("Invalid fixed step configuration");
    }
  }
  reset(): void { this.previous = null; this.accumulator = 0; }
  advance(timestampMilliseconds: number): { steps: number; alpha: number } {
    if (!Number.isFinite(timestampMilliseconds)) return { steps: 0, alpha: 0 };
    if (this.previous === null) { this.previous = timestampMilliseconds; return { steps: 0, alpha: 0 }; }
    if (timestampMilliseconds < this.previous) return { steps: 0, alpha: Math.min(1, this.accumulator / this.stepSeconds) };
    const elapsed = Math.max(0, (timestampMilliseconds - this.previous) / 1000);
    this.previous = timestampMilliseconds;
    this.accumulator += Math.min(elapsed, this.stepSeconds * this.maxSteps);
    const steps = Math.min(this.maxSteps, Math.floor((this.accumulator + 1e-12) / this.stepSeconds));
    this.accumulator = Math.max(0, this.accumulator - steps * this.stepSeconds);
    return { steps, alpha: Math.min(1, this.accumulator / this.stepSeconds) };
  }
}

export class RenderLifecycle {
  nativeActive = true;
  documentVisible = true;
  contextAvailable = true;
  disposed = false;
  get running(): boolean { return this.nativeActive && this.documentVisible && this.contextAvailable && !this.disposed; }
}

export function resolutionScale(width: number, height: number, requestedRatio: number, maxPixels = 2_000_000): number {
  if (![width, height, requestedRatio, maxPixels].every(Number.isFinite) || width <= 0 || height <= 0 || requestedRatio <= 0 || maxPixels <= 0) return 1;
  return Math.min(requestedRatio, 2, Math.sqrt(maxPixels / (width * height)));
}
