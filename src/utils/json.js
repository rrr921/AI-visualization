export function safeJsonParse(text) {
  if (typeof text !== 'string') return { ok: false, error: 'not_string', value: null }
  try {
    const value = JSON.parse(text)
    return { ok: true, error: null, value }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), value: null }
  }
}

export function normalizeAiPayload(payload) {
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'payload_not_object', value: null }
  const summary = typeof payload.summary === 'string' ? payload.summary : ''
  const report = payload.report && typeof payload.report === 'object' ? payload.report : null
  const labels = payload.chartData?.labels
  const values = payload.chartData?.values
  if (!Array.isArray(labels) || !Array.isArray(values)) {
    return { ok: false, error: 'chartData_missing', value: null }
  }
  if (labels.length === 0 || values.length === 0) {
    return { ok: false, error: 'chartData_empty', value: null }
  }
  if (labels.length !== values.length) {
    return { ok: false, error: 'chartData_length_mismatch', value: null }
  }
  const numericValues = values.map((v) => Number(v))
  if (numericValues.some((n) => !Number.isFinite(n))) {
    return { ok: false, error: 'values_not_numeric', value: null }
  }
  return {
    ok: true,
    error: null,
    value: {
      summary,
      report: normalizeReport(report),
      chartData: {
        labels: labels.map((x) => String(x)),
        values: numericValues,
      },
    },
  }
}

function normalizeReport(report) {
  if (!report) {
    return {
      overview: '',
      insights: [],
      risks: [],
      recommendations: [],
    }
  }
  const overview = typeof report.overview === 'string' ? report.overview : ''
  const insights = Array.isArray(report.insights) ? report.insights.map((x) => String(x)) : []
  const risks = Array.isArray(report.risks) ? report.risks.map((x) => String(x)) : []
  const recommendations = Array.isArray(report.recommendations)
    ? report.recommendations.map((x) => String(x))
    : []
  return { overview, insights, risks, recommendations }
}

