// @vitest-environment node
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VeraxSdk,
  type Attestation,
  type Conf,
  type Schema,
} from '@verax-attestation-registry/verax-sdk';
import {
  EFROGS_PORTAL_ABI,
  PORTAL_ADDRESS,
  SCHEMA_ID,
  TRANSACTION_VALUE,
} from './utils/constants.ts';
import { encodeEfrogsAttestationData } from './utils/attestationPayload.ts';
import { linea, lineaSepolia } from 'wagmi/chains';

const ABI_SCHEMA = 'address contract,uint256 balance';
const NFT = '0x194395587d7b169e63eaf251e86b1892fa8f1960' as const;
const SUBJECT = '0x2222222222222222222222222222222222222222' as const;
const ATTESTER = '0x1111111111111111111111111111111111111111' as const;
const BALANCE = 7n;
const TX_RESULT = `0x${'0'.repeat(64)}` as const;

type GraphqlMode =
  'attestations' | 'empty' | 'invalid-data' | 'http-error' | 'interrupt';

let server: ReturnType<typeof createServer>;
let baseUrl: string;
let graphqlMode: GraphqlMode;
let rpcMethods: string[];
let rpcChainIds: number[];

const readBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
};

const schemaRecord = (): Schema => ({
  id: SCHEMA_ID,
  name: 'EFrogs ownership',
  description: 'Verified NFT ownership',
  context: 'https://example.test',
  schema: ABI_SCHEMA,
  attestationCounter: 1,
});

const attestationRecord = (sdk: VeraxSdk): Attestation => ({
  id: `0x${'ab'.repeat(32)}`,
  attestationId: `0x${'ab'.repeat(32)}`,
  replacedBy: `0x${'00'.repeat(32)}`,
  attester: ATTESTER,
  attestedDate: 1,
  expirationDate: 2_000_000_000,
  revocationDate: 0,
  version: 1,
  revoked: false,
  subject: SUBJECT,
  encodedSubject: '0x',
  attestationData: sdk.utils.encode(ABI_SCHEMA, [NFT, BALANCE]),
  decodedData: [],
  decodedPayload: {},
  schema: schemaRecord(),
  portal: {
    id: PORTAL_ADDRESS,
    ownerAddress: ATTESTER,
    modules: [],
    isRevocable: false,
    name: 'EFrogs portal',
    description: 'Local test portal',
    ownerName: 'Test',
    attestationCounter: 1,
  },
});

const createSdk = (conf: Conf): VeraxSdk =>
  new VeraxSdk({
    ...conf,
    rpcUrl: `${baseUrl}/rpc/${conf.chain.id}`,
    subgraphUrl: `${baseUrl}/graphql`,
  });

describe('Verax SDK EFrogs schema against local GraphQL and JSON-RPC', () => {
  beforeEach(async () => {
    vi.stubGlobal('window', {});
    graphqlMode = 'attestations';
    rpcMethods = [];
    rpcChainIds = [];

    server = createServer(async (request, response) => {
      const body = await readBody(request);
      if (request.url === '/graphql') {
        if (graphqlMode === 'interrupt') {
          request.socket.destroy();
          return;
        }
        if (graphqlMode === 'http-error') {
          response.writeHead(503, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ errors: [{ message: 'offline' }] }));
          return;
        }

        const sdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_MAINNET);
        const query = JSON.parse(body).query as string;
        const data = query.includes('query get_schema')
          ? { schema: schemaRecord() }
          : graphqlMode === 'empty'
            ? { attestations: [] }
            : {
                attestations: [
                  graphqlMode === 'invalid-data'
                    ? { ...attestationRecord(sdk), attestationData: '0xdead' }
                    : attestationRecord(sdk),
                ],
              };

        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ data }));
        return;
      }

      const rpc = JSON.parse(body) as { id: number; method: string };
      const path = request.url?.split('/') ?? [];
      const chainId = Number(path[path.length - 1]);
      rpcMethods.push(rpc.method);
      rpcChainIds.push(chainId);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          jsonrpc: '2.0',
          id: rpc.id,
          result:
            rpc.method === 'eth_chainId'
              ? `0x${chainId.toString(16)}`
              : TX_RESULT,
        }),
      );
    });

    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it('queries and decodes the real two-field EFrogs schema', async () => {
    const sdk = createSdk(VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND);
    const attestations = await sdk.attestation.findBy(1, 0, {
      subject: SUBJECT,
    });

    expect(attestations).toHaveLength(1);
    const decoded = attestations[0]?.decodedPayload as
      { contract: string; balance: bigint }[] | undefined;
    expect(decoded).toHaveLength(1);
    expect(decoded?.[0]?.contract.toLowerCase()).toBe(NFT.toLowerCase());
    expect(decoded?.[0]?.balance).toBe(BALANCE);
  });

  it('preserves an empty successful result', async () => {
    graphqlMode = 'empty';
    const sdk = createSdk(VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND);

    await expect(sdk.attestation.findBy(1, 0)).resolves.toEqual([]);
  });

  it('does not decode invalid ABI bytes as valid ownership data', async () => {
    graphqlMode = 'invalid-data';
    const sdk = createSdk(VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND);
    const attestations = await sdk.attestation.findBy(1, 0);

    expect(attestations[0]?.attestationData).toBe('0xdead');
    expect(attestations[0]?.decodedPayload).toEqual([]);
  });

  it('surfaces GraphQL HTTP errors and interrupted transports', async () => {
    graphqlMode = 'http-error';
    const httpSdk = createSdk(VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND);
    await expect(httpSdk.attestation.findBy(1, 0)).rejects.toThrow('503');

    graphqlMode = 'interrupt';
    const interruptedSdk = createSdk(VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND);
    await expect(interruptedSdk.attestation.findBy(1, 0)).rejects.toThrow();
  });

  it.each([
    ['Linea Mainnet', VeraxSdk.DEFAULT_LINEA_MAINNET, linea.id],
    ['Linea Sepolia', VeraxSdk.DEFAULT_LINEA_SEPOLIA, lineaSepolia.id],
  ] as const)(
    'prepares the actual EFrogs custom-ABI call on %s without signing',
    async (_name, network, chainId) => {
      const sdk = createSdk(network);
      const data = encodeEfrogsAttestationData(NFT, BALANCE);
      const request = await sdk.portal.simulateAttest(
        PORTAL_ADDRESS,
        {
          schemaId: SCHEMA_ID,
          expirationDate: 2_000_000_000,
          subject: SUBJECT,
          attestationData: data,
        },
        [],
        {
          customAbi: EFROGS_PORTAL_ABI,
          value: TRANSACTION_VALUE,
        },
      );

      expect(request.functionName).toBe('attest');
      expect(JSON.stringify(request.args)).toContain(
        sdk.utils.encode(ABI_SCHEMA, [NFT, BALANCE]),
      );
      expect(rpcMethods).toContain('eth_call');
      expect(rpcChainIds.every((seen) => seen === chainId)).toBe(true);
      expect(chainId).toBe(network.chain.id);
    },
  );
});
