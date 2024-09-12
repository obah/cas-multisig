// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./Multisig.sol";

contract MultisigFactory {
    Multisig[] public multisigContracts; 

    function createContract(
        uint8 _quorum,
        address[] memory _validSigners
    ) external returns (
        Multisig newMultisig_,
        uint256 length_) 
    {
        newMultisig_ = new Multisig(_quorum, _validSigners);

        multisigContracts.push(newMultisig_);

        length_ = multisigContracts.length;
    }

    function getContracts() external view returns(Multisig[] memory) {
        return multisigContracts;
    }
}