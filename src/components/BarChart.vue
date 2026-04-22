<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  title: { type: String, default: '' },
})

const canvasRef = ref(null)
let chart = null

function render() {
  if (!canvasRef.value) return
  if (chart) chart.destroy()

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.title || 'Values',
          data: props.values,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: Boolean(props.title) },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  })
}

onMounted(render)
watch(() => [props.labels, props.values, props.title], render, { deep: true })
onBeforeUnmount(() => {
  if (chart) chart.destroy()
  chart = null
})
</script>

<template>
  <div class="wrap">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.wrap {
  height: 360px;
  width: 100%;
}
</style>

