const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {})

const productionBackendUrl = 'https://edgemed-sync-production-9518.up.railway.app'
const defaultBackendUrl = runtimeEnv.PROD ? productionBackendUrl : 'http://localhost:3001'

export const BACKEND_URL = (runtimeEnv.VITE_BACKEND_URL || defaultBackendUrl).replace(/\/$/, '')
export const API_BASE = `${BACKEND_URL}/api`
