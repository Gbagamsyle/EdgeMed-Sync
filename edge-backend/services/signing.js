import crypto from 'crypto'

/**
 * Sign data with Ed25519 (fallback for Dilithium)
 * TODO: Replace with actual Dilithium-py service when available
 */
export const signData = async (data, privateKey) => {
  // Placeholder: In production, call Python Dilithium service
  // For now, use Node's built-in signing
  try {
    const key = crypto.createPrivateKey({
      key: Buffer.from(privateKey, 'base64'),
      format: 'pem',
      type: 'pkcs8'
    })
    
    const sign = crypto.createSign('sha256')
    const stringified = typeof data === 'string' ? data : JSON.stringify(data)
    sign.update(stringified)
    
    const signature = sign.sign(key, 'base64')
    return signature
  } catch (err) {
    console.error('Signing error:', err)
    throw new Error('Failed to sign data')
  }
}

/**
 * Verify signature
 */
export const verifySignature = (data, signature, publicKey) => {
  try {
    const key = crypto.createPublicKey({
      key: Buffer.from(publicKey, 'base64'),
      format: 'pem',
      type: 'spki'
    })
    
    const verify = crypto.createVerify('sha256')
    const stringified = typeof data === 'string' ? data : JSON.stringify(data)
    verify.update(stringified)
    
    return verify.verify(key, Buffer.from(signature, 'base64'))
  } catch (err) {
    console.error('Verification error:', err)
    return false
  }
}

/**
 * Generate keypair (Ed25519) - Placeholder for Dilithium
 * TODO: Generate Dilithium keypair instead
 */
export const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { format: 'pem', type: 'spki' },
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' }
  })
  
  return {
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(privateKey).toString('base64')
  }
}
