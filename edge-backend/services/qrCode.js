import QRCode from 'qrcode'

/**
 * Generate QR code as Data URL (embedded image)
 * @param {string} text - Text to encode in QR
 * @returns {Promise<string>} Data URL of QR code
 */
export const generateQRCodeDataURL = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return dataUrl
  } catch (err) {
    console.error('[QR] Generation error:', err)
    throw new Error(`Failed to generate QR code: ${err.message}`)
  }
}

/**
 * Generate QR code as SVG string
 * @param {string} text - Text to encode
 * @returns {Promise<string>} SVG string
 */
export const generateQRCodeSVG = async (text) => {
  try {
    const svg = await QRCode.toString(text, {
      errorCorrectionLevel: 'H',
      type: 'image/svg+xml',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return svg
  } catch (err) {
    console.error('[QR] SVG generation error:', err)
    throw new Error(`Failed to generate QR code: ${err.message}`)
  }
}

/**
 * Generate QR code as PNG buffer
 * @param {string} text - Text to encode
 * @returns {Promise<Buffer>} PNG buffer
 */
export const generateQRCodeBuffer = async (text) => {
  try {
    const buffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    })
    return buffer
  } catch (err) {
    console.error('[QR] Buffer generation error:', err)
    throw new Error(`Failed to generate QR code: ${err.message}`)
  }
}
