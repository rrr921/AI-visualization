<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file'])

const dragging = ref(false)

function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) emit('file', f)
}

function onPick(e) {
  const f = e.target?.files?.[0]
  if (f) emit('file', f)
  e.target.value = ''
}
</script>

<template>
  <div
    class="drop surface2"
    :class="{ dragging }"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop="onDrop"
  >
    <div class="title">上传数据</div>
    <div class="desc muted">支持 CSV / JSON。也可以直接拖拽文件到这里。</div>
    <div class="row">
      <label class="btn">
        选择文件
        <input class="hidden" type="file" accept=".csv,.json,text/csv,application/json" @change="onPick" />
      </label>
      <span class="muted2">建议：表格数据（CSV）或数组 JSON（[{...},{...}])</span>
    </div>
  </div>
</template>

<style scoped>
.drop {
  padding: 16px;
  border-radius: var(--radius);
  border: 1px dashed rgba(255, 255, 255, 0.18);
}
.dragging {
  border-color: rgba(33, 212, 253, 0.7);
  box-shadow: 0 0 0 4px rgba(33, 212, 253, 0.18);
}
.title {
  font-weight: 650;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}
.desc {
  font-size: 13px;
  margin-bottom: 12px;
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.hidden {
  display: none;
}
.muted2 {
  color: var(--muted2);
  font-size: 12px;
}
</style>

