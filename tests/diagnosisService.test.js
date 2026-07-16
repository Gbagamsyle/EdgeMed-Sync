import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const workspaceRoot = path.resolve(__dirname, '..')

test('saveDiagnosis includes a Bearer auth token when sending the diagnosis payload', async () => {
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

  assert.ok(requestOptions, 'Expected the request to be sent')
  assert.equal(requestOptions.headers.Authorization, 'Bearer staff-token')
})

test('dashboard QR card links to the correct scan route', async () => {
  const dashboardPath = path.join(workspaceRoot, 'src/pages/dashboard/Dashboard.jsx')
  const source = await readFile(dashboardPath, 'utf8')

  assert.match(source, /href="\/dashboard\/qr\/scan"/)
})
