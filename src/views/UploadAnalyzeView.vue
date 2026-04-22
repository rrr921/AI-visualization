<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import FileDropzone from "../components/FileDropzone.vue";
import { session } from "../store/session";
import { parseCsv } from "../utils/csv";
import { safeJsonParse } from "../utils/json";

const router = useRouter();

const envModel = (import.meta.env.VITE_AI_MODEL || "").trim();
const envModels = (import.meta.env.VITE_AI_MODELS || "").trim();
const modelIds = (envModels ? envModels.split(",") : [envModel])
  .map((x) => String(x || "").trim())
  .filter(Boolean);
const models = modelIds.length
  ? modelIds.map((id, i) => ({ id, label: i === 0 ? `${id}（推荐）` : id }))
  : [{ id: "DeepSeek", label: "DeepSeek" }];

const fileName = ref("");
const parseError = ref("");

const selectedModel = computed({
  get: () => session.model || import.meta.env.VITE_AI_MODEL || models[0].id,
  set: (v) => {
    session.model = v;
  },
});

const canAnalyze = computed(
  () => session.dataset.rows.length > 0 && !!selectedModel.value,
);

function setDataset({ name, columns, rows }) {
  session.dataset.name = name || "";
  session.dataset.columns = columns || (rows[0] ? Object.keys(rows[0]) : []);
  session.dataset.rows = rows;
  session.dataset.preview = rows.slice(0, 8);
}

async function onFile(file) {
  parseError.value = "";
  fileName.value = file.name;
  const text = await file.text();

  if (file.name.toLowerCase().endsWith(".csv")) {
    const parsed = parseCsv(text);
    if (!parsed.ok) {
      parseError.value = `CSV 解析失败：${parsed.error}`;
      setDataset({ name: file.name, columns: [], rows: [] });
      return;
    }
    setDataset({
      name: file.name,
      columns: parsed.value.columns,
      rows: parsed.value.rows,
    });
    return;
  }

  const parsed = safeJsonParse(text);
  if (!parsed.ok) {
    parseError.value = `JSON 解析失败：${parsed.error}`;
    setDataset({ name: file.name, columns: [], rows: [] });
    return;
  }

  const value = parsed.value;
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(value?.rows)
      ? value.rows
      : null;
  if (!rows || rows.length === 0 || typeof rows[0] !== "object") {
    parseError.value =
      "JSON 格式不符合：需要数组 JSON（[{...},{...}]) 或 { rows: [...] }";
    setDataset({ name: file.name, columns: [], rows: [] });
    return;
  }

  setDataset({ name: file.name, columns: Object.keys(rows[0]), rows });
}

function goAnalyze() {
  if (!canAnalyze.value) return;
  router.push("/report");
}
</script>

<template>
  <div class="container page">
    <header class="hero surface">
      <div class="top">
        <span class="pill">上传数据</span>
        <span class="pill">一键生成报告</span>
      </div>
      <h1 class="h1">AI visualization</h1>
      <p class="muted">
        不懂数据分析也没关系：上传文件，点击开始，系统会自动生成“结论 + 洞察 + 建议 + 图表”。
      </p>
    </header>

    <div class="grid2">
      <section class="surface section">
        <h2 class="h2">1) 上传数据</h2>
        <div class="spacer" />
        <FileDropzone @file="onFile" />
        <div v-if="fileName" class="meta muted">当前文件：{{ fileName }}</div>
        <div v-if="parseError" class="alert danger">{{ parseError }}</div>

        <div v-if="session.dataset.preview.length" class="preview surface2">
          <div class="previewTitle">
            数据预览（前 {{ session.dataset.preview.length }} 行）
          </div>
          <div class="tableWrap">
            <table class="table">
              <thead>
                <tr>
                  <th v-for="c in session.dataset.columns.slice(0, 6)" :key="c">
                    {{ c }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in session.dataset.preview" :key="idx">
                  <td v-for="c in session.dataset.columns.slice(0, 6)" :key="c">
                    {{ r?.[c] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="muted2">已自动识别字段并预览数据，确认无误后即可开始分析。</div>
        </div>
      </section>

      <section class="surface section">
        <h2 class="h2">2) 选择模型</h2>
        <div class="spacer" />

        <div class="field">
          <div class="label">模型</div>
          <select v-model="selectedModel" class="control">
            <option v-for="m in models" :key="m.id" :value="m.id">
              {{ m.label }}
            </option>
          </select>
        </div>

        <div class="actions">
          <button
            class="btn btnPrimary"
            :disabled="!canAnalyze"
            @click="goAnalyze"
          >
            开始分析 →
          </button>
          <div class="muted2">
            <span v-if="!session.dataset.rows.length">先上传数据</span>
            <span v-else>已加载 {{ session.dataset.rows.length }} 行</span>
          </div>
        </div>

      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 28px 0 56px;
}
.hero {
  padding: 20px 18px 18px;
  margin-bottom: 14px;
}
.top {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.section {
  padding: 16px;
}
.spacer {
  height: 10px;
}
.meta {
  margin-top: 10px;
  font-size: 13px;
}
.actions {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}
.alert {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 92, 122, 0.45);
  background: rgba(255, 92, 122, 0.1);
}
.danger {
  color: rgba(255, 255, 255, 0.9);
}
.preview {
  margin-top: 12px;
  padding: 12px;
}
.previewTitle {
  font-weight: 650;
  margin-bottom: 10px;
}
.tableWrap {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.15);
  margin-bottom: 10px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.table th,
.table td {
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  text-align: left;
}
.table th {
  position: sticky;
  top: 0;
  background: rgba(15, 27, 51, 0.8);
  backdrop-filter: blur(8px);
}
.tip {
  margin-top: 14px;
  padding: 12px;
}
.tipTitle {
  font-weight: 650;
  margin-bottom: 6px;
}
.tipText {
  color: var(--muted);
  font-size: 13px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
