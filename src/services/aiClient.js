import { sampleArray } from "../utils/sample";
import { createHttpClient } from "./httpClient";

export function getAiConfig() {
  return {
    baseUrl: normalizeV1BaseUrl(
      import.meta.env.VITE_AI_BASE_URL ||
        "https://open.bigmodel.cn/api/paas/v4",
    ),
    apiKey: (import.meta.env.VITE_AI_API_KEY || "").trim(),
    defaultModel: (import.meta.env.VITE_AI_MODEL || "").trim(),
    models: parseModels(import.meta.env.VITE_AI_MODELS || ""),
  };
}

function normalizeV1BaseUrl(url) {
  const u = String(url || "")
    .trim()
    .replace(/\/+$/, "");
  if (!u) return "https://open.bigmodel.cn/api/paas/v4";

  // BigModel paas v4：本身不是 OpenAI 的 /v1 体系，不要追加 /v1
  if (u.includes("/api/paas/v4")) return u;

  // OpenAI-compatible：允许用户只填域名，自动补 /v1
  if (u.endsWith("/v1")) return u;
  return `${u}/v1`;
}

function parseModels(text) {
  const items = String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
}

export function buildReportPrompt({ sampleData }) {
  // 在 JSON 模式下：system 里定义结构 + 约束；user 里只放数据与任务
  return `请基于以下数据生成分析报告与图表数据（只输出 JSON，不要输出解释）：\n${JSON.stringify(sampleData)}`;
}

export async function analyzeWithAi({
  rows,
  model,
  sampleSize = 60,
  signal,
} = {}) {
  const { baseUrl, apiKey, defaultModel } = getAiConfig();
  const chosenModel = (model || defaultModel || "").trim();

  const sampled = sampleArray(rows || [], sampleSize);
  const prompt = buildReportPrompt({ sampleData: sampled });

  if (!chosenModel) throw new Error("未选择模型");
  if (!apiKey)
    throw new Error(
      "缺少 API Key：请在 .env.local 设置 VITE_AI_API_KEY 后重启 dev server",
    );

  const system = `
你是一个数据分析助手。请严格按照以下 JSON 格式返回分析结果（必须是合法 JSON，且不要输出任何多余解释文本）：

{
  "summary": "对数据的总结（字符串）",
  "report": {
    "overview": "一句话概览（字符串）",
    "insights": ["关键洞察（字符串数组，3-7条）"],
    "risks": ["风险/异常（字符串数组，0-5条）"],
    "recommendations": ["建议（字符串数组，3-7条）"]
  },
  "chartData": {
    "labels": [],
    "values": []
  }
}

要求：
1. 必须返回合法 JSON（一个 JSON object）
2. 不要输出 Markdown/代码块/解释，只能输出 JSON
3. chartData.labels 与 chartData.values 长度必须一致
4. values 必须是数字
5. 所有结论必须基于用户提供的数据
6. summary、report.overview、report.insights、report.risks、report.recommendations 必须使用中文输出
`.trim();

  const body = {
    model: chosenModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    // glm-4.7-flash 等支持：强制 JSON 模式
    response_format: { type: "json_object" },
  };

  const client = createHttpClient();
  const res = await client.post(`${baseUrl}/chat/completions`, body, {
    signal,
  });
  const data = res.data;
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") throw new Error("AI 返回内容为空或非字符串");

  return { mode: "ai", prompt, raw, meta: { model: chosenModel } };
}
