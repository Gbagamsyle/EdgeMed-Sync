import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const workspaceRoot = path.resolve(__dirname, '..')

describe('diagnosis service integration', () => {
  it('sends a Bearer auth token when saving a diagnosis', async () => {
    globalThis.process = globalThis.process || {}
    globalThis.process.env = globalThis.process.env || {}
    globalThis.process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
    globalThis.process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

    const { diagnosisService } = await import('../src/services/diagnosisService.js')
    const { supabase } = await import('../src/services/supabaseClient.js')

    let requestOptions = null
    globalThis.fetch = async (_url, options) => {
      requestOptions = options
      return {
        ok: true,
        json: async () => ({ success: true }),
      }
    }

    supabase.auth.getSession = async () => ({
      data: {
        session: {
          access_token: 'staff-token',
        },
      },
    })

    await diagnosisService.saveDiagnosis({
      patient_did: 'did:example:patient',
      doctor_id: 'doctor-1',
      vitals: { heart_rate: 90 },
      diagnosis_notes: 'Healthy',
      recorded_by: 'doctor-1',
    })

    expect(requestOptions).toBeTruthy()
    expect(requestOptions.headers.Authorization).toBe('Bearer staff-token')
  })

  it('links the QR card to the scan route', async () => {
    const dashboardPath = path.join(workspaceRoot, 'src/pages/dashboard/Dashboard.jsx')
    const source = await readFile(dashboardPath, 'utf8')

    expect(source).toMatch(/href="\/dashboard\/qr\/scan"/)
  })
})
