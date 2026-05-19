<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {{ title }}
    </h3>

    <div class="relative h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { ChartConfiguration } from 'chart.js'

Chart.register(...registerables)

interface Repository {
  id: string
  name: string
  owner: string
  starsHistory: number[]
  commitsHistory: number[]
  issuesHistory: number[]
  prHistory: number[]
}

const props = defineProps<{
  title: string
  repositories: Repository[]
  metricKey: 'starsHistory' | 'commitsHistory' | 'issuesHistory' | 'prHistory'
  type: 'line' | 'bar'
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const colors = [
  'rgba(79, 70, 229, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(6, 182, 212, 0.8)',
] as const

const borderColors = [
  'rgb(79, 70, 229)',
  'rgb(16, 185, 129)',
  'rgb(245, 158, 11)',
  'rgb(239, 68, 68)',
  'rgb(139, 92, 246)',
  'rgb(6, 182, 212)',
] as const

function getColor(index: number): string {
  return colors[index % colors.length]!
}

function getBorderColor(index: number): string {
  return borderColors[index % borderColors.length]!
}

function getMetricData(repo: Repository): number[] {
  return repo[props.metricKey]
}

function initializeChart() {
  if (!chartCanvas.value) return

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy()
  }

  const datasets = props.repositories.map((repo, idx) => {
    const data = getMetricData(repo)
    const baseConfig = {
      label: `${repo.owner}/${repo.name}`,
      data,
      borderColor: getBorderColor(idx),
      backgroundColor: getColor(idx),
      tension: 0.4,
      fill: false,
    }

    if (props.type === 'bar') {
      return {
        ...baseConfig,
        backgroundColor: getColor(idx),
        borderRadius: 4,
      }
    }

    return {
      ...baseConfig,
      fill: false,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: getBorderColor(idx),
    }
  })

  const config: ChartConfiguration = {
    type: props.type,
    data: {
      labels: Array.from({ length: Math.max(...props.repositories.map((r) => getMetricData(r).length), 0) }, (_, i) => {
        const months = ['\u042f\u043d\u0432', '\u0424\u0435\u0432', '\u041c\u0430\u0440', '\u0410\u043f\u0440', '\u041c\u0430\u0439', '\u0418\u044e\u043d', '\u0418\u044e\u043b', '\u0410\u0432\u0433', '\u0421\u0435\u043d', '\u041e\u043a\u0442', '\u041d\u043e\u044f', '\u0414\u0435\u043a']
        return months[i] ?? `\u041c${i + 1}`
      }),
      datasets: datasets as any,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
            color: getComputedStyle(document.documentElement).getPropertyValue(
              '--color-gray-900'
            ) || '#111827',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
          },
          bodyFont: {
            size: 12,
          },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(156, 163, 175, 0.1)',
          },
          border: {
            display: false,
          },
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 11,
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: 'rgba(107, 114, 128, 1)',
            font: {
              size: 11,
            },
          },
        },
      },
    },
  }

  chartInstance = new Chart(chartCanvas.value, config)
}

onMounted(() => {
  initializeChart()
})

watch(() => props.repositories, initializeChart, { deep: true })
watch(() => props.metricKey, initializeChart)
watch(() => props.type, initializeChart)
</script>
