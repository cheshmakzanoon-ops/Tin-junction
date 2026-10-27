# Risk register

Risk ratings are engineering judgments, not statistical predictions. Keep this register linked to concrete tasks and update it when evidence changes.

| ID | Risk | Impact | Trigger / evidence needed | Mitigation / owner |
|---|---|---|---|---|
| R01 | Duo-only App Store sales restriction unverified | Release blocker | No documented supported eligibility route | Owner + platform task; never fake a capability key |
| R02 | Packaged WebView origin cannot load required GLB/KTX2/WASM/worker assets | Architecture blocker | Exact signed/unsigned app probe fails | Platform engineer; test transport before asset volume |
| R03 | Visual ambitions exceed sustained device budget | High | Reference slice misses approved p95/thermal targets | Graphics engineer; benchmark one representative scene, then optimize |
| R04 | Model-world/prototype units are mixed | High | Gauge, speed, wheel or camera mismatch | Simulation + assets; scale ADR, fixtures and import checks |
| R05 | Turnout change or route reverse detaches bogies/couplers | High | Occupied-switch or reverse route tests fail | Simulation engineer; graph occupancy and route history |
| R06 | Save interruption loses user layouts | Stop ship | Corrupt/partial document or false Saved state | Native storage owner; atomic transactions and recovery generations |
| R07 | Workflows drift with mutable runner images | High | Xcode/runtime version not found | CI engineer; explicit selection, inventory artifact, no silent fallback |
| R08 | Native and TypeScript bridge contracts diverge | High | Same fixture accepted on one side only | Bridge owner; shared malformed/golden fixture corpus |
| R09 | Broad scene editor expands before core railway works | Schedule | More assets/features while first loop is unstable | Coordinator; enforce task dependencies and vertical slice gate |
| R10 | Unlicensed or brand-copying art enters production | Release blocker | Missing rights/provenance entry | Art owner + owner; empty-by-default asset catalog and review |
| R11 | Agents claim completion without real evidence | High | Missing hashes/captures/CI URLs; contradictions | Coordinator; CLI validation and human review gates |
| R12 | Main-only concurrent agents overwrite shared files | High | Remote head changes or overlapping scope | One integrator, bounded claims, fast-forward/expected-head updates |
| R13 | Simulator success mistaken for physical hardware quality | High | No sustained physical Duo run | Device gate; label all simulator/browser evidence |
| R14 | Provisional name conflicts or store reservation missing | Commercial | Trademark/name check not completed | Owner; formal clearance and App Store Connect verification |
| R15 | Low price cannot fund content/support scope | Commercial | Scope or maintenance cost expands | Owner; fixed launch kit, no income promise, review actual economics |
| R16 | Browser build contains debug hooks or source maps at release | Medium | Release bundle audit finds diagnostics | Build owner; release profile, allowlist and artifact manifest |
| R17 | Asset source files overwhelm ordinary Git | Medium | Large binaries enter commits | Asset owner; approved LFS/store policy with budget before upload |
| R18 | Driver/WebContent/context loss creates blank screen | High | Recovery run fails or leaks resources | Renderer/native owners; lifecycle fault injection and UI recovery |
| R19 | Tiny controls, blur or hinge placement makes editor unusable | High | Physical ergonomic/accessibility review fails | UX owner; native safe geometry, touch targets, sharp edit mode |
| R20 | Dependency upgrade changes image or compression semantics | Medium | Fixture/visual regression after upgrade | Graphics/build owner; pinned versions, controlled upgrade ADR |

## Blocking versus continuing

R01 and R14 do not prevent implementing independent track mathematics or licensed art tools. They do prevent release. R02 can prevent production content loading and must be resolved early. R06 blocks beta distribution. Do not mark all unrelated tasks blocked just because one external decision is pending; respect the dependency graph.

## Escalation record

An active blocker needs an owner, discovery date, exact failing evidence, scope affected, safe work that may continue, and a specific unblock action. Store it in the task ledger and explain it in the handoff. Do not treat “ask user later” as a resolution.
