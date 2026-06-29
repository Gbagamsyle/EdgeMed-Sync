import Dexie from 'dexie'

// Initialize IndexedDB database for offline caching
export const db = new Dexie('EdgeMedSync')

db.version(1).stores({
  // Offline queue for records waiting to sync
  recordQueue: '++id, patientId, status, createdAt',
  
  // Cache of synced records for quick reference
  records: 'id, patientId, createdAt',
  
  // Cache of patients
  patients: 'id, did',
  
  // Sync status log (for debugging)
  syncLog: '++id, timestamp, status'
})

// Record Queue Operations
export const recordQueue = {
  // Add record to offline queue
  add: async (record) => {
    try {
      const id = await db.recordQueue.add({
        ...record,
        status: 'pending',
        createdAt: new Date(),
        attempts: 0,
        lastError: null
      })
      console.log(`Record queued offline: ${id}`, record)
      logSync('record_queued', 'pending', record.patientId)
      return id
    } catch (err) {
      console.error('Failed to queue record', err)
      throw err
    }
  },

  // Get all pending records
  getPending: async () => {
    return await db.recordQueue
      .where('status')
      .equals('pending')
      .toArray()
  },

  // Get failed records (for retry UI)
  getFailed: async () => {
    return await db.recordQueue
      .where('status')
      .equals('failed')
      .toArray()
  },

  // Update record status
  updateStatus: async (id, status, error = null) => {
    await db.recordQueue.update(id, {
      status,
      lastError: error,
      attempts: { '+': 1 },
      lastAttempt: new Date()
    })
  },

  // Mark as synced
  markSynced: async (id) => {
    await db.recordQueue.update(id, {
      status: 'synced',
      syncedAt: new Date()
    })
    logSync('record_synced', 'success', null)
  },

  // Delete record (cleanup after successful sync)
  delete: async (id) => {
    await db.recordQueue.delete(id)
  },

  // Clear all records (use with caution)
  clear: async () => {
    await db.recordQueue.clear()
  },

  // Get queue stats
  getStats: async () => {
    const total = await db.recordQueue.count()
    const pending = await db.recordQueue.where('status').equals('pending').count()
    const failed = await db.recordQueue.where('status').equals('failed').count()
    const synced = await db.recordQueue.where('status').equals('synced').count()
    return { total, pending, failed, synced }
  }
}

// Patient Cache Operations
export const patientCache = {
  add: async (patient) => {
    await db.patients.put(patient)
  },

  get: async (patientId) => {
    return await db.patients.get(patientId)
  },

  getByDid: async (did) => {
    return await db.patients.where('did').equals(did).first()
  },

  getAll: async () => {
    return await db.patients.toArray()
  },

  clear: async () => {
    await db.patients.clear()
  }
}

// Record Cache Operations
export const recordCache = {
  add: async (record) => {
    await db.records.put(record)
  },

  getByPatient: async (patientId) => {
    return await db.records
      .where('patientId')
      .equals(patientId)
      .toArray()
  },

  getAll: async () => {
    return await db.records.toArray()
  },

  clear: async () => {
    await db.records.clear()
  }
}

// Sync Log (debugging)
const logSync = async (action, status, patientId) => {
  try {
    await db.syncLog.add({
      action,
      status,
      patientId,
      timestamp: new Date()
    })
  } catch (err) {
    console.error('Failed to log sync', err)
  }
}

export const syncLog = {
  getRecent: async (limit = 50) => {
    return await db.syncLog
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
  },

  clear: async () => {
    await db.syncLog.clear()
  }
}

// Initialize Dexie (check if available)
export const initDexie = async () => {
  try {
    const isSupported = await Dexie.exists('EdgeMedSync')
    console.log('Dexie initialized. IndexedDB support:', isSupported)
    return true
  } catch (err) {
    console.warn('Dexie initialization warning', err)
    return false
  }
}
