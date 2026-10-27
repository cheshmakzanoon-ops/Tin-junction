# Task evidence and acceptance

**Established:** 2026-10-26, America/Halifax.  
**Purpose:** distinguish proposed, implemented, tested and approved work with records that can be audited.

The completion command checks the structure and applicability of evidence. It cannot make an unperformed test real, judge all aspects of photorealism or grant an owner's approval. Agents remain responsible for truthful records.

## 1. Claims require the right kind of evidence

| Claim | Suitable evidence | Does not establish the claim |
| --- | --- | --- |
| Repository plan and task graph are consistent | Validator output, schema/dependency tests, inspected links | A large number of Markdown pages |
| Simulation behavior is correct | Deterministic unit/property/replay tests covering stated invariants | A train moving once in a demo |
| Native bridge works | Integration tests in actual WKWebView with version, origin and lifecycle recorded | A TypeScript unit test alone |
| iOS shell builds | Actual Xcode build/test result for exact revision and SDK | A workflow file that has not executed |
| Duo public API exists | Official documentation plus matching SDK/compile probe | A search snippet, rumor or invented identifier |
| Fold behavior works | Actual Duo interaction capture and reproducible steps | A debug slider or synthetic window resize |
| Graphics meet the art target | Repeatable reference-matched captures, rubric and required review | PBR enabled, an image-generation mockup or a flattering isolated screenshot |
| Frame-time/thermal budget is met | Sustained measurements on actual target hardware with workload and context | Simulator FPS or desktop browser FPS |
| Layouts survive upgrades | Versioned migration/recovery tests including corruption/failure fixtures | A successful save/load of one current-format file |
| Release is authorized | Specific recorded owner decision for the actual build and action | An agent's recommendation to release |

Evidence may support only part of a task. Keep that task in progress/review until the remaining requirements are satisfied.

## 2. Manifest locations and identity

Copy [the JSON template](../../templates/EVIDENCE.json) into `evidence/<task-id>/<descriptive-id>.json` and replace every placeholder. The template deliberately contains `not_run` and unusable placeholders: it is not valid completion evidence.

Use stable evidence IDs and descriptive filenames, for example a task-specific graph-replay or simulator-integration record. Do not overwrite failed evidence with a passing record. Keep a new record showing the fix and link the prior failure in the handoff.

Recommended directory structure:

```text
evidence/
  PXX-TYY/
    graph-replay-01.json
    graph-replay-02.json
    graph-replay-02.txt
```

Large captures and logs belong in artifacts, not ordinary Git. Keep enough compact metadata in Git to locate, identify and interpret them after the current chat ends.

## 3. Manifest fields

| Field | Meaning and requirement |
| --- | --- |
| `schema_version` | Schema version, initially `1` |
| `evidence_id` | Stable unique identifier for this evidence record |
| `task_id` | Actual roadmap task ID; never an invented or example ID |
| `kind` | One of the evidence kinds below |
| `result` | Actual observation; submitted/active acceptance records require `passed`, not `not_run`, `pending`, `failed` or `blocked`; failed records remain supporting history rather than active passing evidence |
| `tested_commit` | Full SHA of an already existing implementation commit |
| `recorded_at` | Actual ISO-8601 timestamp including offset or `Z` |
| `source_files` | Relevant repository-relative inputs with actual SHA-256 hashes; nonempty for `repository_validation`, `unit_test` and `integration_test`; include applicable code inputs for other code-bearing evidence too |
| `commands` | Actual commands, observed exit codes and output paths/HTTPS result URLs; passing command evidence has exit code `0`, and every `output_path` must exactly match an entry in `artifacts` |
| `artifacts` | Actual repository-relative artifact paths or verified HTTPS URLs; local artifacts require actual SHA-256 hashes |
| `acceptance` | Every acceptance criterion claimed, with exact criterion ID and references to supporting commands/artifacts |
| `reviewed_by` | Actual reviewer identity/role when review is performed; otherwise `null` |
| `decision_reference` | Actual owner decision reference when owner approval is required; otherwise `null` |
| `device` | Required context for `device_test`; otherwise `null` unless relevant |
| `limitations` | What this evidence cannot establish, omitted checks and known constraints |

Use repository-relative paths. Do not commit absolute home directories, credentials, private layout filenames, personal device serial numbers or tester-identifying material. A path traversal or an artifact outside the repository cannot become a valid local evidence path merely by being written in JSON.

Each `commands[].output_path` must exactly equal an `artifacts[].path` in the same manifest. For a local output, that artifact needs the SHA-256 of the actual captured bytes; the validator checks this hash even for historical evidence. A command log cannot bypass integrity checking by appearing only in `commands`. For HTTPS outputs, list the same verified URL in `artifacts`; a local digest is not mandatory for remote artifacts, and a URL alone is not proof that the command passed.

The JSON template is a starting record, not a license to add arbitrary fields instead of required facts. Follow the actual validator/schema and keep the template aligned when a schema changes.

## 4. Evidence kinds

### `repository_validation`

For repository-control requirements such as graph integrity, command tests, link consistency and reproducible planning views. It can establish that the setup works; it cannot establish game functionality or native/device graphics.

### `unit_test`

For isolated algorithms, state transitions, parsing, geometry, replay and invariants. Record fixtures/seeds, expected behavior and observed failures. A count of passing assertions is not a substitute for testing the acceptance requirement.

### `integration_test`

For interacting subsystems: Swift/WebView bridge, storage transactions, editor-to-simulation commands, packed asset loading and native lifecycle. Name the actual boundary tested and environment used. Browser-only results must say they are browser-only.

### `visual_review`

For visual quality or visual regressions. Record controlled scene, camera, time/weather, lighting/exposure, assets, quality tier, render resolution and captures. Include rubric findings and residual defects. A source/reference image is not an implementation screenshot. Label mockups explicitly.

### `device_test`

For measured behavior on physical hardware. Required device context includes the actually tested model (`iPhone Duo` for this project's gate), OS, app build, positive measurement duration in minutes and `is_simulator: false`. Set that flag only for real physical-device tests. Also record workload, build mode, warmup, instrumentation, thermal observations and quality preset in the evidence/supporting artifact.

### `source_verification`

For verified platform/library/policy facts. Use official sources, exact URLs, retrieval date, relevant API/version and a bounded paraphrase. Distinguish documentation from a compile/runtime probe. Absence of a search result does not prove an API does not exist; inability to verify remains unresolved.

### `owner_approval`

For a decision reserved to the owner: product scope, legal/name clearance signoff, visual approval when required, paid services, public distribution or release. Requires `reviewed_by` and a concrete `decision_reference` stating what was approved. A prior “continue” does not authorize a new commercial release or a change to Duo exclusivity.

Do not use a fictional `ci_run` kind. A CI run is provenance for one of the actual test/validation kinds. Put the real run/result links in artifacts and describe them in the handoff.

## 5. Acceptance mapping

Every task has stable acceptance criterion IDs in the roadmap. An evidence manifest maps each claimed criterion to observations that directly test it.

For each mapping:

1. Use the exact criterion ID, including its task prefix.
2. Reference the relevant local artifact, verified remote artifact or command record.
3. Explain in the handoff why that evidence addresses the requirement when the link is not self-explanatory.
4. List limitations honestly.
5. Ensure all criteria required for completion are covered, not merely the easiest ones.

An acceptance reference is either an exact string matching a path in that manifest's `artifacts` array or a zero-based numeric index into its `commands` array. For example, numeric `0` references the first command; the string `"0"` does not. Never point every criterion at a generic log that does not exercise those requirements.

`submit` permits a valid evidence package covering a subset of criteria while work awaits review. `complete` requires the full accepted-type coverage and manual gates. A passed record therefore means its stated observations passed, not that every task requirement is necessarily satisfied.

Failed recorded required CI or an unresolved project incident also prevents `complete`, even when the evidence package is otherwise valid. `submit` remains available for honest partial progress during a repair. Record and resolve incidents using the commands in [the continuation protocol](CONTINUATION_PROTOCOL.md); do not edit the health ledger to bypass these gates.

Repeat `--evidence` to supply multiple manifests. When explicit evidence arguments are supplied they replace the task's active package; old references are archived in history and files are retained. On final completion supply all still-applicable test, review, source and approval records, not only the newest approval file.

If completion needs multiple verification methods, provide the supporting artifacts and records for each. An owner-approval manifest may reference the actual test artifacts on which the owner based a decision; it must not replace required tests with an approval label.

## 6. Revision and digest provenance

### Establish the implementation revision

```sh
git rev-parse HEAD
git status --short
```

Use the implementation SHA actually committed and tested. If code was modified after committing, a test of that modified tree is not automatically a test of the earlier SHA. Commit the coherent change and rerun the necessary verification against the recorded revision.

### Hash local inputs and artifacts

The repository helper prints path/hash pairs for files you actually inspect:

```sh
node tools/project.mjs fingerprint path/to/actual-source-file path/to/actual-local-artifact
```

On macOS:

```sh
shasum -a 256 path/to/actual-source-file
shasum -a 256 path/to/actual-local-artifact
```

On systems providing GNU utilities:

```sh
sha256sum path/to/actual-source-file
sha256sum path/to/actual-local-artifact
```

Replace example paths; never paste made-up digest strings. Include relevant source files, fixtures, lockfiles, build scripts and configuration in the tested input scope. Do not include `node_modules` or unrelated personal files.

### Avoid self-reference

The evidence manifest and metadata commit come after the tested implementation. Do not try to hash the evidence file into itself or embed its own future commit SHA. Hash the actual implementation inputs and supporting artifacts instead.

At submission/completion the validator checks current scoped inputs/artifacts against recorded hashes and verifies source fingerprints against the recorded Git implementation tree. Later historical evidence may become stale as the project evolves; retain it as history and record new evidence for changed behavior. A warning about an unrelated later file change must not be represented as a fresh verification result.

If a known change invalidates an earlier requirement, reopen the affected task explicitly with `block` and an explanatory reason, then resolve/reverify through the normal workflow.

## 7. Local, CI and remote results

For local commands record exact command, working directory/context, tool versions when relevant, exit code and captured output path. Exit code `0` is necessary but not sufficient: a test command that silently skips every test does not prove functionality.

For CI also record:

- actual repository and full tested SHA;
- actual workflow/run URL and relevant jobs;
- trigger and build configuration;
- pass/fail/skipped state of each required job;
- artifact names and retention information;
- relevant simulator runtime or runner image;
- any approval or infrastructure limitation.

Never invent a workflow URL from an expected naming pattern. Verify it exists and matches the revision. A `push` run for a metadata-only change does not automatically replace the relevant implementation's device evidence.

For remote artifacts verify access before referencing them. If access is denied, the record is unverified until the authorized reviewer can inspect it. SHA-256 is mandatory for local artifacts; remote artifacts should also include hashes when the actual bytes are available, but never fabricate one.

The project validator checks HTTPS reference syntax, not the live contents or success state of the remote service. A successful local validation therefore does not prove that a URL exists, that a CI run passed or that a named owner actually approved anything. The agent must inspect those external results and record the observation accurately.

## 8. Graphics evidence requirements

A visual acceptance package must include:

1. The scene/layout and asset versions.
2. Camera transform, lens/field of view and viewport dimensions.
3. Lighting, exposure, tone mapping, weather and time settings.
4. Quality preset and enabled rendering features.
5. Reference images with rights/provenance, separate from captures.
6. Captures from the actual build, clearly labeled by platform.
7. Rubric review for silhouette, scale, materials, microdetail, lighting, shadows, optics and visible artifacts.
8. A list of observed defects and whether they block the criterion.
9. Actual reviewer/owner approval where required.

Do not update golden images to conceal a regression. A baseline change needs rationale, before/after inspection and the same acceptance standard as the original baseline.

Do not claim “hyperrealistic complete” because a renderer uses physically based materials. Evaluate the actual result at intended close-up and ordinary play distances under the prescribed lighting conditions.

## 9. Physical-device evidence requirements

Record at minimum:

- Actual device model and OS/build without private serial numbers.
- Native app build and bundled web-engine revision/hash.
- Release/debug configuration and instrumentation overhead.
- Workload/layout, train count, scene content and quality tier.
- Warmup, test duration and environmental conditions that matter.
- Frame-time distribution rather than average FPS alone.
- Peak/resident memory as applicable and instrumentation method.
- Thermal state and any quality adjustment/throttling observations.
- Startup, suspension/resume and fold transitions tested where relevant.
- Failures, interruptions and excluded samples with reasons.

All budgets are targets until measured. Do not convert a desktop/WebKit harness measurement into an iPhone Duo claim. When hardware is unavailable, keep the device criterion unverified and block it with the exact required test.

## 10. Manual approval and legal/platform boundaries

Only record approval that actually occurred. The reference must identify the decision, scope, reviewer and date without disclosing unnecessary personal information.

Examples of distinct approvals include:

- The owner accepts a specific visual baseline.
- The owner confirms they obtained appropriate name/brand clearance.
- The owner authorizes a specific signed build for public submission.
- The owner explicitly changes the consumer-device scope.

An agent may explain risks and prepare evidence but cannot mark these approvals satisfied on the owner's behalf. An App Store name being accepted does not, by itself, establish trademark clearance. A build compiling does not establish permitted exclusive distribution.

## 11. Retention and failure preservation

Keep small manifests in Git. Preserve enough summary measurements and reproducible test inputs that expiring CI artifacts do not erase all knowledge of a result. Before a release gate depends on a large artifact, establish where it will remain available and who can access it.

Record failures and known limits alongside successful runs. Do not delete a failing capture, overwrite logs or change a fixture merely to produce a green report without documenting why the original requirement was wrong.

Never commit signing material, access tokens, personal test layouts or confidential tester records as evidence. Redact sensitive material while retaining the diagnostic facts needed for review.

## 12. Completion review

Before `complete`, ask:

- Did the recorded commands actually run against the recorded implementation?
- Do artifacts exist, match their hashes and directly support the criteria?
- Is every criterion covered by the appropriate evidence type?
- Are required dependencies and gates satisfied?
- Are simulator, browser and device results distinguished?
- Are manual approvals genuine, specific and linked?
- Are current relevant source hashes still applicable?
- Are failures and omitted checks visible?
- Does the handoff accurately explain what remains?

If any answer is unknown, keep the task in review or blocked. Honest incompleteness is preferable to a false completion that misleads every subsequent agent.
