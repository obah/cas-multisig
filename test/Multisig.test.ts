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
  });

  describe("approve fn", () => {
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
      expect(trx.noOfApproval).to.equal(2);
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
      expect(trx.isCompleted).to.equal(true);
    });
  });

  describe("updateQuorum fn", () => {
    it("should initiate an update request", async () => {
      const { multisig } = await loadFixture(deployMultisig);

      const newQuorum = 1;

      await multisig.updateQuorum(newQuorum);

      const request = await multisig.getRequests(1);
      expect(request.newQuorum).to.equal(newQuorum);
      expect(multisig.txCount).to.equal(1);
    });
  });

  // describe("Deposit", function () {
  //   it("Should deposit successfully", async function () {
  //     const { saveErc20, owner, otherAccount, token } = await loadFixture(deploySaveERC20);

  //     // Transfer erc20 tokens from the owner to otherAccount
  //     const trfAmount = ethers.parseUnits("100", 18);
  //     await token.transfer(otherAccount, trfAmount);
  //     expect(await token.balanceOf(otherAccount)).to.equal(trfAmount);

  //     // using otherAccount to approve the SaveErc20 contract to spend token
  //     await token.connect(otherAccount).approve(saveErc20, trfAmount);

  //     const otherAccountBalBefore = await token.balanceOf(otherAccount);

  //     const depositAmount = ethers.parseUnits("10", 18);

  //     // Using the otherAccount to call the deposit function
  //     await saveErc20.connect(otherAccount).deposit(depositAmount);

  //     expect(await token.balanceOf(otherAccount)).to.equal(otherAccountBalBefore - depositAmount);

  //     expect(await saveErc20.connect(otherAccount).myBalance()).to.equal(depositAmount);
  //     expect(await saveErc20.getContractBalance()).to.equal(depositAmount);
  //   });

  //   it("Should emit an event after successful deposit", async function () {
  //     const { saveErc20, otherAccount, token } = await loadFixture(deploySaveERC20);

  //     const trfAmount = ethers.parseUnits("100", 18);
  //     await token.transfer(otherAccount, trfAmount);

  //     await token.connect(otherAccount).approve(saveErc20, trfAmount);

  //     const depositAmount = ethers.parseUnits("10", 18);

  //     await expect(saveErc20.connect(otherAccount).deposit(depositAmount))
  //       .to.emit(saveErc20, "DepositSuccessful")
  //       .withArgs(otherAccount.address, depositAmount);
  //   });

  //   it("Should revert on zero deposit", async function () {
  //     const { saveErc20, otherAccount, token } = await loadFixture(deploySaveERC20);

  //     const depositAmount = ethers.parseUnits("0", 18);

  //     await expect(
  //       saveErc20.connect(otherAccount).deposit(depositAmount)
  //     ).to.be.revertedWithCustomError(saveErc20, "ZeroValueNotAllowed");
  //   });
  // });

  // describe("Withdraw", function () {
  //   it("Should deposit successfully", async function () {
  //     const { saveErc20, owner, otherAccount, token } = await loadFixture(deploySaveERC20);

  //     // Transfer ERC20 token from owner to otherAccount
  //     const trfAmount = ethers.parseUnits("100", 18);
  //     await token.transfer(otherAccount, trfAmount);
  //     expect(await token.balanceOf(otherAccount)).to.equal(trfAmount);

  //     // otherAccount approves contract address to spend some tokens
  //     await token.connect(otherAccount).approve(saveErc20, trfAmount);

  //     const otherAccountBalBefore = await token.balanceOf(otherAccount);

  //     // otherAccount deposits into SaveERC20 contract
  //     const depositAmount = ethers.parseUnits("10", 18);

  //     await saveErc20.connect(otherAccount).deposit(depositAmount);

  //     expect(await token.balanceOf(otherAccount)).to.equal(otherAccountBalBefore - depositAmount);

  //     expect(await saveErc20.connect(otherAccount).myBalance()).to.equal(depositAmount);
  //     expect(await saveErc20.getContractBalance()).to.equal(depositAmount);

  //     // otherAccount withdraw from contract
  //     const initBalBeforeWithdrawal = await token.balanceOf(otherAccount);
  //     const withdrawAmount = ethers.parseUnits("5", 18);

  //     await saveErc20.connect(otherAccount).withdraw(withdrawAmount);

  //     const balAfterWithdrawal = await token.balanceOf(otherAccount);

  //     expect(await saveErc20.getContractBalance()).to.equal(depositAmount - withdrawAmount);

  //     expect(await saveErc20.connect(otherAccount).myBalance()).to.equal(depositAmount - withdrawAmount);

  //     expect(await token.balanceOf(otherAccount)).to.equal(initBalBeforeWithdrawal + withdrawAmount);
  //   });
  // });
});
