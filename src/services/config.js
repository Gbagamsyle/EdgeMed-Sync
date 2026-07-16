const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {})

export const BACKEND_URL = runtimeEnv.VITE_BACKEND_URL || 'http://localhost:3001'
export const API_BASE = `${BACKEND_URL}/api`
