import { useOfflineSync } from './hooks/useOfflineSync'
import AppRoutes from './routes/AppRoutes'  
import './App.css'  
  
function App() {
  const { isOnline, pendingCount, syncInProgress } = useOfflineSync()
  
  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
          <span className="text-amber-600">⚠</span>
          <span>You are offline - records will be queued for sync when online</span>
        </div>
      )}
      
      {/* Pending records indicator */}
      {pendingCount > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">⏳</span>
            <span>{pendingCount} record{pendingCount !== 1 ? 's' : ''} pending sync {syncInProgress && '(syncing...)'}</span>
          </div>
        </div>
      )}
      
      <AppRoutes />
    </>
  )
}  
  
export default App 
