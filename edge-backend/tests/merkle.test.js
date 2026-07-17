import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createMerkleTree,
  getMerkleProof,
  verifyMerkleProof,
  createFogBatch,
  getFogBatch,
  verifyAgainstFogBatch
} from '../services/merkle.js'

test('creates and verifies a Merkle proof', () => {
  const leafHashes = ['a1', 'b2', 'c3', 'd4']
  const tree = createMerkleTree(leafHashes)
  const proof = getMerkleProof(tree, leafHashes[1])

  assert.ok(tree.root)
  assert.ok(proof.length >= 0)
  assert.equal(verifyMerkleProof(leafHashes[1], proof, tree.root), true)
})

test('creates and retrieves a fog-backed batch for sync verification', () => {
  const leafHashes = ['hash-1', 'hash-2', 'hash-3']
  const batch = createFogBatch(leafHashes, { source: 'sync', recordCount: leafHashes.length })
  const stored = getFogBatch(batch.batchId)
  const proof = getMerkleProof(stored.merkleData, leafHashes[2])

  assert.ok(batch.batchId)
  assert.equal(stored.leafHashes.length, leafHashes.length)
  assert.equal(verifyAgainstFogBatch(batch.batchId, leafHashes[2], proof), true)
})
