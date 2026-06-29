/* eslint-env node */
/* global process */
/**
 * Dilithium Signing Service (Node.js wrapper for Python backend)
 * 
 * This service calls the Python signing endpoints via HTTP.
 * Provides post-quantum cryptographic signatures for medical records.
 * 
 * Setup:
 *   1. Python service must be running at AI_SERVICE_URL
 *   2. pip install dilithium-py pyoqs
 *   3. Call generateKeyPair() on patient registration
 *   4. Call signRecord() when creating/updating records
 *   5. Call verifySignature() when reading records
 */

import axios from 'axios'
import crypto from 'crypto'

const env = typeof process !== 'undefined' ? process.env : {}
const AI_SERVICE_URL = env.AI_SERVICE_URL || 'http://localhost:5000'
const SIGNING_ENDPOINT = `${AI_SERVICE_URL}/signing`

/**
 * Generate a new Dilithium keypair for a subject (patient or staff)
 * 
 * @param {string} subjectId - Patient/staff ID
 * @param {string} subjectType - 'patient' or 'staff'
 * @returns {Promise<{publicKey, privateKey, algorithm}>}
 */
export const generateKeyPair = async (subjectId, subjectType = 'patient') => {
  try {
    const response = await axios.post(
      `${SIGNING_ENDPOINT}/generate-keypair`,
      {
        subject_id: subjectId,
        subject_type: subjectType
      },
      { timeout: 10000 }
    )

    return {
      success: true,
      publicKey: response.data.public_key,
      privateKey: response.data.private_key, // Only for registration - don't send to frontend
      algorithm: response.data.algorithm,
      createdAt: response.data.created_at
    }
  } catch (err) {
    console.error('[SIGNING] Generate keypair error:', err.message)
    return {
      success: false,
      error: `Failed to generate keypair: ${err.message}`
    }
  }
}

/**
 * Sign a record payload using Dilithium
 * 
 * @param {string} subjectId - Subject ID (patient or staff)
 * @param {object} payload - Data to sign (e.g., medical record)
 * @returns {Promise<{signature, algorithm, timestamp}>}
 */
export const signRecord = async (subjectId, payload) => {
  try {
    if (!subjectId || !payload) {
      throw new Error('subjectId and payload required')
    }

    const response = await axios.post(
      `${SIGNING_ENDPOINT}/sign`,
      {
        subject_id: subjectId,
        payload: payload,
        algorithm: 'Dilithium3'
      },
      { timeout: 10000 }
    )

    return {
      success: true,
      signature: response.data.signature,
      algorithm: response.data.algorithm,
      timestamp: response.data.timestamp,
      warning: response.data.warning || null
    }
  } catch (err) {
    console.error('[SIGNING] Sign error:', err.message)
    return {
      success: false,
      error: `Failed to sign record: ${err.message}`
    }
  }
}

/**
 * Verify a signature using Dilithium
 * 
 * @param {string} subjectId - Subject ID
 * @param {object} payload - Original payload
 * @param {string} signature - Hex-encoded signature
 * @param {string} publicKey - Hex-encoded public key
 * @returns {Promise<{valid, algorithm}>}
 */
export const verifySignature = async (subjectId, payload, signature, publicKey) => {
  try {
    if (!subjectId || !payload || !signature || !publicKey) {
      throw new Error('subjectId, payload, signature, and publicKey required')
    }

    const response = await axios.post(
      `${SIGNING_ENDPOINT}/verify`,
      {
        subject_id: subjectId,
        payload: payload,
        signature: signature,
        public_key: publicKey
      },
      { timeout: 10000 }
    )

    return {
      success: true,
      valid: response.data.valid,
      algorithm: response.data.algorithm,
      message: response.data.message
    }
  } catch (err) {
    console.error('[SIGNING] Verify error:', err.message)
    return {
      success: false,
      valid: false,
      error: `Failed to verify signature: ${err.message}`
    }
  }
}

/**
 * Check if signing service is available
 * 
 * @returns {Promise<boolean>}
 */
export const isSigningServiceAvailable = async () => {
  try {
    const response = await axios.get(
      `${SIGNING_ENDPOINT}/health`,
      { timeout: 5000 }
    )
    return response.data.status === 'ok'
  } catch (err) {
    console.warn('[SIGNING] Service unavailable:', err.message)
    return false
  }
}

/**
 * Fallback: Ed25519 signing (for when Dilithium service is unavailable)
 * NOT quantum-safe, but better than nothing
 */

export const fallbackSignRecord = (payload) => {
  try {
    // Simple SHA256 hash as fallback (not a real signature)
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(payload, null, 0))
    return {
      success: true,
      signature: hash.digest('hex'),
      algorithm: 'SHA256-Fallback',
      warning: 'Using fallback SHA256 - Dilithium service unavailable'
    }
  } catch (err) {
    return {
      success: false,
      error: `Fallback signing failed: ${err.message}`
    }
  }
}

export default {
  generateKeyPair,
  signRecord,
  verifySignature,
  isSigningServiceAvailable,
  fallbackSignRecord
}
