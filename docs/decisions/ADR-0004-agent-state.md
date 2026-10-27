# ADR-0004 — Deterministic agent continuation

Status: accepted.

## Problem

Chat histories disappear, agents disagree about progress, and unchecked roadmaps make unfinished work look complete. A repository must answer what exists, what is next, what proves completion and what blocks release.

## Decision

Keep task definitions in `planning/roadmap.json` and mutable progress in `planning/state.json`. Generate phase procedures, status and next-task views from those files. Validate the dependency DAG, claim leases, evidence coverage, handoff paths and local documentation links with a dependency-free Node CLI.

“Ready” is derived, never a stored mutable status. CI failure recovery outranks feature selection. Claims are bounded coordination records, not permission to overwrite files or a distributed locking guarantee. One integrator writes shared progress and pushes main. Stale claims require inspection before reassignment.

Completion references an already committed implementation SHA; evidence/handoff updates go in a later metadata commit. Content hashes tie local artifacts to the recorded test run. Historical evidence is preserved, not silently rewritten when later work changes code.

## Limits

The validator checks consistency and provenance fields; it cannot prove the truth of a human report, visual fidelity, legal clearance or live remote CI without external evidence. A freshly rendered status file is not permission to skip those checks.
