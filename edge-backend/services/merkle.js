import { Buffer } from 'buffer'
import { MerkleTree } from 'merkletreejs'
import crypto from 'crypto'

const fogBatches = globalThis.__edgeHealthFogBatches || (globalThis.__edgeHealthFogBatches = new Map())

/**
 * SHA-256 hash function for Merkle tree
 */
const sha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest()
}

const normalizeHash = (value) => {
  if (Buffer.isBuffer(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return Buffer.from(String(value))
  }

  let normalized = value
  if (normalized.startsWith('0x')) {
    normalized = normalized.slice(2)
  }

  if (/^[0-9a-fA-F]+$/.test(normalized) && normalized.length % 2 === 0) {
    return Buffer.from(normalized, 'hex')
  }

  return Buffer.from(normalized)
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

  const leaves = leafHashes.map(normalizeHash)
  const tree = new MerkleTree(leaves, sha256, { sortPairs: true })

  return {
    root: tree.getRoot().toString('hex'),
    leaves: leafHashes,
    tree
  }
}

/**
 * Generate Merkle proof for a leaf
 * @param {object} merkleData - Result from createMerkleTree
 * @param {string} leafHash - Hash to generate proof for
 * @returns {string[]} Merkle proof hashes
 */
export const getMerkleProof = (merkleData, leafHash) => {
  const leaf = normalizeHash(leafHash)
  const proof = merkleData.tree.getProof(leaf)
  return proof.map((p) => ({
    data: p.data.toString('hex'),
    position: p.position
  }))
}

/**
 * Verify record is included in Merkle root
 * @param {string} recordHash - Individual record hash
 * @param {string[]} proof - Merkle proof
 * @param {string} root - Merkle root
 * @returns {boolean}
 */
export const verifyMerkleProof = (recordHash, proof, root) => {
  const leaf = normalizeHash(recordHash)
  const proofEntries = (proof || []).map((p) => {
    if (typeof p === 'string') {
      return normalizeHash(p)
    }

    return normalizeHash(p?.data ?? p)
  })

  let current = leaf
  for (const sibling of proofEntries) {
    const buffers = Buffer.compare(current, sibling) === -1
      ? [current, sibling]
      : [sibling, current]

    current = sha256(Buffer.concat(buffers))
  }

  return current.equals(Buffer.from(root, 'hex'))
}

/**
 * Create a fog-backed Merkle batch for later verification.
 * The batch is kept in-memory for the current process, which is enough for
 * the local/offline integrity flow while still providing a concrete hook for
 * a future external Fog service.
 */
export const createFogBatch = (leafHashes, metadata = {}) => {
  const merkleData = createMerkleTree(leafHashes)
  const batchId = crypto.randomUUID()

  const batch = {
    batchId,
    leafHashes: [...leafHashes],
    merkleRoot: merkleData.root,
    merkleData,
    metadata,
    createdAt: new Date().toISOString()
  }

  fogBatches.set(batchId, batch)
  return batch
}

/**
 * Retrieve a fog-backed batch by ID.
 */
export const getFogBatch = (batchId) => {
  return fogBatches.get(batchId) || null
}

/**
 * Verify a leaf against a fog-backed batch.
 */
export const verifyAgainstFogBatch = (batchId, leafHash, proof = null) => {
  const batch = getFogBatch(batchId)
  if (!batch) {
    return false
  }

  if (!batch.leafHashes.includes(leafHash)) {
    return false
  }

  const proofToVerify = proof || getMerkleProof(batch.merkleData, leafHash)
  return verifyMerkleProof(leafHash, proofToVerify, batch.merkleRoot)
}
