import { recordQueue } from '../utils/dexieDb'

// Offline Sync Worker
// This worker runs periodically in the background to sync pending records to the backend
// It communicates back to the main thread via postMessage

class OfflineSyncWorker {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncInterval = null
    this.isSyncing = false
    this.maxRetries = 3
    this.retryDelay = 5000 // 5 seconds between retries
    this.maxSyncTimeout = 30000 // 30 seconds max per record

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
    }
  }

  handleOnline() {
    this.isOnline = true
    console.log('Network online - starting sync worker')
    this.post('online', { isOnline: true })
    this.startSync()
  }

  handleOffline() {
    this.isOnline = false
    console.log('Network offline - pausing sync worker')
    this.post('offline', { isOnline: false })
    this.stopSync()
  }

  // Start periodic sync (call this when app initializes)
  start(intervalMs = 10000) {
    console.log(`Sync worker started with ${intervalMs}ms interval`)
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingRecords()
      }
    }, intervalMs)
  }

  // Stop sync
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('Sync worker stopped')
    }
  }

  // Trigger manual sync
  startSync() {
    if (!this.isOnline || this.isSyncing) return
    this.syncPendingRecords()
  }

  // Main sync logic (should be called from main thread with pending records)
  async syncPendingRecords() {
    if (this.isSyncing) {
      console.log('Sync already in progress')
      return
    }

    this.isSyncing = true
    this.post('sync_start', { message: 'Starting sync...' })

    try {
      // Request pending records from main thread
      const pendingRecords = await this.requestPendingRecords()
      
      if (!pendingRecords || pendingRecords.length === 0) {
        this.post('sync_complete', { synced: 0, failed: 0 })
        return
      }

      console.log(`Syncing ${pendingRecords.length} pending records`)
      let synced = 0
      let failed = 0

      for (const record of pendingRecords) {
        const result = await this.syncRecord(record)
        if (result.success) {
          synced++
          this.post('record_synced', { recordId: record.id, patientId: record.patientId })
        } else {
          failed++
          this.post('record_failed', { 
            recordId: record.id, 
            patientId: record.patientId,
            error: result.error,
            attempts: result.attempts
          })
        }
      }

      this.post('sync_complete', { synced, failed, total: pendingRecords.length })
      console.log(`Sync complete: ${synced} synced, ${failed} failed`)
    } catch (err) {
      console.error('Sync worker error:', err)
      this.post('sync_error', { error: err.message })
    } finally {
      this.isSyncing = false
    }
  }

  // Sync a single record to backend
  async syncRecord(record) {
    try {
      const backendUrl = record.backendUrl || 'http://localhost:3001'
      const endpoint = record.endpoint || '/api/records/create'
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.maxSyncTimeout)

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: record.token ? `Bearer ${record.token}` : ''
        },
        body: JSON.stringify(record.payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        await recordQueue.markSynced(record.id)
        console.log(`Record ${record.id} synced successfully`)
        return { success: true, recordId: record.id }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const error = errorData.message || `HTTP ${response.status}`
        
        // Mark the record as failed so it can be retried manually
        await recordQueue.updateStatus(record.id, 'failed', error)
        
        console.warn(`Record ${record.id} sync failed:`, error)
        return {
          success: false,
          recordId: record.id,
          error,
          shouldRetry: response.status >= 500 || response.status === 408 || response.status === 429,
          attempts: (record.attempts || 0) + 1
        }
      }
    } catch (err) {
      console.error(`Record ${record.id} sync error:`, err.message)
      await recordQueue.updateStatus(record.id, 'failed', err.message)
      return {
        success: false,
        recordId: record.id,
        error: err.message,
        shouldRetry: err.name !== 'AbortError',
        attempts: (record.attempts || 0) + 1
      }
    }
  }

  // Request pending records from main thread
  requestPendingRecords() {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'pending_records_response') {
          window.removeEventListener('message', handler)
          resolve(event.data.records)
        }
      }
      window.addEventListener('message', handler)
      this.post('request_pending_records', {})
    })
  }

  // Send message to main thread
  post(type, data) {
    if (typeof window !== 'undefined') {
      window.postMessage({ type, data }, '*')
    }
  }

  // Get stats
  async getStats() {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'stats_response') {
          window.removeEventListener('message', handler)
          resolve(event.data.stats)
        }
      }
      window.addEventListener('message', handler)
      this.post('request_stats', {})
    })
  }
}

// Create singleton instance
export const syncWorker = new OfflineSyncWorker()

// Export for direct use in main thread
export default syncWorker
