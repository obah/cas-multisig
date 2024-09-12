import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("MultisigFactory", () => {
  const deployMultisigFactory = async () => {
    const [owner, signer2, signer3] = await hre.ethers.getSigners();
    const multisigFactoryFactory = await hre.ethers.getContractFactory(
      "MultisigFactory"
    );
    const multisigFactory = await multisigFactoryFactory.deploy();

    return { multisigFactory, owner, signer2, signer3 };
  };

  describe("Deployment", () => {
    it("should deploy with 0 contract clones", async () => {
      const { multisigFactory } = await deployMultisigFactory();

      const multisigClone = await multisigFactory.getMultiSigClones();

      expect(multisigClone.length).to.equal(0);
    });
  });

  describe("CreateMultisigWallet fn", () => {
    it("should create a new multisig wallet", async () => {
      const { multisigFactory, signer3, signer2 } =
        await deployMultisigFactory();

      const quorum = 2;
      const validSigners = [signer2, signer3];

      await multisigFactory.createMultisigWallet(quorum, validSigners);

      const multisigClone = await multisigFactory.getMultiSigClones();

      expect(multisigClone.length).to.equal(1);
    });
  });

  describe("GetMultisigWallet fn", () => {
    it("should return the right number of contracts created", async () => {
      const { multisigFactory, signer3, signer2 } =
        await deployMultisigFactory();

      const quorum = 2;
      const validSigners = [signer2, signer3];

      await multisigFactory.createMultisigWallet(quorum, validSigners);
      await multisigFactory.createMultisigWallet(quorum, validSigners);

      const multisigClone = await multisigFactory.getMultiSigClones();

      expect(multisigClone.length).to.equal(2);
    });
  });
});
