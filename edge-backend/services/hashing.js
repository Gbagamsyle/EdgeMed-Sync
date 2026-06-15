import crypto from 'crypto'

/**
 * Generate SHA-256 hash of data
 * @param {string|object} data
 * @returns {string} hex hash
 */
export const sha256Hash = (data) => {
  const stringified = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto.createHash('sha256').update(stringified).digest('hex')
}

/**
 * Generate SHA-256 hash as buffer for merkle tree
 */
export const sha256Buffer = (data) => {
  const stringified = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto.createHash('sha256').update(stringified).digest()
}

/**
 * Verify hash integrity
 */
export const verifyHash = (data, expectedHash) => {
  const computed = sha256Hash(data)
  return computed === expectedHash
}
