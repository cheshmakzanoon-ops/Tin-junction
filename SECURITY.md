# Security policy and threat boundaries

Do not put security reports containing secrets or exploit payloads into public issues. Ask the repository owner for a private reporting route; no private contact endpoint has been configured by this bootstrap.

## Protect

- User-authored layouts and backups from corruption or silent loss.
- Native filesystem and platform services from malformed or untrusted web messages.
- Asset imports from traversal, decompression/resource exhaustion and unsupported extensions.
- Build/signing credentials from logs, artifacts, repository contents and untrusted pull requests.
- The shipped app from remote executable code, unintended analytics and hostile navigation.

The production runtime must use bundled assets, an allowlisted bridge, bounded schemas, strict local resource resolution and atomic native persistence. Import/export is a data operation, never code execution. Do not use private WebKit settings to disable origin security.

GitHub Actions uses least privileges (`contents: read` for verification). Fork/PR tests do not receive signing credentials. Release/signing jobs require an owner-approved protected environment and documented prerequisites. Runtime network requests are absent from the v1 design; any future addition requires a threat-model and privacy decision.

Dependency vulnerability findings require triage with exact package/version/advisory and reachability. Do not conceal them by disabling scanning or declaring every warning harmless. Treat data loss, unexpected code execution and leaked credentials as stop-ship defects.
