// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Anchor {
    // mapping from batchId to merkle root
    mapping(string => bytes32) private roots;

    event MerkleRootAnchored(string indexed batchId, bytes32 merkleRoot, address indexed anchoredBy);

    /**
     * anchorMerkleRoot
     * Stores a merkle root associated with a batchId. Can be called multiple times; last value wins.
     */
    function anchorMerkleRoot(bytes32 merkleRoot, string memory batchId) public returns (bool) {
        roots[batchId] = merkleRoot;
        emit MerkleRootAnchored(batchId, merkleRoot, msg.sender);
        return true;
    }

    /**
     * getMerkleRoot
     * Returns the stored merkle root for a batchId or 0x0 if not set
     */
    function getMerkleRoot(string memory batchId) public view returns (bytes32) {
        return roots[batchId];
    }
}
