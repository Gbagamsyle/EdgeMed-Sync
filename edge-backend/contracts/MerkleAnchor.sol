// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Anchor {
    address public owner;
    mapping(string => bytes32) private merkleRoots;
    mapping(string => uint256) private anchoredAt;

    event MerkleRootAnchored(
        string indexed batchId,
        bytes32 merkleRoot,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function anchorMerkleRoot(bytes32 merkleRoot, string calldata batchId)
        external onlyOwner returns (bool)
    {
        require(merkleRoots[batchId] == bytes32(0), "Batch already anchored");
        merkleRoots[batchId] = merkleRoot;
        anchoredAt[batchId] = block.timestamp;
        emit MerkleRootAnchored(batchId, merkleRoot, block.timestamp);
        return true;
    }

    function getMerkleRoot(string calldata batchId)
        external view returns (bytes32)
    {
        return merkleRoots[batchId];
    }

    function getAnchoredAt(string calldata batchId)
        external view returns (uint256)
    {
        return anchoredAt[batchId];
    }
}
