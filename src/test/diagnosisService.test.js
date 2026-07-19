import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('diagnosisService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  it('returns label and confidence from the AI response', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        label: 'Hypertensive',
        confidence: 0.91,
        severity: 'warning',
        guidance: ['Monitor BP', 'Review medications'],
      }),
    })

    const { diagnosisService } = await import('../services/diagnosisService.js')
    const result = await diagnosisService.analyze({
      heart_rate: 88,
      systolic_bp: 162,
      diastolic_bp: 102,
      spo2: 96,
      temperature: 36.8,
      resp_rate: 17,
    })

    expect(result.label).toBe('Hypertensive')
    expect(result.confidence).toBeGreaterThan(0.5)
    expect(result.guidance).toHaveLength(2)
  })
})
