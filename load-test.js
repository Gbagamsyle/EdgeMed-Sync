import http from 'k6/http'
import { check } from 'k6'

const payloadVariants = [
  {
    heart_rate: 88,
    systolic_bp: 162,
    diastolic_bp: 102,
    spo2: 96,
    temperature: 36.8,
    resp_rate: 17,
  },
  {
    heart_rate: 112,
    systolic_bp: 138,
    diastolic_bp: 88,
    spo2: 92,
    temperature: 38.4,
    resp_rate: 24,
  },
  {
    heart_rate: 74,
    systolic_bp: 118,
    diastolic_bp: 76,
    spo2: 98,
    temperature: 36.7,
    resp_rate: 15,
  },
]

export const options = {
  stages: [
    { duration: '10s', target: 30 },
    { duration: '20s', target: 50 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
}

let iteration = 0

export default function () {
  const vitals = payloadVariants[iteration % payloadVariants.length]
  const payload = JSON.stringify({ vitals })

  iteration += 1

  const res = http.post('http://localhost:3001/api/ai/predict', payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  const body = res.body ? JSON.parse(res.body) : {}

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has label': () => body.label !== undefined,
  })
}
