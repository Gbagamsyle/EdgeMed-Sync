import request from 'supertest'
import { describe, expect, it } from '@jest/globals'
import app from '../server.js'

describe('Blockchain routes', () => {
  it('GET /api/blockchain/status returns ok', async () => {
    const res = await request(app).get('/api/blockchain/status')
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('status')
  })

  it('POST /api/blockchain/anchor with missing batchId returns 400', async () => {
    const res = await request(app)
      .post('/api/blockchain/anchor')
      .send({ merkleRoot: 'abc123' })

    expect(res.statusCode).toBe(400)
  })
})
