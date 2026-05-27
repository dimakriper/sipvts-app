<template>
  <div>
    <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {{ title }}
    </p>

    <div class="relative h-48">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import type { DataPoint } from '../../stores/analytics'

Chart.register(...registerables)

interface Repository {
  id: string
  name: string
  owner: string
  starsHistory: DataPoint[]
  commitsHistory: DataPoint[]
  issuesHistory: DataPoint[]
  prHistory: DataPoint[]
}

const props = defineProps<{
  title: string
  repositories: Repository[]
  metricKey: 'starsHistory' | 'commitsHistory' | 'issuesHistory' | 'prHistory'
  type: 'line' | 'bar'
  delta?: boolean
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

function getMetricData(repo: Repository): { t: number; v: number }[] {
  return repo[props.metricKey]
}

function formatMonthYear(ts: number): string {
  const d = new Date(ts)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${mm}/${yyyy}`
}

function initializeChart() {
  if (!chartCanvas.value) return

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy()
  }

  // Build shared label axis from all repos' timestamps
  const allPoints = props.repositories.flatMap(r => getMetricData(r))
  const uniqueTs = [...new Set(allPoints.map(p => p.t))].sort((a, b) => a - b)
  const labels = uniqueTs.length > 0
    ? uniqueTs.map(formatMonthYear)
    : []

  if (labels.length === 0) return

  // Each dataset aligned to the shared label array (null for missing months)
  const datasets = props.repositories.map((repo, idx) => {
    const raw = getMetricData(repo)
    const aligned = uniqueTs.map(ts => {
      const point = raw.find(p => p.t === ts)
      return point !== undefined ? point.v : null
    })
    // When delta=true, show month-over-month change; first point becomes null
    const data = props.delta
      ? aligned.map((v, i) => {
          if (i === 0 || v === null || aligned[i - 1] === null) return null
          return v - (aligned[i - 1] as number)
        })
      : aligned
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
      labels,
      datasets: datasets as any,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: props.repositories.length > 1,
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
