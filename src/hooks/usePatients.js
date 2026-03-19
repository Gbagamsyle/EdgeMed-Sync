import { useState, useEffect } from 'react'
import { patientService } from '../services/patientService'

export default function usePatients() {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    patientService.getAll().then(setPatients)
  }, [])

  return { patients }
}
