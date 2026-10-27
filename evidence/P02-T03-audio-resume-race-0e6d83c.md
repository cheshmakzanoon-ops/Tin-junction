# Pending whistle can outlive a pause request

**Observed defect; unfixed.** This is preparation for the next eligible sound/lifecycle work, not task acceptance or device playback evidence.

The exact published module at `0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`, `web/src/audio.ts`, has SHA-256 `9df6cfbb47875ad491e76e5ef7725f463cf9a7153b7897c5e43732bedd21e2c1`. A controlled inert `AudioContext` held the promise returned by `resume()` while its exposed state remained suspended. The fixture invoked the module's real `pause()`, then completed resume and awaited the original whistle.

| Boundary | Exposed state | Suspend calls | Started voices |
| --- | --- | ---: | ---: |
| Whistle waiting on resume | suspended | 0 | 0 |
| After real pause | suspended | 0 | 0 |
| After resume completes | running | 0 | 3 |

The original whistle returned `true`. The invariant that a pause must prevent that pending whistle from starting tones therefore fails. The module tests only the exposed state before suspending and does not recheck pause intent after the awaited resume.

## Retained reproduction

The [original fixture](P02-T03-audio-resume-race-fixture-0e6d83c.mjs) is retained byte for byte, including its original repository path. It reads the immutable Git source, verifies its hash and removes TypeScript syntax with the repository's pinned `esbuild` **0.28.2**, without rewriting the module's logic. The transformed JavaScript hash is `91d28dfadb717ea764447e32d154fca703a631d535d2702fd597c4e5b8b0381b`.

The executed command was `node /tmp/tin-audio-resume-race-0e6d83c/reproduce.mjs > /tmp/tin-audio-resume-race-0e6d83c/result.json`. It exited **0 because its assertions confirmed the defect**. That exit status is not application correctness.

- Fixture: **6,582 bytes**, SHA-256 `b543800f586a6bbf910f52c9325925283d5b79e2e9add50238d46bba6bd0eac4`.
- [Complete observed result](P02-T03-audio-resume-race-result-0e6d83c.json): **4,007 bytes**, SHA-256 `832fc2ad12a6d1c1b7f238bf1af84effceb764143bdaa2e9ff2e5d9af5166f75`.

The nodes are inert spies. No actual AudioContext, sound output, WKWebView, native audio session or microphone was used. This establishes one permitted scheduling interleaving in the exact module; it does not measure how often the race occurs on a device or whether sound is audible after a native interruption. The fixture restores the replaced global and disposes the test instance. No application source, shared build output, preference or repository test was modified by the reproduction.

## Required repair behavior

Use explicit active and sound-enabled intent, plus a request generation invalidated by pause, mute and disposal. After awaiting resume, check that generation, current context identity and intent before creating tones or consuming the whistle cooldown. A pause must account for a pending resume even while the exposed state remains suspended. Track and clean up active voices/envelopes so a later resume cannot revive a whistle suspended mid-envelope. Enabling sound or returning active should not itself start audio without a user gesture.

Verify those transitions with deterministic scheduling regressions, then exercise the real packaged audio path and native lifecycle. Keep this source-bound failure record intact after the fix; new evidence must identify the repaired source. P02-T01 remains a dependency gate, and this record neither starts nor completes P02-T03.
