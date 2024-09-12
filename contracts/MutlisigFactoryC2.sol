// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./Multisig.sol";

contract MultisigFactory {
    event ContractDeployed(address indexed contractAddress);

    address[] public contractAddresses;

    function createContract(
        bytes memory _bytecode,
        uint256 _salt
    ) external returns ( uint256 length_) {
        address contractAddress;

        assembly {
            contractAddress := create2(0, add(_bytecode, 0x20), mload(_bytecode), _salt)
            if iszero(extcodesize(contractAddress)) {
                revert(0, 0)
            }
        }

        contractAddresses.push(contractAddress);
        length_ = contractAddresses.length;

        emit ContractDeployed(contractAddress);
    }

    function getContracts() external view returns(address[] memory) {
        return contractAddresses;
    }
}