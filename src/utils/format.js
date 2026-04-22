export function formatNumber(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '-'
  return new Intl.NumberFormat('zh-CN').format(num)
}

