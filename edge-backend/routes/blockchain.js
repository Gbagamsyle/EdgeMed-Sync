import express from 'express'
import { getSupabase } from '../services/supabaseClient.js'
import { fetchOnChainMerkleRoot, anchorMerkleRoot, isBlockchainConfigured } from '../services/blockchain.js'
import { createMerkleTree, getMerkleProof, verifyMerkleProof } from '../services/merkle.js'

const router = express.Router()

/**
 * POST /api/blockchain/anchor
 * Submit Merkle root to blockchain via deployed anchor contract
 */
router.post('/anchor', async (req, res) => {
  try {
    if (!isBlockchainConfigured()) {
      return res.status(500).json({ error: 'Blockchain configuration missing. Set BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, and BLOCKCHAIN_CONTRACT_ADDRESS.' })
    }

    const { batchId, merkleRoot } = req.body

    if (!batchId || !merkleRoot) {
      return res.status(400).json({ error: 'batchId and merkleRoot required' })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { data: batch, error: batchError } = await supabase
      .from('merkle_batches')
      .select('*')
      .eq('batch_id', batchId)
      .single()

    if (batchError || !batch) {
      return res.status(404).json({ error: 'Merkle batch not found' })
    }

    if (batch.merkle_root !== merkleRoot) {
      return res.status(400).json({ error: 'Provided merkleRoot does not match stored batch root' })
    }

    const result = await anchorMerkleRoot(batchId, merkleRoot)

    const { error: updateError } = await supabase
      .from('merkle_batches')
      .update({
        anchored: true,
        anchor_tx_hash: result.transactionHash,
        anchor_block_number: result.blockNumber,
        anchor_status: result.status ? 'confirmed' : 'failed'
      })
      .eq('batch_id', batchId)

    if (updateError) {
      console.warn('[BLOCKCHAIN] Anchor stored but failed to update batch metadata', updateError)
    }

    res.json({
      status: result.status ? 'anchored' : 'failed',
      batchId,
      merkleRoot,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      message: result.status ? 'Merkle root anchored on-chain' : 'Anchor transaction failed'
    })
  } catch (err) {
    console.error('[BLOCKCHAIN] Anchor error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/blockchain/verify/:recordId
 * Verify record tamper status by checking against on-chain Merkle root
 */
router.get('/verify/:recordId', async (req, res) => {
  try {
    if (!isBlockchainConfigured()) {
      return res.status(500).json({ error: 'Blockchain configuration missing. Set BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, and BLOCKCHAIN_CONTRACT_ADDRESS.' })
    }

    const { recordId } = req.params
    if (!recordId) {
      return res.status(400).json({ error: 'recordId required' })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { data: record, error: recordError } = await supabase
      .from('records')
      .select('*')
      .eq('record_id', recordId)
      .single()

    if (recordError || !record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    if (!record.sha256_hash) {
      return res.status(400).json({ error: 'Record does not include sha256_hash' })
    }

    const { data: batch, error: batchError } = await supabase
      .from('merkle_batches')
      .select('*')
      .contains('leaf_hashes', [record.sha256_hash])
      .single()

    if (batchError || !batch) {
      return res.status(404).json({ error: 'Merkle batch containing record not found' })
    }

    if (!batch.anchored) {
      return res.status(400).json({ error: 'Merkle batch is not anchored on-chain yet' })
    }

    const proofData = getMerkleProof(createMerkleTree(batch.leaf_hashes), record.sha256_hash)
    const onChainRoot = await fetchOnChainMerkleRoot(batch.batch_id)
    const localVerified = verifyMerkleProof(record.sha256_hash, proofData, onChainRoot)

    res.json({
      recordId,
      batchId: batch.batch_id,
      storedRoot: batch.merkle_root,
      onChainRoot,
      proof: proofData,
      tamperVerified: localVerified,
      message: localVerified ? 'Record matches on-chain merkle root' : 'Record verification failed against on-chain root'
    })
  } catch (err) {
    console.error('[BLOCKCHAIN] Verify error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
