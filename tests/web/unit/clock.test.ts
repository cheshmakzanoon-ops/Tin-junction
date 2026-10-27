import { describe, expect, it } from "vitest";
import { FixedStepClock, RenderLifecycle, resolutionScale } from "../../../web/src/clock";

describe("fixed-step infrastructure", () => {
  it("integrates equal wall time independently of render frequency", () => {
    const sample = (hz: number) => { const clock = new FixedStepClock(); let steps = 0; for (let frame = 0; frame <= hz; frame++) steps += clock.advance(frame * 1000 / hz).steps; return steps; };
    expect(sample(30)).toBe(60);
    expect(sample(60)).toBe(60);
    expect(sample(120)).toBe(60);
  });
  it("caps background catch-up and resets on pause", () => {
    const clock = new FixedStepClock();
    clock.advance(0);
    expect(clock.advance(30_000).steps).toBe(8);
    clock.reset();
    expect(clock.advance(100_000).steps).toBe(0);
  });
  it("does not count elapsed time twice after a reversed timestamp", () => {
    const clock = new FixedStepClock();
    expect(clock.advance(1000).steps).toBe(0);
    expect(clock.advance(1000 + 1000 / 60).steps).toBe(1);
    expect(clock.advance(1000).steps).toBe(0);
    expect(clock.advance(1000 + 2000 / 60).steps).toBe(1);
  });
  it("rejects invalid configuration and tolerates invalid timestamps", () => {
    expect(() => new FixedStepClock(0)).toThrow();
    expect(() => new FixedStepClock(1 / 60, 0)).toThrow();
    expect(new FixedStepClock().advance(Number.NaN).steps).toBe(0);
  });
});

describe("independent lifecycle gates", () => {
  it("does not resume while a different pause reason remains", () => {
    const state = new RenderLifecycle();
    expect(state.running).toBe(true);
    state.nativeActive = false;
    state.documentVisible = false;
    state.nativeActive = true;
    expect(state.running).toBe(false);
    state.documentVisible = true;
    state.contextAvailable = false;
    expect(state.running).toBe(false);
    state.contextAvailable = true;
    state.disposed = true;
    expect(state.running).toBe(false);
  });
});

describe("bounded render resolution", () => {
  it("never blindly renders the full device ratio", () => {
    expect(resolutionScale(1000, 1000, 3)).toBeCloseTo(Math.sqrt(2));
    expect(resolutionScale(800, 600, 1)).toBe(1);
    expect(resolutionScale(4000, 4000, 3)).toBeLessThan(1);
    expect(resolutionScale(0, 600, 3)).toBe(1);
  });
});
