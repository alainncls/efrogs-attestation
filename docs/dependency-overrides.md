# Dependency Overrides

Last reviewed: 2026-09-30.

This pnpm workspace keeps overrides only for transitive dependency security fixes that cannot be reached through direct
package updates yet. Direct dependencies should be preferred over overrides whenever upstream packages release compatible
versions. Every override is pinned to an exact, same-major version.

## Active Overrides

| Override                                      | Current source path                                                                                                   | Reason                                                                                                | Removal trigger                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `adm-zip@<0.6.1` -> `0.6.1`                   | `hardhat`                                                                                                             | Same-major fix for GHSA-7q85-xj36-vmfc, GHSA-rcw4-f5rp-g42v, GHSA-8238-w5pm-2374 and related.         | Remove when Hardhat resolves `adm-zip >=0.6.1` directly.              |
| `brace-expansion@>=5.0.0 <5.0.12` -> `5.0.12` | `eslint` -> `minimatch`                                                                                               | Same-major fix for GHSA-6j4f-fj2g-mc7p, GHSA-qhr7-859c-m2p7 and GHSA-q2hr-2g5m-vwhr.                  | Remove when ESLint resolves `brace-expansion >=5.0.12` directly.      |
| `fast-uri@>=2.0.0 <2.4.7` -> `2.4.7`          | `@verax-attestation-registry/verax-sdk` -> `@graphql-mesh/runtime` -> `graphql-jit` -> `fast-json-stringify`          | Same-major fix for GHSA-qw65-cvwx-89v3, GHSA-58mr-gqgx-xq4g and GHSA-hrr3-gc8f-f4qj.                  | Remove when the Verax SDK stack resolves `fast-uri >=2.4.7` directly. |
| `fast-uri@>=3.0.0 <3.1.8` -> `3.1.8`          | `@verax-attestation-registry/verax-sdk` -> `@graphql-mesh/runtime` -> `graphql-jit` -> `fast-json-stringify` -> `ajv` | Same-major fix for GHSA-qw65-cvwx-89v3, GHSA-58mr-gqgx-xq4g and GHSA-hrr3-gc8f-f4qj.                  | Remove when the Verax SDK stack resolves `fast-uri >=3.1.8` directly. |
| `hono@>=4.0.0 <4.13.5` -> `4.13.5`            | `@reown/appkit-adapter-wagmi` -> `@wagmi/connectors` -> `porto`                                                       | Same-major fix for GHSA-gqvv-2mrq-wpjv, GHSA-g6gw-c38x-mqfc and GHSA-crvj-82cr-hjcx.                  | Remove when Wagmi/Reown packages resolve `hono >=4.13.5` directly.    |
| `viem>ws` -> `8.21.3`                         | `@reown/appkit` -> `@walletconnect/utils` -> `viem@2.23.2`                                                            | Parent-targeted fix for GHSA-58qx-3vcg-4xpx and GHSA-96hv-2xvq-fx4p (`viem@2.23.2` pins `ws@8.18.0`). | Remove when WalletConnect no longer resolves `viem@2.23.2`.           |

Overrides removed in the 2026-09-30 refresh because the lockfile now resolves patched versions without them: `ajv`,
`axios`, `bn.js@4`, `bn.js@5`, `brace-expansion@1`, `defu`, `flatted`, `follow-redirects`, `h3`, `lodash`, `postcss`,
`rollup`, `socket.io-parser`, `undici@6`, and the `ajv>fast-uri` / `fast-json-stringify>fast-uri` pins.

## Known Blocked Items

`uuid` remains on vulnerable transitive versions (`8.3.2`, `9.0.1`) through Reown/Coinbase/Solana and Wagmi/Metamask
paths (GHSA-w5hq-g745-h8pq). The patched version is `uuid >=11.1.1`, which is a transitive major upgrade and is not forced
through an override.

`decode-uri-component` (GHSA-vcc3-ghjq-m6fr) and `stream-json` (GHSA-528h-pc64-c93x) are only patched in new majors
(`0.5.0` and `3.5.0`). Both are ESM-only and incompatible with their CommonJS consumers (`query-string@7` calls
`require('decode-uri-component')` as a function; `jayson@4` requires `stream-json/streamers/StreamValues`, which the
`3.x` export map no longer resolves), so they are not forced through overrides.

`elliptic` remains reported through the Hardhat verify Ethers v5 stack. The audit feed reports no patched version, so
this is tracked as upstream-only risk in
[#39](https://github.com/alainncls/efrogs-attestation/issues/39).

`wagmi` and `@wagmi/core` are intentionally held on the current compatible line because `@reown/appkit-adapter-wagmi`
still resolves `@wagmi/connectors@7.0.5`, which peers on `@wagmi/core@3.0.1`; moving to Wagmi 3.7 / core 3.6 creates a
peer dependency mismatch (re-checked on 2026-09-30 with `@reown/appkit-adapter-wagmi@1.8.24`). This was tracked in
[#41](https://github.com/alainncls/efrogs-attestation/issues/41).

`@types/node` remains on the Node 24 line because `.nvmrc` and `package.json` still target Node 24. A newer Node runtime
and type migration is tracked in [#40](https://github.com/alainncls/efrogs-attestation/issues/40).
