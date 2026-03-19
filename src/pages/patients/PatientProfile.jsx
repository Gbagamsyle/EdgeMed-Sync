import { useParams } from 'react-router-dom'

export default function PatientProfile() {
  const { id } = useParams()
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Patient Profile: {id}</h1>
      <p>Patient details will render here.</p>
    </div>
  )
}
