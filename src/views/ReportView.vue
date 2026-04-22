<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BarChart from '../components/BarChart.vue'
import { session } from '../store/session'
import { analyzeWithAi } from '../services/aiClient'
import { fallbackAnalyze } from '../services/fallback'
import { safeJsonParse, normalizeAiPayload } from '../utils/json'

const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')

const hasDataset = computed(() => session.dataset.rows.length > 0)

const canRender = computed(() => {
  const n = session.result.normalized
  return !!n && n.chartData.labels.length > 0 && n.chartData.labels.length === n.chartData.values.length
})

async function run() {
  if (!hasDataset.value) {
    router.push('/')
    return
  }

  loading.value = true
  errorMsg.value = ''
  session.result.error = ''
  session.result.mode = ''
  session.result.raw = ''
  session.result.prompt = ''
  session.result.parsed = null
  session.result.normalized = null

  try {
    const res = await analyzeWithAi({
      rows: session.dataset.rows,
      model: session.model,
      sampleSize: session.sampleSize,
    })

    session.result.prompt = res.prompt

    session.result.raw = res.raw
    session.result.mode = 'ai'

    const parsed = safeJsonParse(session.result.raw)
    session.result.parsed = parsed.ok ? parsed.value : null
    if (!parsed.ok) {
      const fb = fallbackAnalyze(session.dataset.rows)
      session.result.normalized = { ...fb, report: { overview: '', insights: [], risks: [], recommendations: [] } }
      session.result.mode = 'fallback'
      session.result.error = `JSON 解析失败：${parsed.error}`
      errorMsg.value = session.result.error
      return
    }

    const normalized = normalizeAiPayload(parsed.value)
    if (!normalized.ok) {
      const fb = fallbackAnalyze(session.dataset.rows)
      session.result.normalized = { ...fb, report: { overview: '', insights: [], risks: [], recommendations: [] } }
      session.result.mode = 'fallback'
      session.result.error = `JSON 字段不完整：${normalized.error}`
      errorMsg.value = session.result.error
      return
    }

    session.result.normalized = normalized.value
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    session.result.error = msg
    errorMsg.value = msg
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!session.result.normalized && hasDataset.value) run()
})

function listOrDash(arr) {
  return Array.isArray(arr) && arr.length ? arr : ['—']
}
</script>

<template>
  <div class="container page">
    <header class="head">
      <div class="left">
        <div class="pill">分析报告</div>
        <h1 class="h1">专业数据洞察</h1>
        <p class="muted">
          数据集：<span class="kbd">{{ session.dataset.name || '未命名' }}</span>
          <span class="sep">·</span>
          行数：<span class="kbd">{{ session.dataset.rows.length }}</span>
        </p>
      </div>
      <div class="right">
        <button class="btn" @click="router.push('/')">← 返回上传</button>
        <button class="btn btnPrimary" :disabled="loading" @click="run">
          {{ loading ? '分析中…' : '重新分析' }}
        </button>
      </div>
    </header>

    <div v-if="!hasDataset" class="surface empty">
      <div class="h2">还没有数据</div>
      <p class="muted">回到首页上传数据后再分析。</p>
      <button class="btn btnPrimary" @click="router.push('/')">去上传</button>
    </div>

    <div v-else class="grid">
      <section class="surface section">
        <div class="row">
          <div class="h2">报告</div>
          <span class="pill">模型：{{ session.model || '未选择' }}</span>
        </div>

        <div v-if="errorMsg" class="alert">
          <div class="alertTitle">暂时无法生成完整报告</div>
          <div class="muted">请稍后重试，或换一个模型再试。</div>
        </div>

        <div class="cards">
          <div class="surface2 card">
            <div class="cardLabel">Summary</div>
            <div class="cardText">{{ session.result.normalized?.summary || '—' }}</div>
          </div>
          <div class="surface2 card">
            <div class="cardLabel">Overview</div>
            <div class="cardText">{{ session.result.normalized?.report?.overview || '—' }}</div>
          </div>
        </div>

        <div class="report">
          <div class="surface2 block">
            <div class="blockTitle">关键洞察</div>
            <ul class="list">
              <li v-for="(x, i) in listOrDash(session.result.normalized?.report?.insights)" :key="i">{{ x }}</li>
            </ul>
          </div>
          <div class="surface2 block">
            <div class="blockTitle">风险 / 异常</div>
            <ul class="list">
              <li v-for="(x, i) in listOrDash(session.result.normalized?.report?.risks)" :key="i">{{ x }}</li>
            </ul>
          </div>
          <div class="surface2 block">
            <div class="blockTitle">建议</div>
            <ul class="list">
              <li v-for="(x, i) in listOrDash(session.result.normalized?.report?.recommendations)" :key="i">{{ x }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="surface section">
        <div class="h2">图表</div>
        <div class="spacer" />
        <div v-if="canRender" class="chart">
          <BarChart
            :labels="session.result.normalized.chartData.labels"
            :values="session.result.normalized.chartData.values"
            title="AI Generated Chart"
          />
        </div>
        <div v-else class="muted">暂无可渲染 chartData（或正在分析）。</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 28px 0 56px;
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.right {
  display: flex;
  gap: 10px;
}
.sep {
  margin: 0 8px;
  opacity: 0.5;
}
.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 14px;
}
.section {
  padding: 16px;
}
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
}
.alert {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 92, 122, 0.45);
  background: rgba(255, 92, 122, 0.1);
}
.alertTitle {
  font-weight: 650;
  margin-bottom: 4px;
}
.cards {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.card {
  padding: 12px;
}
.cardLabel {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}
.cardText {
  letter-spacing: -0.01em;
}
.report {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}
.block {
  padding: 12px;
}
.blockTitle {
  font-weight: 650;
  margin-bottom: 8px;
}
.list {
  margin: 0;
  padding-left: 18px;
  color: rgba(255, 255, 255, 0.82);
}
.chart {
  height: 420px;
}
.empty {
  padding: 18px;
  display: grid;
  gap: 10px;
}
.spacer {
  height: 10px;
}
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
@media (max-width: 980px) {
  .head {
    align-items: flex-start;
    flex-direction: column;
  }
  .grid {
    grid-template-columns: 1fr;
  }
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>

