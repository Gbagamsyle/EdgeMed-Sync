import express from 'express'
import { getSupabase } from '../services/supabaseClient.js'
import { generateDID, generatePINHash, verifyPIN } from '../services/did.js'
import { generateKeyPair } from '../services/signing.js'
import { generateQRCodeDataURL } from '../services/qrCode.js'

const router = express.Router()

/**
 * POST /api/identity/register
 * Create patient DID, keypair, generate QR payload, store PIN hash
 */
router.post('/register', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized. Check .env file.' })
    }

    const { patient_id, pin } = req.body

    if (!patient_id || !pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Invalid patient_id or PIN (must be 4 digits)' })
    }

    // Fetch patient from Supabase
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patient_id)
      .single()

    if (fetchError || !patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    // Step 1: Generate DID
    const did = generateDID(patient)
    console.log(`[IDENTITY] Generated DID for patient ${patient_id}:`, did)

    // Step 2: Generate keypair
    const keypair = generateKeyPair()

    // Step 3: Hash PIN
    const { hash: pinHash, salt: pinSalt } = generatePINHash(pin)

    // Step 4: Generate QR code from DID
    let qrCode = null
    try {
      qrCode = await generateQRCodeDataURL(did)
      console.log('[IDENTITY] QR code generated successfully')
    } catch (qrErr) {
      console.error('[IDENTITY] QR generation failed:', qrErr.message)
      return res.status(500).json({ error: `Failed to generate QR code: ${qrErr.message}` })
    }

    // Step 5: Update patient with identity info
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        did,
        public_key: keypair.publicKey,
        pin_hash: pinHash,
        pin_salt: pinSalt,
        qr_code: qrCode,
        identity_created_at: new Date().toISOString()
      })
      .eq('id', patient_id)

    if (updateError) {
      console.error('[IDENTITY] Update error:', updateError)
      return res.status(500).json({ error: 'Failed to update patient identity' })
    }

    console.log(`[IDENTITY] Patient identity registered for ${patient_id}`)

    res.json({
      success: true,
      did,
      qrCode,  // Base64-encoded PNG data URL
      publicKey: keypair.publicKey,
      message: 'Identity registered successfully. QR code is ready to print.'
    })
  } catch (err) {
    console.error('[IDENTITY] Register error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/identity/recover
 * Recover DID via phone + PIN when QR is lost
 */
router.post('/recover', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { phone, pin } = req.body

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Phone and PIN required' })
    }

    // Find patient by phone
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .single()

    if (fetchError || !patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    // Verify PIN
    const pinValid = verifyPIN(pin, patient.pin_hash, patient.pin_salt)
    if (!pinValid) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    res.json({
      success: true,
      did: patient.did,
      qrCode: patient.qr_code,
      message: 'Identity recovered successfully'
    })
  } catch (err) {
    console.error('[IDENTITY] Recover error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/identity/:did
 * Fetch patient profile by DID (offline-capable)
 */
router.get('/:did', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { did } = req.params

    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, did, full_name, phone, gender, blood_group, email, public_key, created_at')
      .eq('did', did)
      .single()

    if (error || !patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    res.json(patient)
  } catch (err) {
    console.error('[IDENTITY] Fetch error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
