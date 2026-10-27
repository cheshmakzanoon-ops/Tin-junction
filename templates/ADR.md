# ADR-NNNN — Replace with a specific decision title

> TEMPLATE ONLY. Copy into `docs/decisions/ADR-NNNN-short-title.md`. Replace every instruction and placeholder. This file does not record an accepted decision.

## Metadata

- **Status:** Proposed / Accepted / Rejected / Superseded. Choose one.
- **Decision date:** Actual date with timezone context where relevant.
- **Author:** Actual agent or person proposing the decision.
- **Decision owner:** Person or role authorized to approve it.
- **Related task IDs:** Exact roadmap IDs.
- **Supersedes:** Existing ADR path, or `None`.
- **Superseded by:** Later ADR path when applicable, or `None`.
- **Approval reference:** Real owner/reviewer decision reference when required; otherwise explain the agent's authority under the task.

## Context and problem

Describe the engineering problem, current implementation and constraints. Separate verified facts from assumptions. Include the consequence of making no decision.

## Decision drivers

List concrete criteria in priority order: correctness, physical-device feasibility, visual quality, offline behavior, platform policy, determinism, performance, complexity, cost, accessibility, licensing and maintainability as relevant.

## Options considered

| Option | Benefits | Costs and risks | Evidence |
| --- | --- | --- | --- |
| Replace with actual option | Actual benefit | Actual cost | Real source, benchmark or experiment |
| Replace with alternative | Actual benefit | Actual cost | Real evidence |
| Defer / retain existing approach | Actual effect | Actual cost | Why this is or is not viable |

Do not invent weak alternatives just to justify a preferred option. Record unresolved evidence rather than replacing it with certainty.

## Decision

State exactly what is chosen, which modules/interfaces it affects and which alternatives are rejected. Explain why the choice follows from the drivers and evidence.

## Boundaries and non-goals

Specify what the decision does not authorize. Preserve the Swift native / Three.js renderer boundary, offline scope, no-puzzle/no-economy product and Duo-only consumer release unless the owner explicitly changes those constraints.

## Technical contract

Record public interfaces, data ownership, lifecycle behavior, error handling, version constraints and compatibility assumptions needed by future agents. Link detailed specifications rather than duplicating them inconsistently.

## Evidence and validation

- Official documentation links and access dates for platform/library claims.
- Exact implementation or experiment commit.
- Commands, environment and actual results.
- Artifact paths/URLs and hashes.
- What was not tested and why.
- Acceptance requirements that must pass before the decision is implemented or shipped.

An official API page alone does not establish runtime success. A simulator alone does not establish physical Duo performance. A benchmark without the workload and device context is not comparable evidence.

## Consequences

### Positive

Describe expected benefits without presenting predictions as measured results.

### Negative and trade-offs

Describe maintenance burden, limitations, platform risks, quality trade-offs and what may become harder.

### Security, privacy and licensing

State relevant implications, or explain why none are introduced. Identify rights required for assets and restrictions on remote code, network access or user data.

## Migration and rollback

List staged implementation tasks, compatibility/migration treatment, validation gates and a recoverable rollback procedure. Never discard saved layouts or rewrite Git history as a rollback strategy.

## Revisit triggers

Specify observable conditions that require reconsideration: unsupported public API, missed measured budget, OS regression, unacceptable visual artifact, changed rights or a user-approved scope change.

## Related records

Link affected specifications, task evidence, handoffs, risks and follow-up ADRs. If this decision supersedes another, update the older ADR with the new reference while preserving its historical reasoning.
