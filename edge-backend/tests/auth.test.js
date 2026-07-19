import request from 'supertest'
import { describe, expect, it } from '@jest/globals'
import app from '../server.js'

describe('Auth middleware', () => {
  it('blocks request with no token', async () => {
    const res = await request(app).get('/api/audit/logs')
    expect(res.statusCode).toBe(401)
  })

  it('blocks request with invalid token', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set('Authorization', 'Bearer fake_token_here')

    expect(res.statusCode).toBe(401)
  })
})