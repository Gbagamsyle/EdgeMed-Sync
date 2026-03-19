export function hashRecord(record) {
  return btoa(JSON.stringify(record))
}
