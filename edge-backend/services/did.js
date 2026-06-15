import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generate DID (Decentralized Identifier) for a patient
 * Format: did:cdss:<hash>
 * @param {object} patient - Patient data
 * @returns {string} DID
 */
export const generateDID = (patient) => {
  // Create deterministic hash from patient core data
  const data = {
    id: patient.id,
    phone: patient.phone,
    timestamp: patient.created_at
  }
  
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .slice(0, 16) // First 16 chars
  
  return `did:cdss:${hash}`
}

/**
 * Generate PIN hash for recovery
 * @param {string} pin - 4-digit PIN
 * @param {string} salt - Random salt
 * @returns {string} SHA-256 hash
 */
export const generatePINHash = (pin, salt = '') => {
  const saltToUse = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .createHash('sha256')
    .update(`${pin}${saltToUse}`)
    .digest('hex')
  
  return { hash, salt: saltToUse }
}

/**
 * Verify PIN
 */
export const verifyPIN = (pin, pinHash, salt) => {
  const testHash = crypto
    .createHash('sha256')
    .update(`${pin}${salt}`)
    .digest('hex')
  
  return testHash === pinHash
}

/**
 * Validate DID format
 */
export const validateDID = (did) => {
  return typeof did === 'string' && did.startsWith('did:cdss:')
}
