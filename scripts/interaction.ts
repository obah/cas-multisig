import { ethers } from "hardhat";

async function main() {
  const multisigFactoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  //!this is wrong tho, it was meant to be interface and not the contract itself
  const multisigFactory = await ethers.getContractAt(
    "MultisigFactory",
    multisigFactoryAddress
  );

  const numOfClones = await multisigFactory.getMultiSigClones();

  console.log("===========================================================");
  console.log("current number of clones:", numOfClones.length);

  const quorum = 2;

  const walletSigners = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  ];

  const createContractTx = await multisigFactory.createMultisigWallet(
    quorum,
    walletSigners
  );
  createContractTx.wait();

  const numOfClones2 = await multisigFactory.getMultiSigClones();

  console.log("===========================================================");
  console.log("Deployed contract is", numOfClones2[numOfClones2.length - 1]);

  console.log("===========================================================");
  console.log("current number of clones:", numOfClones2.length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
