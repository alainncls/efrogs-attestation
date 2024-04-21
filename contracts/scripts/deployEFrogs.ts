import { ethers, run } from 'hardhat';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function main() {
  console.log(`START EFROGS SCRIPT`);

  const { ROUTER_ADDRESS } = process.env;

  if (!ROUTER_ADDRESS || ROUTER_ADDRESS === '') {
    throw new Error('ROUTER_ADDRESS is not set in .env file');
  }

  console.log('Deploying EFrogsPortal...');

  const constructorArguments = [[], ROUTER_ADDRESS];

  const eFrogsPortal = await ethers.deployContract(
    'EFrogsPortal',
    constructorArguments,
  );
  await eFrogsPortal.waitForDeployment();
  const eFrogsPortalAddress = await eFrogsPortal.getAddress();

  await new Promise((resolve) => setTimeout(resolve, 3000));

  await run('verify:verify', {
    address: eFrogsPortalAddress,
    constructorArguments: constructorArguments,
  });

  console.log(`EFrogsPortal successfully deployed end verified!`);
  console.log(`EFrogsPortal is at ${eFrogsPortalAddress}`);

  console.log(`END EFROGS SCRIPT`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
