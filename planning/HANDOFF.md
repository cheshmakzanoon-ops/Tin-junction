# Current handoff — repository bootstrap

The engineering plan and diagnostic scaffolds are being integrated. This is a setup checkpoint, not a completed railway application.

## Current boundary

- The product is the Duo-only miniature railway defined in [the product contract](../docs/product/PRODUCT_SPEC.md).
- [The roadmap](roadmap.json) defines all tasks. [The state ledger](state.json) is authoritative for progress.
- Initial setup tasks remain incomplete until their actual evidence and published implementation SHA are recorded.
- Native compilation, Duo Simulator behavior and physical-device results must be tracked independently. Do not infer them from web tests or file existence.

## Next action

Run `npm run project:validate`, inspect actual GitHub Actions results for `origin/main`, then run `npm run project:next`. Follow the selected task, preserving unrelated work and recording a chronological handoff before ending.

The unresolved Duo-only distribution and naming gates remain in [the risk register](../docs/operations/RISK_REGISTER.md). No signing, store upload or external purchase is authorized by this setup checkpoint.
