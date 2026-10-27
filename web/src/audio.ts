/** Original synthesized whistle. User gesture only; no downloads, recorded samples or microphone. */
export class RailwayAudio {
  private context: AudioContext | null = null;
  private lastWhistle = -Infinity;
  private disposed = false;
  async whistle(): Promise<boolean> {
    if (this.disposed) return false;
    try {
      this.context ??= new AudioContext();
      const context = this.context;
      if (context.state === "suspended") await context.resume();
      if (context.state !== "running" || context.currentTime - this.lastWhistle < 0.8) return false;
      const now = context.currentTime;
      this.lastWhistle = now;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.075, now + 0.06);
      envelope.gain.setValueAtTime(0.065, now + 0.48);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      envelope.connect(context.destination);
      let voices = 3;
      for (const frequency of [610, 915, 1220]) {
        const tone = context.createOscillator();
        tone.type = "sine";
        tone.frequency.setValueAtTime(frequency * 0.96, now);
        tone.frequency.linearRampToValueAtTime(frequency, now + 0.08);
        tone.connect(envelope); tone.start(now); tone.stop(now + 0.9);
        tone.onended = () => { tone.disconnect(); voices -= 1; if (voices === 0) envelope.disconnect(); };
      }
      return true;
    } catch { return false; }
  }
  pause(): void { if (this.context?.state === "running") void this.context.suspend().catch(() => undefined); }
  dispose(): void { this.disposed = true; if (this.context) void this.context.close().catch(() => undefined); this.context = null; }
}
