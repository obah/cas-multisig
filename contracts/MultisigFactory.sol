// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Multisig.sol";

contract MultisigFactory {

    Multisig[] multisigClones;

    function createMultisigWallet(uint8 _quorum, address[] memory _validSigners) external returns (Multisig newMultisig_, uint256 length_) {

        newMultisig_ = new Multisig(_quorum, _validSigners);

        multisigClones.push(newMultisig_);

        length_ = multisigClones.length;
    }

    function getMultiSigClones() external view returns(Multisig[] memory) {
        return multisigClones;
    }
}