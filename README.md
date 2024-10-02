# Multisig Wallet Factory

This project implements a factory contract for creating and managing multiple multisignature (multisig) wallets on the Ethereum blockchain. It consists of two main contracts: [MultisigFactory.sol](https://github.com/obah/cas-multisig/blob/main/contracts/MultisigFactory.sol) which is the factory contract and [Multisig.sol](https://github.com/obah/cas-multisig/blob/main/contracts/Multisig.sol) which is the contract the factory creates.

## Contracts Documentation & Deployments

### [MultisigFactory.sol](https://github.com/obah/cas-multisig/blob/main/contracts/MultisigFactory.sol)

This contract is responsible for creating new multisig wallets and keeping track of them.

- Deployed address (Lisk Sepolia testnet): 0x92D5c5E7F5e6AA92B50EE45687D8C0212d715F82
- [Lisk Sepolia Blockscout verification link](https://sepolia-blockscout.lisk.com/address/0x92D5c5E7F5e6AA92B50EE45687D8C0212d715F82#code)

Key features:
- Creates new `Multisig` wallet instances
- Stores references to all created multisig wallets
- Allows retrieval of all created multisig wallets

### [Multisig.sol](https://github.com/obah/cas-multisig/blob/main/contracts/Multisig.sol)

This contract implements the core functionality of a multisignature wallet.

Key features:
- Configurable quorum for transaction approvals
- Support for multiple valid signers
- ERC20 token transfer functionality
- Transaction creation and approval process
- Quorum update mechanism with multi-signer approval

## Functionality

1. **Creating a Multisig Wallet**: 
   Use the `MultisigFactory` contract to create new multisig wallets with specified quorum and valid signers.

2. **Initiating Transfers**: 
   Valid signers can initiate token transfers from the multisig wallet.

3. **Approving Transactions**: 
   Other valid signers can approve pending transactions. When the quorum is reached, the transaction is executed.

4. **Updating Quorum**: 
   Valid signers can propose and approve changes to the quorum. The change is enacted when enough approvals are received.

5. **Viewing Transactions and Requests**: 
   Valid signers can view details of pending and completed transactions and quorum update requests.

## Security Features

- Checks for valid signers and prevention of duplicate approvals
- Quorum enforcement for transaction execution and wallet updates
- Balance checks to prevent overdrafts

## Setup and Installation

### Prerequisites

Ensure you have the following installed:

- Node.js
- Hardhat

### Installation

1. Clone the repository:

```shell
git clone https://github.com/obah/cas-multisig.git
cd cas-multisig
```

2. Install dependencies:

```shell
npm install
```

## Usage

Setup `hardhat.config.ts` file and deploy the `MultisigFactory` contract first, then use it to create individual `Multisig` wallet instances. Interact with each `Multisig` wallet using its specific address and the functions provided in the `Multisig` contract.

```shell
npx hardhat ignition deploy ./ignition/modules/MultisigFactory.ts
```

### Note

This code is provided as-is and should be thoroughly audited before use in production environments. Ensure proper testing and security measures are in place when dealing with digital assets.

## Test

To run the tests, use:

```shell
npx hardhat test
```
