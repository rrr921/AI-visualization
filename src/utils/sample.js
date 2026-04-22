export function sampleArray(arr, n) {
  if (!Array.isArray(arr)) return []
  const len = arr.length
  if (n == null) return arr.slice()
  const size = Math.max(0, Math.min(len, Math.floor(n)))
  if (size >= len) return arr.slice()
  if (size === 0) return []

  // Reservoir sampling: O(len) time, O(size) space
  const res = arr.slice(0, size)
  for (let i = size; i < len; i++) {
    const j = Math.floor(Math.random() * (i + 1))
    if (j < size) res[j] = arr[i]
  }
  return res
}

