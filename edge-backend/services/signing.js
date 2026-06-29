import crypto from 'crypto'
import { generateKeyPair as generateDilithiumKeyPair, signRecord as dilithiumSignRecord, verifySignature as dilithiumVerifySignature, fallbackSignRecord } from './dilithiumSigning.js'

/**
 * Generate keypair using the Dilithium signing service if available.
 * Falls back to local Ed25519 generation when the signing service is unavailable.
 */
export const generateKeyPair = async (subjectId, subjectType = 'patient') => {
  if (!subjectId) {
    throw new Error('subjectId required')
  }

  try {
    const result = await generateDilithiumKeyPair(subjectId, subjectType)

    if (result.success && result.publicKey) {
      return result
    }

    console.warn('[SIGNING] Dilithium service returned no keypair, falling back to local Ed25519')
  } catch (err) {
    console.warn('[SIGNING] Dilithium keypair generation failed:', err.message)
  }

  // Fallback to local Ed25519 key generation
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { format: 'pem', type: 'spki' },
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' }
  })

  return {
    success: true,
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(privateKey).toString('base64'),
    algorithm: 'Ed25519-Fallback',
    warning: 'Using local Ed25519 fallback because Dilithium service unavailable'
  }
}

export const signData = async (subjectId, payload) => {
  if (!subjectId || !payload) {
    throw new Error('subjectId and payload required')
  }

  const result = await dilithiumSignRecord(subjectId, payload)
  if (result.success) {
    return result.signature
  }

  const fallback = fallbackSignRecord(payload)
  if (fallback.success) {
    return fallback.signature
  }

  throw new Error(result.error || fallback.error || 'Failed to sign data')
}

export const verifySignature = async (subjectId, payload, signature, publicKey) => {
  if (!subjectId || !payload || !signature || !publicKey) {
    throw new Error('subjectId, payload, signature, and publicKey required')
  }

  const result = await dilithiumVerifySignature(subjectId, payload, signature, publicKey)
  return result.success ? result.valid : false
}
