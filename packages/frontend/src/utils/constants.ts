export const TRANSACTION_VALUE = 100000000000000n;

export const TESTNET_EFROGS_CONTRACT =
  '0x35c134262605bc69B3383EA132A077d09d8df061';
export const EFROGS_CONTRACT = '0x194395587d7b169e63eaf251e86b1892fa8f1960';

export const TESTNET_PORTAL_ADDRESS =
  '0xF513131AdFe9Aa690975956d32fB3275d6cca7e5';
export const PORTAL_ADDRESS = '0xA49C247221C358c8cF6c4EbF3C89adE23AbE318D';

export const SCHEMA_ID =
  '0x5dc8bc9158dd69ee8a234bb8f9ab1f4f17bb52c84b6fd4720d58ec82bb43d2f5';

const graphApiKey = import.meta.env.VITE_GRAPH_API_KEY;

if (!graphApiKey) {
  throw new Error('Missing VITE_GRAPH_API_KEY environment variable');
}

export const LINEA_MAINNET_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${graphApiKey}/subgraphs/id/ESRDQ5djmucKeqxNz7JGVHr621sjGEEsY6M6JibjJ9u3`;

export const LINEA_SEPOLIA_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${graphApiKey}/subgraphs/id/2gfRmZ1e1uJKpCQsUrvxJmRivNa7dvvuULoc8SJabR8v`;

export const EFROGS_PORTAL_ABI = [
  {
    type: 'function',
    name: 'attest',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'attestationPayload',
        type: 'tuple',
        components: [
          { name: 'schemaId', type: 'bytes32' },
          { name: 'expirationDate', type: 'uint64' },
          { name: 'subject', type: 'bytes' },
          { name: 'attestationData', type: 'bytes' },
        ],
      },
      { name: 'validationPayloads', type: 'bytes[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'attestV2',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'attestationPayload',
        type: 'tuple',
        components: [
          { name: 'schemaId', type: 'bytes32' },
          { name: 'expirationDate', type: 'uint64' },
          { name: 'subject', type: 'bytes' },
          { name: 'attestationData', type: 'bytes' },
        ],
      },
      { name: 'validationPayloads', type: 'bytes[]' },
    ],
    outputs: [],
  },
] as const;

export const EFROGS_NFT_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'createToken',
    stateMutability: 'payable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
  },
] as const;
