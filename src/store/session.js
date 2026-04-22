import { reactive } from 'vue'

export const session = reactive({
  dataset: {
    name: '',
    rows: [],
    columns: [],
    preview: [],
  },
  model: '',
  sampleSize: 60,
  result: {
    prompt: '',
    raw: '',
    parsed: null,
    normalized: null,
    mode: '', // ai | fallback
    error: '',
  },
})

