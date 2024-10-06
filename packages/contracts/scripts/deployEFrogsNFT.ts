import { ethers, run } from 'hardhat';
import dotenv from 'dotenv';
import { Address } from 'viem';

dotenv.config({ path: '../.env' });

async function main() {
  console.log(`START EFROGS SCRIPT`);

  console.log('Deploying EFrogsNFT...');

  const eFrogsNFT = await ethers.deployContract('EFrogsNFT');
  await eFrogsNFT.waitForDeployment();
  const eFrogsNFTAddress = (await eFrogsNFT.getAddress()) as Address;

  await new Promise((resolve) => setTimeout(resolve, 3000));

  await run('verify:verify', {
    address: eFrogsNFTAddress,
  });

  console.log(`EFrogsNFT successfully deployed and verified!`);
  console.log(`EFrogsNFT is at ${eFrogsNFTAddress}`);

  console.log(`END EFROGS SCRIPT`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
