import { ethers, network, run } from 'hardhat';
import dotenv from 'dotenv';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { Address, Hex } from 'viem';

dotenv.config({ path: '../.env' });

async function main() {
  console.log(`START EFROGS SCRIPT`);

  const { ROUTER_ADDRESS, PRIVATE_KEY, EFROGS_ADDRESS } = process.env;

  if (!ROUTER_ADDRESS || ROUTER_ADDRESS === '') {
    throw new Error('ROUTER_ADDRESS is not set in .env file');
  }

  if (!PRIVATE_KEY || PRIVATE_KEY === '') {
    throw new Error('PRIVATE_KEY is not set in .env file');
  }

  console.log('Deploying EFrogsPortal...');

  const constructorArguments = [[], ROUTER_ADDRESS, EFROGS_ADDRESS];

  const eFrogsPortal = await ethers.deployContract(
    'EFrogsPortal',
    constructorArguments,
  );
  await eFrogsPortal.waitForDeployment();
  const eFrogsPortalAddress = (await eFrogsPortal.getAddress()) as Address;

  await new Promise((resolve) => setTimeout(resolve, 3000));

  await run('verify:verify', {
    address: eFrogsPortalAddress,
    constructorArguments: constructorArguments,
  });

  console.log(`EFrogsPortal successfully deployed and verified!`);
  console.log(`EFrogsPortal is at ${eFrogsPortalAddress}`);

  console.log('Registering EFrogsPortal...');

  const chainName = network.name;
  const signers = await ethers.getSigners();
  const signer = signers[0];
  const veraxSdk = new VeraxSdk(
    chainName === 'linea'
      ? VeraxSdk.DEFAULT_LINEA_MAINNET
      : VeraxSdk.DEFAULT_LINEA_SEPOLIA,
    signer.address as Address,
    PRIVATE_KEY as Hex,
  );

  await veraxSdk.portal.register(
    eFrogsPortalAddress,
    'eFrogs Portal',
    'eFrogs attestations',
    true,
    'alainnicolas.eth',
    true,
  );

  console.log(`EFrogsPortal is registered!`);

  console.log(`END EFROGS SCRIPT`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
