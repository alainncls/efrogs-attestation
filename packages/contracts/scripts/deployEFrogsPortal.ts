import hre, { network } from 'hardhat';
import { verifyContract } from '@nomicfoundation/hardhat-verify/verify';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { isAddress, isHex, type Address, type Hex } from 'viem';

function requireAddress(value: string | undefined, name: string): Address {
  if (!value || !isAddress(value)) {
    throw new Error(`${name} must be a valid address, got: ${value}`);
  }
  return value;
}

function requireHex(value: string | undefined, name: string): Hex {
  if (!value || !isHex(value)) {
    throw new Error(`${name} must be a valid hex string, got: ${value}`);
  }
  return value;
}

async function main() {
  console.log(`START EFROGS SCRIPT`);

  const routerAddress = requireAddress(
    process.env.ROUTER_ADDRESS,
    'ROUTER_ADDRESS',
  );
  const eFrogsAddress = requireAddress(
    process.env.EFROGS_ADDRESS,
    'EFROGS_ADDRESS',
  );
  const privateKey = requireHex(process.env.PRIVATE_KEY, 'PRIVATE_KEY');

  console.log('Deploying EFrogsPortal...');

  const connection = await network.connect();
  const constructorArguments: [Address[], Address, Address] = [
    [],
    routerAddress,
    eFrogsAddress,
  ];

  const eFrogsPortal = await connection.viem.deployContract(
    'EFrogsPortal',
    constructorArguments,
  );
  const eFrogsPortalAddress = eFrogsPortal.address;

  console.log(`EFrogsPortal deployed at ${eFrogsPortalAddress}`);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('Verifying contract...');
  await verifyContract(
    {
      address: eFrogsPortalAddress,
      constructorArgs: [...constructorArguments],
    },
    hre,
  );

  console.log(`EFrogsPortal successfully deployed and verified!`);
  console.log(`EFrogsPortal is at ${eFrogsPortalAddress}`);

  console.log('Registering EFrogsPortal...');

  const networkName = connection.networkName;
  const [walletClient] = await connection.viem.getWalletClients();
  const walletAddress = walletClient.account.address;

  const veraxSdk = new VeraxSdk(
    networkName === 'linea'
      ? VeraxSdk.DEFAULT_LINEA_MAINNET
      : VeraxSdk.DEFAULT_LINEA_SEPOLIA,
    walletAddress,
    privateKey,
  );

  await veraxSdk.portal.register(
    eFrogsPortalAddress,
    'eFrogs Portal V2',
    'eFrogs attestations V2',
    true,
    'alain.linea.eth',
    { waitForConfirmation: true },
  );

  console.log(`EFrogsPortal is registered!`);

  console.log(`END EFROGS SCRIPT`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
