# Offline Sync System

This scaffold implements offline-first record queuing with automatic background sync for the EdgeMed platform.

## Architecture

### 1. **Dexie.js Cache** (`src/utils/dexieDb.js`)
IndexedDB wrapper for offline storage with three main tables:
- `recordQueue`: Pending/failed records waiting to sync
- `records`: Cache of synced records
- `patients`: Cache of patient data
- `syncLog`: Activity log for debugging

**Key APIs:**
```javascript
import { recordQueue, patientCache, recordCache } from '@/utils/dexieDb'

// Queue a record for offline sync
await recordQueue.add({
  patientId: 'P123',
  payload: recordData,
  token: authToken,
  backendUrl: 'http://localhost:3001',
  endpoint: '/api/records/create'
})

// Get stats
const stats = await recordQueue.getStats()
// { total: 5, pending: 2, failed: 1, synced: 2 }

// Retry failed records
const failed = await recordQueue.getFailed()
```

### 2. **Sync Worker** (`src/workers/syncWorker.js`)
Background worker that periodically syncs pending records to backend.

**Features:**
- Automatic retry with exponential backoff
- Online/offline detection
- Configurable sync interval (default: 10s)
- Message-based communication with main thread
- Timeout protection (30s per record)
- Max retries (3 attempts)

**Lifecycle:**
```javascript
import { syncWorker } from '@/workers/syncWorker'

// Start sync (periodic every 15s)
syncWorker.start(15000)

// Trigger manual sync
syncWorker.startSync()

// Stop sync
syncWorker.stop()
```

### 3. **useOfflineSync Hook** (`src/hooks/useOfflineSync.js`)
React hook that manages Dexie + Sync Worker integration.

**Usage:**
```javascript
const {
  isOnline,           // boolean
  syncStats,          // { total, pending, failed, synced }
  pendingCount,       // number
  syncInProgress,     // boolean
  queueRecord,        // async(recordData) -> recordId
  getPendingRecords,  // async() -> []
  getFailedRecords,   // async() -> []
  retryFailed,        // async()
  manualSync,         // ()
  clearQueue          // async()
} = useOfflineSync()
```

### 4. **Example Component** (`src/components/examples/RecordCreateWithOffline.jsx`)
Complete example showing:
- Network status banner
- Record form with offline fallback
- Pending/failed queue UI
- Retry mechanism
- Manual sync trigger

## Integration Guide

### Step 1: Install Dexie
```bash
npm install dexie
```

### Step 2: Initialize in App.jsx
```javascript
import { useOfflineSync } from '@/hooks/useOfflineSync'

function App() {
  const { isOnline, pendingCount, syncInProgress } = useOfflineSync()
  
  return (
    <>
      {/* Your app */}
      {!isOnline && <OfflineBanner />}
      {pendingCount > 0 && <PendingIndicator count={pendingCount} />}
    </>
  )
}
```

### Step 3: Add to Record Creation Flow
```javascript
import { useOfflineSync } from '@/hooks/useOfflineSync'

function CreateRecord() {
  const { queueRecord, isOnline } = useOfflineSync()
  
  const handleSubmit = async (recordData) => {
    if (isOnline) {
      try {
        // Try to send directly
        const res = await fetch('/api/records/create', { ... })
        if (!res.ok) throw new Error()
      } catch {
        // Fallback to offline queue
        await queueRecord(recordData)
      }
    } else {
      // Offline: queue immediately
      await queueRecord(recordData)
    }
  }
}
```

### Step 4: Backend Requirements

The backend must support:
- **POST /api/records/create** - Create record endpoint
- Record payload structure with `patientId`, `vitals`, `notes`, etc.
- Bearer token authentication (JWT or Supabase)
- Return `{ success: true }` on success

Example backend response:
```json
{
  "success": true,
  "recordId": "rec_123",
  "synced": "2024-01-15T10:30:00Z"
}
```

## Data Flow

### Online Flow
```
User fills form
    ↓
queueRecord() called
    ↓
Try direct HTTP POST (5s timeout)
    ↓
    ├─ Success → Show success message
    └─ Failure → Fall back to offline queue
```

### Offline Flow
```
User fills form
    ↓
queueRecord() called
    ↓
Record stored in IndexedDB
    ↓
Sync worker detects online
    ↓
Batch fetch pending records
    ↓
HTTP POST each record (retry 3x)
    ↓
    ├─ Success → Mark synced, delete from queue
    └─ Failure after retries → Mark failed, user can retry
```

## Configuration

### Adjust Sync Interval
```javascript
// In useOfflineSync.js or your initialization code
syncWorker.start(5000)  // Sync every 5 seconds (default: 15s)
```

### Adjust Retry Strategy
Edit `syncWorker.js`:
```javascript
this.maxRetries = 5              // Increase max retries
this.retryDelay = 10000          // Increase delay between retries
this.maxSyncTimeout = 60000      // Increase timeout per record
```

### Adjust Backend Endpoint
When queuing a record:
```javascript
await queueRecord({
  patientId: 'P123',
  payload: recordData,
  token: authToken,
  backendUrl: 'https://api.example.com',  // Custom URL
  endpoint: '/api/v2/records'              // Custom endpoint
})
```

## Debugging

### View Queue Stats
```javascript
const stats = await recordQueue.getStats()
console.log(stats)  // { total: 5, pending: 2, failed: 1, synced: 2 }
```

### View Recent Sync Activity
```javascript
import { syncLog } from '@/utils/dexieDb'
const logs = await syncLog.getRecent(50)
logs.forEach(l => console.log(l.action, l.status, l.timestamp))
```

### Inspect Raw IndexedDB
Open browser DevTools → Application → IndexedDB → EdgeMedSync

Tables:
- `recordQueue` - All queued records
- `syncLog` - Sync activity history
- `patients` - Cached patient data
- `records` - Cached synced records

### Monitor Sync in Real-time
```javascript
// Listen for sync events in component
useEffect(() => {
  const handler = (event) => {
    if (event.data?.type === 'sync_complete') {
      console.log('Synced:', event.data.data)
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [])
```

## Error Handling

### Non-retryable Errors
- 401 Unauthorized (auth token expired)
- 403 Forbidden (permission denied)
- 404 Not Found (endpoint doesn't exist)

Action: Mark as failed, show to user

### Retryable Errors
- 5xx Server errors
- 408 Request timeout
- 429 Rate limited
- Network errors

Action: Retry up to 3 times with delay

### Timeout Errors
- Request takes >30s
- Aborted automatically
- Marked as retryable

## Advanced: Custom Sync Logic

To implement custom sync endpoint:

```javascript
// src/workers/customSyncWorker.js
export class CustomSyncWorker {
  async syncRecord(record) {
    // Custom logic here
    // Example: batch sync, compression, encryption
  }
}

// Then use in useOfflineSync hook
```

## Testing

### Test Offline Mode
1. Open DevTools Network tab
2. Throttle to "Offline"
3. Create a record - should be queued
4. Go back to online - should sync automatically

### Test Failed Records
1. Point to invalid backend URL
2. Create records - all fail
3. Fix URL
4. Click "Retry All Failed" - should sync

### Test Sync Interval
```javascript
// Decrease interval for testing
syncWorker.start(1000)  // Sync every 1 second
```

## Performance Notes

- **IndexedDB Limits**: Typically 50MB+ per origin (browser-dependent)
- **Sync Batching**: Records processed one at a time (not batched)
- **Memory**: Sync worker stays in memory; stop() when not needed
- **Battery**: 15s interval is good balance for mobile

## Security Considerations

1. **Auth Tokens**: Stored in IndexedDB (same security as localStorage)
2. **Encryption**: Consider encrypting sensitive payloads before queuing
3. **Validation**: Validate record schema before queuing
4. **Cleanup**: Clear queue after successful sync

## Next Steps

1. **Test offline flow** with real backend
2. **Add encryption** for sensitive records (optional)
3. **Implement batch sync** for better performance
4. **Add compression** for large payloads
5. **Monitor with analytics** (track sync success rate)

## Troubleshooting

### Records not syncing
- Check: Is network online? `console.log(navigator.onLine)`
- Check: Is worker running? `syncWorker.start()`
- Check: Pending records exist? `recordQueue.getPending()`

### Records stuck in failed state
- Click "Retry All Failed" button
- Or: `await recordQueue.updateStatus(recordId, 'pending')`

### IndexedDB full
- Clear old synced records: `recordQueue.clear()`
- Or: Implement record archival

### High memory usage
- Reduce sync interval: `syncWorker.start(60000)`
- Or: Stop worker when not needed: `syncWorker.stop()`
