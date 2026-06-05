---
"@curvenote/quantecon-book": patch
---

Resolve backward-compatible Dependabot security advisories via `overrides`: `uuid` (→ `^11.1.1`), `ajv` (→ `^8.18.0`), and `cookie` (→ `^0.7.0`, used by Remix's cookie session). Add `SECURITY.md` documenting the dependency posture and triage for the remaining alerts (deferred Remix-v1, the unmaintained `ip` package, and major-bump MyST/Thebe build-chain deps).
