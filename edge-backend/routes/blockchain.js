import express from 'express'

const router = express.Router()

/**
 * POST /api/blockchain/anchor
 * Submit Merkle root to blockchain (Sepolia)
 * TODO: Integrate ethers.js once contract is deployed
 */
router.post('/anchor', async (req, res) => {
  try {
    const { batchId, merkleRoot } = req.body

    if (!batchId || !merkleRoot) {
      return res.status(400).json({ error: 'batchId and merkleRoot required' })
    }

    // TODO: Call smart contract via ethers.js
    // For now, return placeholder
    res.json({
      status: 'pending',
      batchId,
      merkleRoot,
      message: 'Blockchain integration pending (Phase 6)'
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
    const { recordId } = req.params

    // TODO: Implement tamper verification logic
    // 1. Fetch record from DB
    // 2. Recompute hash
    // 3. Fetch Merkle root from blockchain
    // 4. Verify hash is in tree
    // 5. Return tamper status

    res.json({
      status: 'pending',
      recordId,
      message: 'Tamper verification pending (Phase 8)'
    })
  } catch (err) {
    console.error('[BLOCKCHAIN] Verify error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
