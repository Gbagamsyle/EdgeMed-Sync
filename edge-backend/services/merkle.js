import { MerkleTree } from 'merkletreejs'
import crypto from 'crypto'

/**
 * SHA-256 hash function for Merkle tree
 */
const sha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest()
}

/**
 * Create Merkle tree from record hashes
 * @param {string[]} leafHashes - Array of SHA-256 hashes
 * @returns {object} tree data with root and proof structure
 */
export const createMerkleTree = (leafHashes) => {
  if (!leafHashes || leafHashes.length === 0) {
    throw new Error('Cannot create Merkle tree with empty hashes')
  }

  // Convert hex strings to buffers
  const leaves = leafHashes.map(hash => 
    Buffer.isBuffer(hash) ? hash : Buffer.from(hash, 'hex')
  )

  const tree = new MerkleTree(leaves, sha256, { sortPairs: true })
  
  return {
    root: tree.getRoot().toString('hex'),
    leaves: leafHashes,
    tree: tree // Keep reference for proof generation
  }
}

/**
 * Generate Merkle proof for a leaf
 * @param {object} merkleData - Result from createMerkleTree
 * @param {string} leafHash - Hash to generate proof for
 * @returns {string[]} Merkle proof hashes
 */
export const getMerkleProof = (merkleData, leafHash) => {
  const leaf = Buffer.isBuffer(leafHash) 
    ? leafHash 
    : Buffer.from(leafHash, 'hex')
  
  const proof = merkleData.tree.getProof(leaf)
  return proof.map(p => p.data.toString('hex'))
}

/**
 * Verify record is included in Merkle root
 * @param {string} recordHash - Individual record hash
 * @param {string[]} proof - Merkle proof
 * @param {string} root - Merkle root
 * @returns {boolean}
 */
export const verifyMerkleProof = (recordHash, proof, root) => {
  const leaf = Buffer.isBuffer(recordHash)
    ? recordHash
    : Buffer.from(recordHash, 'hex')
  
  const proofBuffers = proof.map(p => ({
    data: Buffer.from(p, 'hex')
  }))
  
  const verified = MerkleTree.verify(
    proofBuffers,
    leaf,
    sha256,
    Buffer.from(root, 'hex')
  )
  
  return verified
}
