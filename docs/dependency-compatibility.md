# Dependency compatibility review

## 2026-10-12 resolution

The historical findings below are superseded: the regenerated frozen lockfile
now reports **zero vulnerabilities at every severity**, without suppressions.

- `@base-org/account@2.5.13` removes the vulnerable older CDP/Solana/Jayson chain.
- `@walletconnect/ethereum-provider@2.26.0` removes the older query-string chain.
- The scoped `@reown/appkit-adapter-wagmi>@wagmi/connectors@8.2.0` override
  aligns the adapter with the connectors and Wagmi core already used by the app.
  The adapter imports only `baseAccount`, `coinbaseWallet` and `safe`; the real
  connector integration test constructs all three on both Linea chains with
  loopback transports. This is a tested cross-major alignment, not a claim of
  SemVer compatibility. It removes obsolete MetaMask/Gemini/Porto dependency paths.
- The now-unnecessary Hono override is removed. The GraphQL Tools security
  override remains covered by the real Verax SDK fetch/decode/simulation tests.

All 45 newly introduced versions satisfy the 72-hour minimum release age.
No signing, broadcast or production wallet connection is used by these tests.

## Historical review (2026-10-10)

Reviewed 2026-10-10 on `cf2263b6deb5f454d00892c9bd92a7d97b200e2d` with the
frozen pnpm lock, local registry audit, and the Verax SDK 5.4.0 integration
tests added in this branch.

## Verax / GraphQL Tools override

| Field          | Evidence                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Installed      | `@graphql-tools/utils@12.0.3` is an exact override in `pnpm-workspace.yaml`, resolved in `pnpm-lock.yaml` and reached through `@verax-attestation-registry/verax-sdk@5.4.0`.                                                                                                         |
| Parent ranges  | GraphQL Mesh / GraphQL Tools parents in the Verax SDK graph request 11.x ranges; `graphql-yoga@5.21.0` requests 10.x. The exact lock graph and `pnpm why @graphql-tools/utils -r` show one shared 12.0.3 instance. These are cross-major overrides, not SemVer-proven compatibility. |
| Advisory state | The previous high advisory was GHSA-7mx3-vvmw-hjmv on `@graphql-tools/utils <=12.0.0`; 12.0.3 is outside that affected range. Current `pnpm audit` reports 0 high/critical and 7 moderate vulnerable package instances.                                                              |
| Reachability   | The SDK is a frontend dependency and GraphQL Mesh is used by the real SDK query path. It is runtime-reachable, not development-only. `packages/frontend/src/veraxSdk.integration.test.ts` exercises real SDK GraphQL fetch/decode and local-RPC attestation-call preparation.        |
| Decision       | Keep the exact 12.0.3 security override pending upstream-compatible parent releases. Do not call it semver-compatible or remove it solely because the high audit is clear.                                                                                                           |

## Remaining moderate audit findings

The current audit reports six advisory records across seven vulnerable package
instances. They are indirect dependencies of wallet/provider and SDK chains;
reachability is not proven absent, so none are marked “dev-only” or waived.

| Package / installed versions                 | Advisory fix | Parent path / next safe action                                                                                                                                                                                                                                                                                   |
| -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uuid@8.3.2`, `uuid@9.0.1`                   | `>=11.1.1`   | Separate AppKit/Coinbase and Gemini/MetaMask paths request older major lines. Upgrade a compatible parent first; do not override to uuid 11 without parent compatibility proof.                                                                                                                                  |
| `decode-uri-component@0.2.2`                 | `>=0.5.0`    | WalletConnect `query-string@7.1.3` path; 0.x range is incompatible with 0.5 by default. Upgrade the parent chain and test encoded callback/query handling.                                                                                                                                                       |
| `stream-json@1.9.1` (three advisory matches) | `>=3.6.0`    | Coinbase CDP → Solana Web3 → Jayson path requests the 1.x line. Move to a Jayson release that accepts a patched stream-json version or maintain a reviewed narrow backport; do not force major 3.                                                                                                                |
| `hono@4.13.5`                                | `>=4.13.7`   | Porto path is same-major and is the only direct patch candidate. A local pnpm regeneration changed/removes cross-platform `libc` selectors in unrelated optional native packages; that lockfile drift was reverted rather than shipped. Revisit with a lockfile-generation setup that preserves those selectors. |

An exploratory `pnpm audit --fix` proposed broad `>=` overrides, including
cross-major/0.x replacements. Those generated overrides were rejected. No
moderate advisory is suppressed, and the audit is not described as clean.

## Real EFrogs payload contract

The deployed schema has two positional fields: `address tokenContract,uint256
balance`. The app previously supplied one object in `attestationData`, while
Verax SDK 5.4.0's encoder consumes positional schema values. `simulateAttest`
against local GraphQL/RPC reproduced the ABI parameter/value mismatch. The
frontend now passes `[tokenContract, balance]` at a narrow documented type
boundary. The integration test confirms SDK fetch/decode and custom-ABI call
preparation on Linea Mainnet and Sepolia; it never signs or sends a transaction.

## Verification limits

The tests use loopback transports only. They do not prove behavior against live
subgraphs/RPC, WalletConnect, or production signing. No GitHub Actions run was
started. pnpm 10.26.2 reports peer warnings (`use-sync-external-store` vs React
19 and `@wagmi/connectors` vs `@wagmi/core`); the local build/tests are required
to be re-run after any parent dependency migration.

## 2026-10-12 release checks

Frozen pnpm 10.26.2 install, formatting, lint, typecheck and production build
passed. All 9 Solidity tests, repository security checks, 15 frontend/SDK/wallet
tests and 12 desktop/mobile Playwright cases passed. Full and production audit
both report zero vulnerabilities (786 / 377 dependencies). No budgets,
advisories or test assertions were disabled. GitHub Actions were not triggered.
