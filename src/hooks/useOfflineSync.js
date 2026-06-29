import { useEffect, useRef, useState, useCallback } from 'react'
import { recordQueue, patientCache, initDexie } from '../utils/dexieDb'
import { syncWorker } from '../workers/syncWorker'

/**
 * Hook for managing offline records and sync
 * 
 * Usage:
 *   const { queueRecord, isOnline, syncStats, pendingCount } = useOfflineSync()
 *   
 *   // In your record creation flow:
 *   await queueRecord({
 *     patientId: 'patient123',
 *     payload: recordData,
 *     token: authToken,
 *     backendUrl: BACKEND_URL,
 *     endpoint: '/api/records/create'
 *   })
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const workerRef = useRef(null)
  const statsIntervalRef = useRef(null)

  // Initialize Dexie and sync worker on mount
  useEffect(() => {
    let mounted = true
    let handleWorkerMessage = null

    const initialize = async () => {
      try {
        // Init Dexie
        await initDexie()
        if (!mounted) return
        console.log('Dexie initialized')

        // Set up sync worker message listener
        handleWorkerMessage = (event) => {
          const { type, data } = event.data

          switch (type) {
            case 'sync_start':
              setSyncInProgress(true)
              console.log('Sync started')
              break

            case 'sync_complete':
              setSyncInProgress(false)
              console.log(`Sync complete: ${data.synced} synced, ${data.failed} failed`)
              updateStats()
              break

            case 'sync_error':
              setSyncInProgress(false)
              console.error('Sync error:', data.error)
              break

            case 'record_synced':
              console.log(`Record synced: ${data.recordId}`)
              updateStats()
              break

            case 'record_failed':
              console.warn(`Record failed: ${data.recordId} (attempt ${data.attempts})`)
              updateStats()
              break

            case 'online':
              setIsOnline(true)
              console.log('Network back online')
              break

            case 'offline':
              setIsOnline(false)
              console.log('Network offline')
              break

            case 'request_pending_records':
              // Send pending records to worker
              recordQueue.getPending().then((pending) => {
                window.postMessage({
                  type: 'pending_records_response',
                  records: pending
                }, '*')
              })
              break

            case 'request_stats':
              // Send stats to worker
              recordQueue.getStats().then((stats) => {
                window.postMessage({
                  type: 'stats_response',
                  stats
                }, '*')
              })
              break

            default:
              break
          }
        }

        if (mounted) {
          window.addEventListener('message', handleWorkerMessage)
          workerRef.current = syncWorker

          // Start the sync worker (sync every 15 seconds if online)
          syncWorker.start(15000)

          // Update stats periodically
          updateStats()
          statsIntervalRef.current = setInterval(updateStats, 5000)
        }
      } catch (err) {
        console.error('Failed to initialize offline sync', err)
      }
    }

    initialize()

    return () => {
      mounted = false
      if (handleWorkerMessage) {
        window.removeEventListener('message', handleWorkerMessage)
      }
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
      if (workerRef.current) workerRef.current.stop()
    }
  }, [])

  // Update stats
  const updateStats = useCallback(async () => {
    try {
      const stats = await recordQueue.getStats()
      setSyncStats(stats)
      setPendingCount(stats.pending + stats.failed)
    } catch (err) {
      console.error('Failed to update stats', err)
    }
  }, [])

  // Queue a record for offline sync
  const queueRecord = useCallback(
    async (recordData) => {
      try {
        const recordId = await recordQueue.add(recordData)
        console.log(`Record queued: ${recordId}`)
        
        // Update stats immediately
        updateStats()

        // Trigger sync if online
        if (isOnline && workerRef.current) {
          setTimeout(() => {
            workerRef.current.startSync()
          }, 100)
        }

        return recordId
      } catch (err) {
        console.error('Failed to queue record', err)
        throw err
      }
    },
    [isOnline, updateStats]
  )

  // Get pending records
  const getPendingRecords = useCallback(async () => {
    return await recordQueue.getPending()
  }, [])

  // Get failed records
  const getFailedRecords = useCallback(async () => {
    return await recordQueue.getFailed()
  }, [])

  // Retry failed records
  const retryFailed = useCallback(async () => {
    const failed = await recordQueue.getFailed()
    for (const record of failed) {
      await recordQueue.updateStatus(record.id, 'pending')
    }
    updateStats()
    if (isOnline && workerRef.current) {
      workerRef.current.startSync()
    }
  }, [isOnline, updateStats])

  // Clear queue (use with caution!)
  const clearQueue = useCallback(async () => {
    if (window.confirm('Clear all offline records? This cannot be undone.')) {
      await recordQueue.clear()
      updateStats()
    }
  }, [updateStats])

  // Manually trigger sync
  const manualSync = useCallback(() => {
    if (isOnline && workerRef.current) {
      workerRef.current.startSync()
    }
  }, [isOnline])

  return {
    // State
    isOnline,
    syncStats,
    pendingCount,
    syncInProgress,

    // Actions
    queueRecord,
    getPendingRecords,
    getFailedRecords,
    retryFailed,
    clearQueue,
    manualSync,
    updateStats
  }
}

export default useOfflineSync
