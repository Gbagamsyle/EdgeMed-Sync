import { describe, expect, test } from '@jest/globals'
import {
  createMerkleTree,
  getMerkleProof,
  verifyMerkleProof,
  createFogBatch,
  getFogBatch,
  verifyAgainstFogBatch,
} from '../services/merkle.js'

describe('Merkle Tree', () => {
  test('creates and verifies a Merkle proof', () => {
    const leafHashes = ['a1', 'b2', 'c3', 'd4']
    const tree = createMerkleTree(leafHashes)
    const proof = getMerkleProof(tree, leafHashes[1])

    expect(tree.root).toBeTruthy()
    expect(proof.length).toBeGreaterThanOrEqual(0)
    expect(verifyMerkleProof(leafHashes[1], proof, tree.root)).toBe(true)
  })

  test('creates and retrieves a fog-backed batch for sync verification', () => {
    const leafHashes = ['hash-1', 'hash-2', 'hash-3']
    const batch = createFogBatch(leafHashes, { source: 'sync', recordCount: leafHashes.length })
    const stored = getFogBatch(batch.batchId)
    const proof = getMerkleProof(stored.merkleData, leafHashes[2])

    expect(batch.batchId).toBeTruthy()
    expect(stored.leafHashes.length).toBe(leafHashes.length)
    expect(verifyAgainstFogBatch(batch.batchId, leafHashes[2], proof)).toBe(true)
  })
})
