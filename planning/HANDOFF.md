# Current handoff — first operating railway

Read [the current implementation and verification handoff](handoffs/2026-10-27-first-railway.md). The repository now contains a working miniature railway, scenery workbench and native save/recovery integration. [The implemented contract](../docs/architecture/FIRST_WORKBENCH.md) records the precise scope.

P00 and the five deterministic-kernel tasks are accepted against published evidence. P04-T06 remains in progress until the refined implementation passes both required Actions workflows. The first native run compiled and passed all 46 unit tests, but its UI runner stalled during simulator Accessibility initialization before any UI test executed. Preserve that failure record and inspect the fresh run; do not weaken tests.

After P04-T06 verification, use `npm run project:next` to resume the original platform/packaged-runtime gates. The fixed oval and procedural art do not complete the later general track graph, production editor, asset or device-validation phases. Native simulator evidence and physical-device evidence remain distinct.

The [state ledger](state.json) owns progress. Inspect current remote checks before acting; the stored CI snapshot may be stale. Unresolved Duo-only distribution, name/rights, final art and release gates remain in [the risk register](../docs/operations/RISK_REGISTER.md).
