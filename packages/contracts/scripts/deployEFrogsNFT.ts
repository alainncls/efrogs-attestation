import hre, { network } from 'hardhat';
import { verifyContract } from '@nomicfoundation/hardhat-verify/verify';

async function main() {
  console.log(`START EFROGS SCRIPT`);

  console.log('Deploying EFrogsNFT...');

  const connection = await network.connect();
  const eFrogsNFT = await connection.viem.deployContract('EFrogsNFT');
  const eFrogsNFTAddress = eFrogsNFT.address;

  console.log(`EFrogsNFT deployed at ${eFrogsNFTAddress}`);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('Verifying contract...');
  await verifyContract(
    {
      address: eFrogsNFTAddress,
    },
    hre,
  );

  console.log(`EFrogsNFT successfully deployed and verified!`);
  console.log(`EFrogsNFT is at ${eFrogsNFTAddress}`);

  console.log(`END EFROGS SCRIPT`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
