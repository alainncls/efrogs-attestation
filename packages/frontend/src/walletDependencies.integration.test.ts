import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createConfig, http } from '@wagmi/core';
import type { CreateConnectorFn } from '@wagmi/core';
import { linea, lineaSepolia } from 'viem/chains';

// Load exactly the connector modules resolved by AppKit, not test substitutes.
const require = createRequire(import.meta.url);
const adapterEntry = require.resolve('@reown/appkit-adapter-wagmi');
const adapterRequire = createRequire(adapterEntry);

const loadConnector = async <Name extends string>(name: Name) => {
  const entry = adapterRequire.resolve(`@wagmi/connectors/${name}`);
  const module = (await import(
    /* @vite-ignore */ pathToFileURL(entry).href
  )) as Record<
    Name,
    (parameters?: Record<string, unknown>) => CreateConnectorFn
  >;
  return module[name];
};

describe('AppKit connector compatibility', () => {
  it('constructs the Base, Coinbase and Safe connectors used by the real adapter on both Linea chains', async () => {
    const baseAccount = await loadConnector('baseAccount');
    const coinbaseWallet = await loadConnector('coinbaseWallet');
    const safe = await loadConnector('safe');
    const config = createConfig({
      chains: [linea, lineaSepolia],
      transports: {
        [linea.id]: http('http://127.0.0.1:1'),
        [lineaSepolia.id]: http('http://127.0.0.1:1'),
      },
      ssr: true,
      multiInjectedProviderDiscovery: false,
      connectors: [
        baseAccount(),
        // Same shape as AppKit 2.0 for `coinbasePreference: 'eoaOnly'`.
        coinbaseWallet({ preference: { options: 'eoaOnly' } }),
        safe(),
      ],
    });
    expect(config.chains.map((chain) => chain.id)).toEqual([59144, 59141]);
    expect(config.connectors.map((connector) => connector.id)).toEqual([
      'baseAccount',
      'coinbaseWalletSDK',
      'safe',
    ]);
  });
});
