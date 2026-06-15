import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { createMerkleTree, getMerkleProof, verifyMerkleProof } from '../services/merkle.js'
import { getSupabase } from '../services/supabaseClient.js'

const router = express.Router()

/**
 * POST /api/merkle/batch
 * Build a Merkle tree from queued record hashes
 * TODO: Hook to Fog layer when available
 */
router.post('/batch', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { recordHashes } = req.body

    if (!recordHashes || !Array.isArray(recordHashes) || recordHashes.length === 0) {
      return res.status(400).json({ error: 'recordHashes array required' })
    }

    // Create Merkle tree
    const merkleData = createMerkleTree(recordHashes)
    const batchId = uuidv4()

    // Store batch metadata
    const { error: insertError } = await supabase
      .from('merkle_batches')
      .insert([
        {
          batch_id: batchId,
          leaf_hashes: recordHashes,
          merkle_root: merkleData.root,
          record_count: recordHashes.length,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({ error: 'Failed to store batch' })
    }

    res.json({
      batch_id: batchId,
      merkle_root: merkleData.root,
      leaf_count: recordHashes.length,
      message: 'Merkle batch created'
    })
  } catch (err) {
    console.error('[MERKLE] Batch error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/merkle/proof
 * Generate Merkle proof for a leaf
 */
router.post('/proof', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { batchId, leafHash } = req.body

    if (!batchId || !leafHash) {
      return res.status(400).json({ error: 'batchId and leafHash required' })
    }

    // Fetch batch
    const { data: batch, error: fetchError } = await supabase
      .from('merkle_batches')
      .select('*')
      .eq('batch_id', batchId)
      .single()

    if (fetchError || !batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    // Recreate merkle tree
    const merkleData = createMerkleTree(batch.leaf_hashes)

    // Get proof
    const proof = getMerkleProof(merkleData, leafHash)

    res.json({
      proof,
      merkle_root: merkleData.root,
      message: 'Merkle proof generated'
    })
  } catch (err) {
    console.error('[MERKLE] Proof error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/merkle/verify
 * Verify a leaf is in the tree
 */
router.post('/verify', async (req, res) => {
  try {
    const { leafHash, proof, merkleRoot } = req.body

    if (!leafHash || !proof || !merkleRoot) {
      return res.status(400).json({ error: 'leafHash, proof, and merkleRoot required' })
    }

    const isValid = verifyMerkleProof(leafHash, proof, merkleRoot)

    res.json({
      valid: isValid,
      message: isValid ? 'Proof verified' : 'Proof invalid'
    })
  } catch (err) {
    console.error('[MERKLE] Verify error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
