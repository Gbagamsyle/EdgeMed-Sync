import { Link } from 'react-router-dom'

export default function Patients() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Patients</h1>
      <Link className="text-blue-600 hover:underline" to="/patients/add">Add Patient</Link>
      <p className="mt-4">Patient table goes here.</p>
    </div>
  )
}
