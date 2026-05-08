# Security Scan Report

Date: 2026-05-08

Repository: `/Users/alain/Documents/Perso/efrogs-attestation`

Scan target: repository-wide scan started at commit `1662926`. HEAD advanced to `989aace` during the scan; final validation and the root report reflect the tracked file contents at `989aace`.

Artifact bundle: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z`

Remediation status: fixed on 2026-05-08 after this scan.

- FINDING-001: `_onReplace` and `_onBulkReplace` now revert with `NotImplemented`, matching the disabled bulk-attestation behavior.
- FINDING-002: `PRIVATE_KEY` now uses a dedicated 32-byte hex validator with a redacted error message.
- FINDING-003: the root `preinstall` hook that executed `npx only-allow@1.2.2 pnpm` was removed.
- Regression coverage was added in `packages/contracts/test/EFrogsPortalSecurity.t.sol` and `packages/contracts/test/repositorySecurity.test.mjs`.

## Executive Summary

The scan found no critical or high-severity issues.

Reportable findings:

| ID          | Priority | Severity | Title                                                                                           |
| ----------- | -------- | -------- | ----------------------------------------------------------------------------------------------- |
| FINDING-001 | P2       | Medium   | Portal owner can replace validated ownership attestations with payloads that bypass `_onAttest` |
| FINDING-002 | P3       | Low      | Malformed deployment private key can be printed in logs                                         |
| FINDING-003 | P3       | Low      | Root install hook executes an npm-fetched package outside the PNPM lockfile                     |

The highest-impact issue is in the on-chain replacement path. Public attestation creation validates sender identity, NFT ownership, schema authorization, token contract, and token balance. Replacement and bulk replacement only check portal-owner authority before writing replacement payloads through Verax. This is not a public-user bypass, but it is a concrete privileged integrity bypass of the portal's core ownership-attestation invariant.

## Scope And Method

The scan followed the Codex Security repository-wide workflow:

- Threat model
- Finding discovery
- Validation
- Attack-path analysis
- Final report assembly

Five subagents were used for targeted file-pass discovery over contracts, deployment tooling, frontend transaction code, frontend components, analytics/static assets, and supply-chain files. Every in-scope checklist file was read in full.

Validation included:

- `pnpm audit --json`
- `pnpm why elliptic --filter efrogs-attestation-contracts`
- `pnpm why elliptic --filter efrogs-attestation-frontend`
- `pnpm --filter efrogs-attestation-frontend typecheck`
- `pnpm --filter efrogs-attestation-frontend build`
- `INFURA_KEY=dummy ETHERSCAN_API_KEY=dummy PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef pnpm --filter efrogs-attestation-contracts compile`

Slither and Semgrep were not installed locally.

## Finding: Portal owner can replace validated ownership attestations with payloads that bypass `_onAttest`

Priority: P2

Severity: Medium

Confidence: Medium-high

CWE: CWE-863 Incorrect Authorization, CWE-345 Insufficient Verification of Data Authenticity

Affected lines:

- `packages/contracts/src/EFrogsPortal.sol:87` replacement hook entrypoint
- `packages/contracts/src/EFrogsPortal.sol:93` replacement root control
- `packages/contracts/src/EFrogsPortal.sol:96` bulk replacement hook entrypoint
- `packages/contracts/src/EFrogsPortal.sol:101` bulk replacement root control
- `packages/contracts/src/EFrogsPortal.sol:61` attest-time subject validation not reused
- `packages/contracts/src/EFrogsPortal.sol:65` attest-time NFT ownership check not reused
- `packages/contracts/src/EFrogsPortal.sol:69` attest-time schema allowlist not reused
- `packages/contracts/src/EFrogsPortal.sol:71` attest-time schema data decode not reused
- `packages/contracts/node_modules/@verax-attestation-registry/verax-contracts/contracts/abstracts/AbstractPortalV2.sol:137` replacement sink
- `packages/contracts/node_modules/@verax-attestation-registry/verax-contracts/contracts/AttestationRegistry.sol:181` registry replacement sink

### Summary

`EFrogsPortal._onAttest` enforces the portal's core invariant: the attestation subject must be the sender, the sender must currently own an eFrog, the fee must be paid, the schema must be authorized, and official schema data must match the configured eFrogs contract and current balance.

The replacement hooks do not reuse those checks. `_onReplace` and `_onBulkReplace` only verify the Verax portal owner. Verax then calls `AttestationRegistry.replace`, which revokes the old attestation and creates a replacement payload. The registry-level checks ensure the schema exists and fields are non-empty, but they do not validate eFrogs ownership or the official schema tuple semantics.

This lets the portal owner, or anyone with the portal-owner key, replace an existing eFrogs portal attestation with ownership data that never passed `_onAttest`.

### Validation

Validation method: static trace through local contract code and Verax dependency source, plus successful Solidity compilation with a dummy private key.

Evidence:

- `EFrogsPortal._onAttest` validates subject, ownership, fee, schema, token address, and balance at `packages/contracts/src/EFrogsPortal.sol:61-76`.
- `EFrogsPortal._onReplace` only checks portal owner at `packages/contracts/src/EFrogsPortal.sol:93`.
- `EFrogsPortal._onBulkReplace` has the same owner-only local check at `packages/contracts/src/EFrogsPortal.sol:101`.
- Verax `AbstractPortalV2.replace` calls local `_onReplace` and then `attestationRegistry.replace` at `packages/contracts/node_modules/@verax-attestation-registry/verax-contracts/contracts/abstracts/AbstractPortalV2.sol:135-137`.
- Verax `AttestationRegistry.replace` revokes the original attestation and calls `attest` with the new payload at `packages/contracts/node_modules/@verax-attestation-registry/verax-contracts/contracts/AttestationRegistry.sol:181-183`.

Remaining uncertainty:

- The repository does not include downstream consumers, so the exact consumer behavior for replacement attestations is not visible. The README describes the product as ownership attestations, so preserving the ownership invariant on replacements is the safer default.

### Reachability Analysis

The affected component is in scope: `EFrogsPortal` is the production contract surface that enforces eFrogs ownership attestations.

The path is not public. It requires Verax portal-owner authority or compromise of that owner key. That reduces severity, but it does not eliminate the issue because the privilege gained is not just revocation or administrative curation; the replacement path can create new attestation data without the ownership proof required everywhere else.

### Attack Path

1. The attacker obtains use of the Verax portal owner account.
2. The attacker selects an existing eFrogs portal attestation.
3. The attacker calls `replace` or `bulkReplace` with arbitrary replacement payload data.
4. `EFrogsPortal` checks only portal-owner authority for the replacement.
5. Verax revokes the old attestation and registers the replacement payload.
6. Consumers that trust the eFrogs portal can observe replacement ownership data that did not prove eFrogs ownership.

### Attack Path Facts

- In-scope status: in scope as the core on-chain attestation integrity control.
- Exposure: on-chain contract function, admin-only.
- Identity: Verax portal owner.
- Cross-boundary behavior: replacement payload crosses from privileged owner input into externally consumed registry state.
- Vector: remote on-chain transaction with portal-owner credentials.
- Preconditions: portal-owner authority or compromise and an existing portal attestation.
- Mitigations already present: `replace` is portal-owner gated; initial attest path is strongly validated.
- Counterevidence: Verax replacement is intentionally portal-owner-only and the portal is registered as revocable. This proves the path is privileged, but does not prove replacement should bypass the portal's ownership validation invariant.

### Severity Analysis

Impact is medium to high for affected attestations because false ownership data can be registered under the trusted portal. Likelihood is limited by the portal-owner precondition. Final severity is Medium/P2: concrete integrity bypass, but not a public-user exploit.

### Remediation

Use one of these approaches:

- If replacement is not needed, make `_onReplace` and `_onBulkReplace` revert, similar to `_onBulkAttest`.
- If replacement is needed, extract the `_onAttest` validation into a shared internal helper and call it for every replacement payload.
- Add tests that prove replacement cannot change subject, token contract, or balance to values that would fail normal attestation.
- If owner-forged replacement is intentional, document that trust model clearly for attestation consumers.

## Finding: Malformed deployment private key can be printed in logs

Priority: P3

Severity: Low

Confidence: High

CWE: CWE-532 Insertion of Sensitive Information into Log File

Affected lines:

- `packages/contracts/scripts/deployEFrogsPortal.ts:13` hex validation helper
- `packages/contracts/scripts/deployEFrogsPortal.ts:15` raw rejected value in error
- `packages/contracts/scripts/deployEFrogsPortal.ts:31` `PRIVATE_KEY` source
- `packages/contracts/scripts/deployEFrogsPortal.ts:93` top-level error logging

### Summary

`deployEFrogsPortal.ts` validates `PRIVATE_KEY` with `requireHex`. When validation fails, the thrown error includes the raw rejected value. The top-level catch logs the error. If a deployer or CI job provides a malformed private key value that still contains sensitive key material, that key material can be written to terminal or CI logs.

### Validation

Validation method: static trace.

Evidence:

- `requireHex` throws `new Error(\`${name} must be a valid hex string, got: ${value}\`)`at`packages/contracts/scripts/deployEFrogsPortal.ts:13-15`.
- `PRIVATE_KEY` is passed to that helper at `packages/contracts/scripts/deployEFrogsPortal.ts:31`.
- The top-level catch logs errors at `packages/contracts/scripts/deployEFrogsPortal.ts:92-94`.

### Reachability Analysis

This is not reachable by public users. It affects local or CI deployment workflows, which are in scope because deployment private keys are high-value assets for this repository.

### Attack Path

1. A developer or CI environment sets `PRIVATE_KEY` to a malformed value.
2. The deploy script passes it to `requireHex`.
3. `requireHex` throws an error containing the raw value.
4. The catch block logs the error.
5. Anyone with access to the logs can recover the exposed key material.

### Attack Path Facts

- In-scope status: in scope as deployment tooling.
- Exposure: local/CI logs.
- Identity: deployer key.
- Cross-boundary behavior: secret flows from environment variable to logs.
- Preconditions: malformed key and log access.
- Mitigations already present: malformed keys are rejected before use.
- Counterevidence: correctly formatted keys do not leak through this path; no literal private key is committed.

### Severity Analysis

Impact can be serious if a real deployer key leaks, but likelihood is constrained to malformed-key setup errors and log access. Final severity is Low/P3.

### Remediation

- Do not include raw rejected values in validation errors for secret inputs.
- Use a secret-specific helper for `PRIVATE_KEY` that reports only missing or invalid format.
- Consider masking all environment-derived values in deployment error handling.

## Finding: Root install hook executes an npm-fetched package outside the PNPM lockfile

Priority: P3

Severity: Low

Confidence: Medium

CWE: CWE-494 Download of Code Without Integrity Check, CWE-829 Inclusion of Functionality from Untrusted Control Sphere

Affected lines:

- `package.json:10` `preinstall` hook
- `package.json:24` package-manager pin
- `pnpm-lock.yaml` has no `only-allow` entry

### Summary

The root `preinstall` hook runs `npx only-allow@1.2.2 pnpm`. This fetches and executes install-time code outside the repository's PNPM lockfile. The version is pinned, but the package integrity is not bound by the checked-in lockfile.

If the `only-allow@1.2.2` package or registry resolution path is compromised, code can execute on developer or CI machines during install.

### Validation

Validation method: manifest and lockfile inspection.

Evidence:

- Root `package.json:10` runs `npx only-allow@1.2.2 pnpm`.
- Root `package.json:24` pins `pnpm@10.26.2`.
- Searching `pnpm-lock.yaml` found no `only-allow` entry, so the guard package is not locked by PNPM.

### Reachability Analysis

This is an install-time supply-chain path. It is not part of the browser bundle or on-chain runtime, but it affects developer/CI environments that may hold credentials used to build or deploy contracts.

### Attack Path

1. A developer or CI job runs install with lifecycle scripts enabled.
2. `preinstall` executes before the normal locked install completes.
3. `npx` resolves and runs `only-allow@1.2.2`.
4. A compromised package or registry path executes attacker-controlled code in the install environment.

### Attack Path Facts

- In-scope status: in scope as dependency/bootstrap workflow.
- Exposure: developer and CI install path.
- Identity: developer shell or CI job permissions.
- Cross-boundary behavior: registry-supplied code executes locally before lockfile integrity applies to that package.
- Preconditions: package or registry compromise.
- Mitigations already present: exact version pinning and root `packageManager`.
- Counterevidence: npm registry integrity protections still apply during normal resolution, and this code is not shipped to users.

### Severity Analysis

Impact is meaningful in a compromised install path, but likelihood is limited by supply-chain preconditions and version pinning. Final severity is Low/P3.

### Remediation

- Remove the `npx` lifecycle hook and rely on `packageManager`, Corepack, and CI package-manager enforcement.
- If a guard is required, use a repository-pinned mechanism that does not fetch executable code outside the lockfile during lifecycle execution.

## Coverage Closure

| Area                                                         | Disposition                  | Reason                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public attest payload decoding                               | Suppressed                   | Subject length handling fails closed through `subject != msg.sender`; malformed official schema data reverts.                                                                                                                                         |
| Public attest fee bypass                                     | Suppressed                   | `_onAttest` rejects `value < fee`; bulk attest reverts.                                                                                                                                                                                               |
| Portal withdraw reentrancy or unauthorized withdrawal        | Suppressed                   | `withdraw` is `onlyOwner`; no state update follows the external call.                                                                                                                                                                                 |
| Testnet NFT mint as ownership bypass                         | Suppressed                   | Current repository constants and README use real eFrogs on mainnet and fake NFT only on Sepolia; mainnet misuse would be deployment misconfiguration.                                                                                                 |
| Frontend wrong-chain attestation                             | Suppressed                   | Current `App.tsx` checks `chainId` and `isValidChain` inside the send callback and uses a chain-specific Verax SDK.                                                                                                                                   |
| Frontend receipt first-log parsing                           | Suppressed                   | Brittle but not currently exploitable: deployment uses immutable empty modules, local `_onAttest` emits no events, and Verax registry emits `AttestationRegistered(bytes32 indexed)` after validation.                                                |
| Testnet mint wrong-chain transaction                         | Suppressed                   | `TestnetRibbon` is rendered only when `chainId === lineaSepolia.id`.                                                                                                                                                                                  |
| Provider-message XSS                                         | Suppressed                   | Provider messages are rendered as React text; no raw HTML sink was found.                                                                                                                                                                             |
| Tabnabbing/open redirect                                     | Suppressed                   | External links use fixed URL bases and `noopener noreferrer`.                                                                                                                                                                                         |
| Google Fonts stylesheet without SRI/CSP                      | Hardening-only               | Remote CSS can alter presentation but not transaction destination; wallet confirmation remains the transaction boundary.                                                                                                                              |
| Analytics telemetry                                          | Hardening-only               | The bundled analytics asset sends navigation metadata to `getinsights.io`; current paths do not include wallet or attestation IDs and query/hash are not tracked by default.                                                                          |
| `elliptic@6.6.1` advisory                                    | Suppressed                   | `pnpm audit` reports CVE-2025-14505 / GHSA-848j-6mx2-7j84 only through Hardhat verification tooling; no frontend runtime path was found.                                                                                                              |
| Untracked `.agents/skills/seo-audit/` and `skills-lock.json` | Out of product runtime scope | These files appeared during the scan and were reviewed as local Codex skill documentation/evals, not eFrogs runtime, deployment, frontend, or contract code. No executable shell/process sink or secret material was found in the quick closure pass. |
| Backend routes, database, uploads, CSRF, SSRF                | Not applicable               | No custom backend, database client, upload handler, server route, or session/cookie config exists in the checked repository.                                                                                                                          |

## Verification Notes

- Remediation validation passed with `pnpm test`, `pnpm typecheck`, `pnpm --filter efrogs-attestation-contracts lint`, `pnpm --filter efrogs-attestation-frontend lint`, and `pnpm --filter efrogs-attestation-frontend build`.
- Frontend typecheck passed.
- Frontend production build passed. Vite emitted large chunk warnings only.
- Contract compile passed when dummy local deployment environment values were supplied.
- Initial contract compile without environment values failed because Hardhat validates configured private keys before compiling.
- HEAD advanced during the scan; final validation reflects the tracked file contents at `989aace`.

## Full Artifact Index

- Threat model: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/threat_model.md`
- Runtime inventory: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/runtime_inventory.md`
- Seed research: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/seed_research.md`
- Exhaustive file checklist: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/exhaustive-file-checklist.md`
- Coverage ledger: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/repository_coverage_ledger.md`
- Discovery report: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/finding_discovery_report.md`
- Validation report: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/validation_report.md`
- Attack-path report: `/tmp/codex-security-scans/efrogs-attestation/1662926_20260508T162534Z/artifacts/attack_path_analysis_report.md`
