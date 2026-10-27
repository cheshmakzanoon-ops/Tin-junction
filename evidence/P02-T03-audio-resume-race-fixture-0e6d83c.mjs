import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const repository = '/workspace/scratch/64c8551df0cd/Tin-junction';
const commit = '0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406';
const sourcePath = 'web/src/audio.ts';
const source = execFileSync('git', ['show', `${commit}:${sourcePath}`], { cwd: repository });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(source), '9df6cfbb47875ad491e76e5ef7725f463cf9a7153b7897c5e43732bedd21e2c1');
const require = createRequire(`${repository}/package.json`);
const esbuild = require('esbuild');
const transformed = esbuild.transformSync(source.toString('utf8'), {
  loader: 'ts', format: 'esm', target: 'es2022', sourcefile: sourcePath,
}).code;

// Inert nodes: these record the real module's calls and never produce sound.
const calls = [];
const contexts = [];
class Parameter {
  constructor(name) { this.name = name; }
  setValueAtTime(value, time) { calls.push({ op: 'setValueAtTime', parameter: this.name, value, time }); return this; }
  linearRampToValueAtTime(value, time) { calls.push({ op: 'linearRampToValueAtTime', parameter: this.name, value, time }); return this; }
  exponentialRampToValueAtTime(value, time) { calls.push({ op: 'exponentialRampToValueAtTime', parameter: this.name, value, time }); return this; }
}
class Node {
  constructor(name) { this.name = name; }
  connect(destination) { calls.push({ op: 'connect', source: this.name, destination: destination.name }); return destination; }
  disconnect() { calls.push({ op: 'disconnect', source: this.name }); }
}
class GainNode extends Node {
  constructor() { super('envelope'); this.gain = new Parameter('gain'); }
}
class OscillatorNode extends Node {
  constructor(context, index) { super(`tone-${index}`); this.context = context; this.frequency = new Parameter(`frequency-${index}`); this.onended = null; }
  start(time) { assert.equal(this.context.state, 'running'); this.context.startedVoices += 1; calls.push({ op: 'start', source: this.name, time }); }
  stop(time) { calls.push({ op: 'scheduled-stop', source: this.name, time }); }
}
class ControlledAudioContext {
  constructor() {
    this.exposedState = 'suspended';
    this.currentTime = 0;
    this.destination = new Node('destination');
    this.resumeCalls = 0;
    this.suspendCalls = 0;
    this.startedVoices = 0;
    this.createdVoices = 0;
    this.pendingResume = null;
    contexts.push(this);
    calls.push({ op: 'construct', exposedState: this.state });
  }
  get state() { return this.exposedState; }
  resume() {
    this.resumeCalls += 1;
    assert.equal(this.pendingResume, null);
    calls.push({ op: 'request-resume', exposedState: this.state });
    // The public state remains suspended until the later control-thread result.
    // Completion is held explicitly, with no timer or guessed scheduling delay.
    return new Promise(resolve => { this.pendingResume = resolve; });
  }
  completeResume() {
    const resolve = this.pendingResume;
    assert.ok(resolve);
    this.pendingResume = null;
    this.exposedState = 'running';
    calls.push({ op: 'complete-resume', exposedState: this.state });
    resolve();
  }
  suspend() {
    this.suspendCalls += 1;
    calls.push({ op: 'request-suspend', exposedState: this.state });
    return Promise.resolve().then(() => { this.exposedState = 'suspended'; });
  }
  close() {
    calls.push({ op: 'request-close', exposedState: this.state });
    return Promise.resolve().then(() => { this.exposedState = 'closed'; });
  }
  createGain() { calls.push({ op: 'create-gain' }); return new GainNode(); }
  createOscillator() { this.createdVoices += 1; calls.push({ op: 'create-oscillator', index: this.createdVoices }); return new OscillatorNode(this, this.createdVoices); }
}

const originalAudioContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
let audio;
try {
  Object.defineProperty(globalThis, 'AudioContext', { value: ControlledAudioContext, configurable: true, writable: true });
  const { RailwayAudio } = await import(`data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`);
  audio = new RailwayAudio();
  const pendingWhistle = audio.whistle();
  assert.equal(contexts.length, 1);
  const context = contexts[0];
  assert.equal(context.resumeCalls, 1);
  assert.ok(context.pendingResume);
  assert.equal(context.state, 'suspended');
  assert.equal(context.startedVoices, 0);
  const beforePause = { exposedState: context.state, resumePending: context.pendingResume !== null, startedVoices: context.startedVoices };

  // This is the only discriminating scenario: pause arrives during resume.
  calls.push({ op: 'invoke-real-pause' });
  audio.pause();
  const afterPause = { exposedState: context.state, resumePending: context.pendingResume !== null, suspendCalls: context.suspendCalls, startedVoices: context.startedVoices };
  assert.equal(context.suspendCalls, 0);
  assert.equal(context.startedVoices, 0);

  context.completeResume();
  const whistleResult = await pendingWhistle;
  const afterResume = { exposedState: context.state, whistleResult, suspendCalls: context.suspendCalls, startedVoices: context.startedVoices };
  assert.equal(whistleResult, true);
  assert.equal(context.startedVoices, 3);
  assert.equal(context.suspendCalls, 0);
  process.stdout.write(JSON.stringify({
    record_kind: 'controlled-published-module-scheduling-reproduction-not-playback',
    result: 'race_confirmed',
    tested_commit: commit,
    source: { path: sourcePath, sha256: digest(source) },
    transformation: { tool: 'esbuild.transformSync', version: esbuild.version, loader: 'ts', format: 'esm', target: 'es2022', javascript_sha256: digest(Buffer.from(transformed)) },
    beforePause, afterPause, afterResume,
    invariant: { statement: 'A pause during pending resume must prevent that pending whistle from starting tones.', holds: false },
    calls,
    limitations: ['No actual AudioContext, speakers, native WKWebView, audio session or microphone was used.', 'This proves one controlled API scheduling interleaving in the exact published module, not audible playback or the frequency of the race on a device.', 'No application source, shared build output, repository test or preference was changed.'],
  }, null, 2) + '\n');
} finally {
  audio?.dispose();
  if (originalAudioContext) Object.defineProperty(globalThis, 'AudioContext', originalAudioContext);
  else delete globalThis.AudioContext;
}
