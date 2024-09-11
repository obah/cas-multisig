import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Multisig", () => {
  async function deployToken() {
    const erc20Token = await hre.ethers.getContractFactory("TokenX");
    const token = await erc20Token.deploy();

    return { token };
  }

  async function deployMultisig() {
    const [owner, signer2, signer3, newAccount1] =
      await hre.ethers.getSigners();

    const { token } = await loadFixture(deployToken);
    const quorum = 2;
    const validSigners = [signer2, signer3];

    const multisigFactory = await hre.ethers.getContractFactory("Multisig");
    const multisig = await multisigFactory.deploy(quorum, validSigners);

    return {
      multisig,
      owner,
      signer2,
      signer3,
      newAccount1,
      quorum,
      validSigners,
      token,
    };
  }

  describe("Deployment", () => {
    it("Should check if quorum is correct", async () => {
      const { multisig, quorum } = await loadFixture(deployMultisig);

      expect(await multisig.quorum()).to.equal(quorum);
    });

    it("Should check if signers are correctly set", async function () {
      const { multisig } = await loadFixture(deployMultisig);

      expect(await multisig.noOfValidSigners()).to.equal(3);
    });

    it("should check if the right addresses are signers and no other addresses", async () => {
      const { multisig, owner, signer2, signer3, newAccount1 } =
        await loadFixture(deployMultisig);

      expect(await multisig.isValidSigner(owner)).to.equal(true);
      expect(await multisig.isValidSigner(signer2)).to.equal(true);
      expect(await multisig.isValidSigner(signer3)).to.equal(true);
      expect(await multisig.isValidSigner(newAccount1)).to.equal(false);
    });
  });

  describe("Transfer fn", () => {
    it("should initiate a transaction successfully", async () => {
      const { multisig, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      const recipient = newAccount1;
      const tokenAddress = token;

      await token.transfer(multisig, amount);
      expect(await token.balanceOf(multisig)).to.equal(amount);

      await multisig.transfer(txAmount, recipient, tokenAddress);
      expect(await multisig.txCount()).to.equal(1);
    });

    it("should not initiate a transaction with insufficient funds", async () => {
      const { multisig, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const recipient = newAccount1;

      await expect(
        multisig.transfer(amount, recipient, token)
      ).to.be.revertedWith("insufficient funds");
    });

    it("should not complete a transaction till required signers approve it", async () => {
      const { multisig, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);

      await token.transfer(multisig, amount);
      expect(await token.balanceOf(multisig)).to.equal(amount);

      await multisig.transfer(txAmount, newAccount1, token);
      const trx = await multisig.getTransaction(1);
      expect(trx.details.isCompleted).to.equal(false);
    });

    it("should not allow address 0 as any address input", async () => {
      const { multisig, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const addressZero = ethers.ZeroAddress;
      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      await token.transfer(multisig, amount);

      await expect(
        multisig.transfer(txAmount, addressZero, token)
      ).to.be.revertedWith("address zero found");

      await expect(
        multisig.transfer(txAmount, newAccount1, addressZero)
      ).to.be.revertedWith("address zero found");
    });
  });

  describe("ApproveTransfer fn", () => {
    it("should approve a transaction", async () => {
      const { multisig, signer2, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      const recipient = newAccount1;
      const tokenAddress = token;

      await token.transfer(multisig, amount);
      expect(await token.balanceOf(multisig)).to.equal(amount);

      await multisig.transfer(txAmount, recipient, tokenAddress);
      expect(await multisig.txCount()).to.equal(1);

      await multisig.connect(signer2).approveTx(1);
      const trx = await multisig.getTransaction(1);
      expect(trx.details.noOfApproval).to.equal(2);
    });

    it("should complete a transaction when all signers sign", async () => {
      const { multisig, signer2, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      const recipient = newAccount1;
      const tokenAddress = token;

      await token.transfer(multisig, amount);
      expect(await token.balanceOf(multisig)).to.equal(amount);

      await multisig.transfer(txAmount, recipient, tokenAddress);
      expect(await multisig.txCount()).to.equal(1);

      await multisig.connect(signer2).approveTx(1);
      const trx = await multisig.getTransaction(1);
      expect(trx.details.isCompleted).to.equal(true);
      expect(await token.balanceOf(recipient)).to.greaterThanOrEqual(txAmount);
    });

    it("should not allow a non wallet member to sign", async () => {
      const { multisig, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      const recipient = newAccount1;
      const tokenAddress = token;

      await token.transfer(multisig, amount);
      expect(await token.balanceOf(multisig)).to.equal(amount);

      await multisig.transfer(txAmount, recipient, tokenAddress);

      await expect(
        multisig.connect(newAccount1).approveTx(1)
      ).to.be.revertedWith("not a valid signer");
    });

    it("should not allow the same account to sign multiple times", async () => {
      const { multisig, newAccount1, token } = await loadFixture(
        deployMultisig
      );

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      const recipient = newAccount1;
      const tokenAddress = token;

      await token.transfer(multisig, amount);
      await multisig.transfer(txAmount, recipient, tokenAddress);

      await expect(multisig.approveTx(1)).to.be.revertedWith(
        "can't sign twice"
      );
    });

    it("should not allow a completed transaction to be approved again", async () => {
      const { multisig, newAccount1, token, signer2, signer3 } =
        await loadFixture(deployMultisig);

      const amount = ethers.parseUnits("100", 18);
      const txAmount = ethers.parseUnits("10", 18);
      const recipient = newAccount1;
      const tokenAddress = token;

      await token.transfer(multisig, amount);
      await multisig.transfer(txAmount, recipient, tokenAddress);
      await multisig.connect(signer2).approveTx(1);

      await expect(multisig.connect(signer3).approveTx(1)).to.be.revertedWith(
        "transaction already completed"
      );
    });
  });

  describe("updateQuorum fn", () => {
    it("should initiate an update request", async () => {
      const { multisig } = await loadFixture(deployMultisig);

      const newQuorum = 1;

      await multisig.updateQuorum(newQuorum);

      const request = await multisig.getRequests(1);
      expect(request.newQuorum).to.equal(newQuorum);
      expect(await multisig.txCount()).to.equal(1);

      const newQuorum2 = 3;

      await multisig.updateQuorum(newQuorum2);
      expect(await multisig.txCount()).to.equal(2);
    });

    it("should not allow a non member to initiate update quorum", async () => {
      const { multisig, newAccount1 } = await loadFixture(deployMultisig);

      await expect(
        multisig.connect(newAccount1).updateQuorum(1)
      ).to.be.revertedWith("unauthorized access");
    });

    it("should not allow a new quorum more than noOfValidSigners", async () => {
      const { multisig } = await loadFixture(deployMultisig);

      await expect(multisig.updateQuorum(10)).to.be.revertedWith(
        "quorum cant be higher than noOfValidSigners"
      );
    });
  });

  describe("approveUpdate fn", () => {
    it("should approve the update request", async () => {
      const { multisig, signer2 } = await loadFixture(deployMultisig);

      await multisig.updateQuorum(1);
      await multisig.connect(signer2).approveUpdate(1);

      const req = await multisig.getRequests(1);
      expect(req.details.noOfApproval).to.equal(2);
    });

    it("should update the quorum when all signers sign", async () => {
      const { multisig, signer2 } = await loadFixture(deployMultisig);

      await multisig.updateQuorum(1);
      await multisig.connect(signer2).approveUpdate(1);

      const req = await multisig.getRequests(1);
      expect(req.details.isCompleted).to.equal(true);
      expect(await multisig.quorum()).to.equal(1);
    });

    it("should not allow a non wallet member to sign", async () => {
      const { multisig, newAccount1 } = await loadFixture(deployMultisig);

      await multisig.updateQuorum(1);

      await expect(
        multisig.connect(newAccount1).approveUpdate(1)
      ).to.be.revertedWith("not a valid signer");
    });
  });
});
