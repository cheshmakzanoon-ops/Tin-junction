# P04-T06 — completed web CI review at d1bfe55

Status: **observed cancelled required check; scoped correction proposed, not rerun by this reviewer**. Reviewed 2026-10-27. No app, test, workflow, scene, shared bundle, or planning-state changes were made for this review.

## Finding

[Workflow 40455394264](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40455394264) tested commit `d1bfe55800a09fc39f7bed0d31e5fc92e3c57571`. Quality job `122027425210` was cancelled with the configured 20-minute job limit while the packaged browser suite was still running. Repository validation, types, unit/tool tests, web build, native-bundle assembly, and browser installation had succeeded. Export job `122027424960` succeeded. These conclusions are preserved from the completed GitHub job records in [observations](P04-T06-web-ci-observations-d1bfe55.json).

The browser step ran from `05:27:59.5312432Z` to cancellation at `05:47:27.2401713Z`: **19 minutes 27.709 seconds**. The log contains 28 completed attempt entries, including two retries: **26 of 28 distinct tests have an observed passing attempt**. The final completed result was the offline-render smoke test at `05:47:23.6469626Z`, only 3.593 seconds before cancellation. The record shows continuing progress; it does not demonstrate a sustained hang. See the [verbatim browser log excerpt](P04-T06-web-ci-browser-log-d1bfe55.txt), which retains the exact contiguous original span, including empty-message lines, without filtering.

The remaining lifecycle/resize and context-loss smoke tests have no completion result. This does not establish whether the next test had started. Geometry capture was explicitly skipped after cancellation. There is no complete suite summary or HTML report in the uploaded archive, so this run cannot establish a passing browser gate.

## Exact observed first-attempt failures

Both retained `test.trace` streams report `Test timeout of 60000ms exceeded.` Every recorded functional assertion completed successfully before the final screenshot. Neither trace reports a failed restore, pixel, lifecycle, persistence, or no-error assertion. The screenshots crossed the total-test deadline; both tests then passed on their existing single retry.

| Tested Git source and exact test name | Last assertion completed | Final capture interval | Capture duration | Retry duration reported by console |
| --- | ---: | ---: | ---: | ---: |
| `tests/web/browser/railway.spec.ts:54` — `name, light and reopen a saved layout with the train stopped` | 46.595062 s | 46.596388–60.170928 s | 13.574540 s | 58.0 s |
| `tests/web/browser/scene-recovery.spec.ts:30` — `restoring a context also restores generated lighting, not just frame delivery` | 53.178135 s | 53.179063–62.449200 s | 9.270137 s | 1.0 min, rounded by reporter |

Offsets are measured from each trace's first `before` event and include fixture setup. The first-attempt console duration is `1.1m` for each test; the console does not supply exact test durations. The observations JSON retains every attempt's exact timestamp and reported duration, raw final assertion/capture/timeout events, trace hashes, and tested Git source hashes. Console locations `railway.spec.ts:110` and `scene-recovery.spec.ts:31` are retained as **reported metadata**; the source references above come from `git show` of the tested commit.

## Bounded correction for coordinator review

1. Give **only these two tests** a 90,000 ms total deadline and their captures explicit 30,000 ms deadlines. At the observed final-capture start times, a complete 30-second capture fits within 90 seconds: 76.596 s for the railway test and 83.179 s for recovery. The traces show no need to change action/readiness deadlines or functional assertions.
2. Increase **only the quality job** from 20 to 30 minutes. The observed suite had already consumed 19.462 minutes through 26 distinct completed tests. Ten additional job minutes provide a bounded next-run allowance for the remaining two smoke tests, capture, reporting, and ordinary runner variation. Geometry capture did not execute here, so its duration and completion remain unmeasured in this run.
3. Preserve all 28 tests, the single CI retry, one worker, software renderer, full scene, captures, and all persistence/restoration/pixel assertions. A fresh successful full run must establish the complete test result, geometry-capture success, and diagnostic publication. These proposed limits are not completion or performance evidence.

## Artifact identity and preservation

The browser diagnostic upload succeeded despite cancellation: artifact `12713485734`, 30 entries, 10,375,051 bytes. Its downloaded SHA-256 matched GitHub's advertised digest:

```text
85bf5dd5540804a408e5a8732ab1ce8c79f265ea4085e77fa65ee0c298703852
```

The observations preserve the archive inventory and exact manifest content. The manifest is ordinary mode (`assetOriginProbe: false`) and identifies `bundle.js` as `e1936e606f3fb93e309446b5ae210672fc3e916b1682db1c72547cd6ba5075eb`. This is the workflow's preserved packaging identity; it is not installed-device resource verification. Large screenshots and trace archives remain in the [GitHub artifact](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40455394264/artifacts/12713485734), which expires on 2026-11-10 according to its retrieved metadata. Compact raw timeout events and hashes are retained in this repository review.

Review scope: completed log/artifact retrieval, hash comparison, and read-only source/trace analysis. No browser suite, build, or application code was executed by this reviewer.
