import axios from 'axios'
import { getAiConfig } from './aiClient'

export function createHttpClient() {
  const { apiKey } = getAiConfig()

  const client = axios.create({
    timeout: 60_000,
  })

  client.interceptors.request.use((config) => {
    // DeepSeek/OpenAI-compatible: Bearer token
    if (apiKey) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${apiKey}`
    }
    config.headers = config.headers || {}
    config.headers['Content-Type'] = 'application/json'
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status
      const statusText = err?.response?.statusText
      const data = err?.response?.data
      const msg = status
        ? `API 请求失败：HTTP ${status}${statusText ? ` ${statusText}` : ''}${data ? ` - ${stringifyShort(data)}` : ''}`
        : `网络错误：${err?.message || 'unknown'}`
      const e = new Error(msg)
      e.cause = err
      throw e
    },
  )

  return client
}

function stringifyShort(x) {
  try {
    const s = typeof x === 'string' ? x : JSON.stringify(x)
    return s.length > 500 ? `${s.slice(0, 500)}…` : s
  } catch {
    return String(x)
  }
}

