import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createConfig, http } from '@wagmi/core';
import { linea, lineaSepolia } from 'viem/chains';

// Load exactly the connector module resolved by AppKit, not a test substitute.
const require = createRequire(import.meta.url);
const adapterEntry = require.resolve('@reown/appkit-adapter-wagmi');
const adapterRequire = createRequire(adapterEntry);
const connectorEntry = adapterRequire.resolve('@wagmi/connectors');

describe('AppKit connector compatibility', () => {
  it('constructs the Base, Coinbase and Safe connectors used by the real adapter on both Linea chains', async () => {
    const connectors = await import(
      /* @vite-ignore */ pathToFileURL(connectorEntry).href
    );
    for (const name of ['baseAccount', 'coinbaseWallet', 'safe']) {
      expect(typeof connectors[name]).toBe('function');
    }
    const config = createConfig({
      chains: [linea, lineaSepolia],
      transports: {
        [linea.id]: http('http://127.0.0.1:1'),
        [lineaSepolia.id]: http('http://127.0.0.1:1'),
      },
      ssr: true,
      multiInjectedProviderDiscovery: false,
      connectors: [
        connectors.baseAccount(),
        connectors.coinbaseWallet({ preference: 'eoaOnly' }),
        connectors.safe(),
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
