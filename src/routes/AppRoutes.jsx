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
import EditPatient from '../pages/patients/EditPatient'
import PatientRecords from '../pages/patients/PatientRecords'
import DiagnosisReview from '../pages/diagnosis/DiagnosisReview'
import DiagnosisPrediction from '../pages/diagnosis/DiagnosisPrediction'
import DoctorClinicalView from '../pages/diagnosis/DoctorClinicalView'
import ScanQR from '../pages/qr/ScanQR'
import Vitals from '../pages/vitals/Vitals'
import NursingObservations from '../pages/vitals/NursingObservations'
import Reports from '../pages/reports/Reports'
import Settings from '../pages/settings/Settings'
import StaffManagement from '../pages/settings/StaffManagement'
import Appointments from '../pages/appointments/Appointments'
import LabQueue from '../pages/laboratory/LabQueue'
import LabResultEntry from '../pages/laboratory/LabResultEntry'
import LabSamples from '../pages/laboratory/LabSamples'
import LabResults from '../pages/laboratory/LabResults'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        {/* Recover removed: staff should use PatientProfile Print QR (staff-only) */}

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'nurse', 'lab_technician']}><Patients /></ProtectedRoute>} />
          <Route path="patients/add" element={<ProtectedRoute allowedRoles={['admin', 'receptionist']}><AddPatient /></ProtectedRoute>} />
          <Route path="patients/:id" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']}><PatientProfile /></ProtectedRoute>} />
          <Route path="patients/:id/edit" element={<ProtectedRoute allowedRoles={['admin', 'receptionist']}><EditPatient /></ProtectedRoute>} />
          <Route path="patients/:id/records" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}><PatientRecords /></ProtectedRoute>} />
          <Route path="diagnosis" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorClinicalView routeView="assessments" /></ProtectedRoute>} />
          <Route path="diagnosis/:patientId" element={<ProtectedRoute allowedRoles={['doctor']}><DiagnosisReview /></ProtectedRoute>} />
          <Route path="diagnosis/:patientId/predict" element={<ProtectedRoute allowedRoles={['doctor']}><DiagnosisPrediction /></ProtectedRoute>} />
          <Route path="clinical/:view" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorClinicalView /></ProtectedRoute>} />
          <Route path="laboratory" element={<ProtectedRoute allowedRoles={['lab_technician']}><LabQueue /></ProtectedRoute>} />
          <Route path="laboratory/samples" element={<ProtectedRoute allowedRoles={['lab_technician']}><LabSamples /></ProtectedRoute>} />
          <Route path="laboratory/results" element={<ProtectedRoute allowedRoles={['lab_technician']}><LabResults /></ProtectedRoute>} />
          <Route path="laboratory/:requestId" element={<ProtectedRoute allowedRoles={['lab_technician']}><LabResultEntry /></ProtectedRoute>} />
          <Route path="vitals" element={<ProtectedRoute allowedRoles={['doctor', 'nurse']}><Vitals /></ProtectedRoute>} />
          <Route path="vitals/observations" element={<ProtectedRoute allowedRoles={['nurse']}><NursingObservations /></ProtectedRoute>} />
          <Route path="qr/scan" element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'receptionist']}><ScanQR /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'nurse', 'lab_technician']}><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="staff" element={<ProtectedRoute allowedRoles={['admin']}><StaffManagement /></ProtectedRoute>} />
          <Route path="appointments" element={<ProtectedRoute allowedRoles={['receptionist']}><Appointments /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
