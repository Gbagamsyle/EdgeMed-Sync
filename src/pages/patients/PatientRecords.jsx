import { useParams } from 'react-router-dom'

export default function PatientRecords() {
  const { id } = useParams()
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Patient Records for {id}</h1>
      <p>Medical records list comes here.</p>
    </div>
  )
}
