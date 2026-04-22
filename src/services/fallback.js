export function fallbackAnalyze(rows) {
  // 简单兜底：按 category 聚合求和
  const map = new Map()
  for (const r of rows || []) {
    const key = String(r?.category ?? 'Unknown')
    const v = Number(r?.value)
    map.set(key, (map.get(key) || 0) + (Number.isFinite(v) ? v : 0))
  }
  const labels = Array.from(map.keys())
  const values = labels.map((k) => map.get(k))
  return {
    summary: 'AI 输出异常，已降级为本地规则分析（按分类聚合求和）。',
    chartData: { labels, values },
  }
}

