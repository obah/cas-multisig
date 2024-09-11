// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Multisig {
    uint8 public quorum;
    uint8 public noOfValidSigners;
    uint256 public txCount;

    struct Transaction {
        uint256 amount;
        address sender;
        address recipient;
        address tokenAddress;
        BaseDetails details;
    }

    struct UpdateStat {
        uint8 newQuorum;
        BaseDetails details;
    }

    struct BaseDetails {
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        address[] transactionSigners;
    }

    mapping(address => bool) public isValidSigner;
    mapping(uint => Transaction) transactions;
    // signer -> transactionId -> bool (checking if an address has signed)
    mapping(address => mapping(uint256 => bool)) hasSigned;

    mapping(uint => UpdateStat) updateRequests;

    constructor(uint8 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        require(_quorum > 1, "quorum is too small");


        for(uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed");
            require(!isValidSigner[_validSigners[i]], "signer already exist");

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = uint8(_validSigners.length);

        if (!isValidSigner[msg.sender]){
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        require(_quorum <= noOfValidSigners, "quorum greater than valid signers");
        quorum = _quorum;
    }

    function getTransaction(uint256 _txId) external view returns(Transaction memory) {
         require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "unathorized access");
        require(_txId != 0, "invalid tx id");

        Transaction memory trx = transactions[_txId];

        return trx;
    }

    function transfer(uint256 _amount, address _recipient, address _tokenAddress) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];
        
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.tokenAddress = _tokenAddress;
        trx.details.timestamp = block.timestamp;
        trx.details.transactionSigners.push(msg.sender);
        trx.details.noOfApproval += 1;
        hasSigned[msg.sender][_txId] = true;

        txCount += 1;
    }

    function approveTx(uint8 _txId) external {
        Transaction storage trx = transactions[_txId];

        require(_txId != 0, "invalid tx id");
        require(IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount, "insufficient funds");
        require(!trx.details.isCompleted, "transaction already completed");
        require(trx.details.noOfApproval < quorum, "approvals already reached");
        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        BaseDetails storage details = trx.details;

        hasSigned[msg.sender][_txId] = true;
        details.noOfApproval += 1;
        details.transactionSigners.push(msg.sender);

        if(details.noOfApproval == quorum) {
            details.isCompleted = true;
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
        }
    }

     function updateQuorum(uint8 _quorum) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "unauthorized access");
        require(_quorum != quorum, "new quorum must not be old");
        require(_quorum <= noOfValidSigners, "quorum cant be higher than noOfValidSigners");
        require(_quorum != 0, "quorum cant be 0");
        
        uint256 _reqId = txCount + 1;
        UpdateStat storage req = updateRequests[_reqId];

        req.newQuorum = _quorum;
        req.details.timestamp = block.timestamp;
        req.details.noOfApproval = req.details.noOfApproval + 1;
        req.details.transactionSigners.push(msg.sender);

        hasSigned[msg.sender][_reqId] = true;
        txCount += 1;
    }

    function approveUpdate(uint8 _reqId) external {
        UpdateStat storage req = updateRequests[_reqId];

        require(_reqId != 0, "invalid tx id");
        require(!req.details.isCompleted, "request already done");
        require(req.details.noOfApproval < quorum, "approvals already reached");
        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_reqId], "can't sign twice");

        hasSigned[msg.sender][_reqId] = true;
        req.details.noOfApproval = req.details.noOfApproval + 1;
        req.details.transactionSigners.push(msg.sender);

        if(req.details.noOfApproval == quorum) {
            req.details.isCompleted = true;
            quorum = req.newQuorum;
        }
    }

    function getRequests(uint8 _reqId) external view returns(UpdateStat memory) {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "unathorized access");
        require(_reqId != 0, "invalid tx id");

        UpdateStat memory req = updateRequests[_reqId];

        return req;
    }
}
