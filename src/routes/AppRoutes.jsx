import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Homepage from '../pages/Homepage'
import DashboardLayout from '../components/layout/DashboardLayout'
import Dashboard from '../pages/dashboard/Dashboard'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ProtectedRoute from './ProtectedRoute'
import Patients from '../pages/patients/Patients'
import AddPatient from '../pages/patients/AddPatient'
import PatientProfile from '../pages/patients/PatientProfile'
import PatientRecords from '../pages/patients/PatientRecords'
import Diagnosis from '../pages/diagnosis/Diagnosis'
import ScanQR from '../pages/qr/ScanQR'
import Reports from '../pages/reports/Reports'
import Settings from '../pages/settings/Settings'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/add" element={<AddPatient />} />
          <Route path="patients/:id" element={<PatientProfile />} />
          <Route path="patients/:id/records" element={<PatientRecords />} />
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="qr/scan" element={<ScanQR />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
