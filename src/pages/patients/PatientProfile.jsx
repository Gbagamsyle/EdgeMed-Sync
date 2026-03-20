import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPatientById } from '../../services/patientService'

export default function PatientProfile() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)

  useEffect(() => {
    fetchPatient()
  }, [])

  const fetchPatient = async () => {
    const { data, error } = await getPatientById(id)
    if (error) {
      console.error(error)
      return
    }
    setPatient(data)
  }

  if (!patient) return (
    <p>Loading...</p>
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-4">{patient.full_name}</h2>
      <p className="mb-2"><strong>Phone:</strong> {patient.phone}</p>
      <p className="mb-2"><strong>Gender:</strong> {patient.gender}</p>
      <p className="mb-2"><strong>Address:</strong> {patient.address}</p>

      {patient.qr_code && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Patient QR Code</h3>
          <img src={patient.qr_code} alt="QR Code" className="w-40 h-40" />
        </div>
      )}
    </div>
  )
}
