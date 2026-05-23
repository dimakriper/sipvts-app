<template>
  <div class="relative w-full h-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
    <div
      ref="containerRef"
      class="w-full h-full"
    />

    <!-- Tooltip -->
    <div
      v-if="hoveredNode"
      class="absolute pointer-events-none z-20 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl p-3 min-w-[160px]"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <p class="font-bold text-sm mb-1">
        {{ hoveredNode.id }}
      </p>
      <p class="text-gray-300">
        {{ hoveredNode.count }} проектов ({{ hoveredNode.percentage }}%)
      </p>
      <p
        class="mt-1 text-xs"
        :style="{ color: hoveredNode.communityColor }"
      >
        {{ communityName(hoveredNode.communityId) }}
      </p>
    </div>

    <!-- Community legend -->
    <div class="absolute bottom-3 left-3 flex flex-col gap-1">
      <p class="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
        Сообщества
      </p>
      <div
        v-for="c in communities"
        :key="c.id"
        class="flex items-center gap-1.5 text-xs transition-opacity"
        :class="activeCommunities.has(c.id) ? 'opacity-100' : 'opacity-30'"
      >
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: c.color }"
        />
        <span class="text-gray-700 dark:text-gray-300">{{ c.name }}</span>
        <span class="text-gray-400">({{ c.members.length }})</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="absolute top-3 right-3 flex gap-2">
      <button
        class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-50 dark:hover:bg-gray-600"
        @click="reheat"
      >
        ↺ Перемешать
      </button>
      <button
        class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-50 dark:hover:bg-gray-600"
        @click="fitAll"
      >
        ⤢ По размеру
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { GraphNode, GraphLink, CommunityInfo } from '../../stores/stack'

interface Props {
  nodes: GraphNode[]
  links: GraphLink[]
  communities: CommunityInfo[]
  selectedDep: string | null
  activeCommunities: Set<number>
  jaccardThreshold: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ selectDep: [name: string | null] }>()

const containerRef = ref<HTMLDivElement | null>(null)
const hoveredNode = ref<GraphNode | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

// force-graph wraps an untyped factory API; use 'any' to avoid repeated casts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGInstance = any

let fg: FGInstance | null = null
let resizeObserver: ResizeObserver | null = null

function communityName(id: number): string {
  return props.communities.find(c => c.id === id)?.name ?? `Сообщество ${id + 1}`
}

function buildData() {
  const activeNodes = props.nodes.filter(n => props.activeCommunities.has(n.communityId))
  const activeNodeIds = new Set(activeNodes.map(n => n.id))

  const neighbors = new Set<string>()
  if (props.selectedDep) {
    neighbors.add(props.selectedDep)
    for (const l of props.links) {
      if (l.source === props.selectedDep) neighbors.add(l.target)
      if (l.target === props.selectedDep) neighbors.add(l.source)
    }
  }

  const activeLinks = props.links.filter(
    l =>
      activeNodeIds.has(l.source as string)
      && activeNodeIds.has(l.target as string)
      && l.weight >= props.jaccardThreshold
  )

  return {
    nodes: activeNodes.map(n => ({
      ...n,
      val: Math.max(1, n.count / 10),
      color: props.selectedDep
        ? (neighbors.has(n.id) ? n.communityColor : 'rgba(180,180,180,0.25)')
        : n.communityColor
    })),
    links: activeLinks.map(l => ({
      ...l,
      color: (
        props.selectedDep
        && !neighbors.has(l.source as string)
        && !neighbors.has(l.target as string)
      )
        ? 'rgba(200,200,200,0.1)'
        : `rgba(150,150,150,${Math.min(0.8, l.weight + 0.1)})`
    }))
  }
}

async function initGraph() {
  if (!containerRef.value) return
  const mod = await import('force-graph')
  // force-graph factory pattern: ForceGraph()(element)
  const factory = mod.default as unknown as () => FGInstance
  const width = containerRef.value.clientWidth || 800
  const height = containerRef.value.clientHeight || 500

  fg = factory()(containerRef.value)
    .width(width)
    .height(height)
    .backgroundColor('transparent')
    .nodeId('id')
    .nodeVal(n => (n.val as number) || 1)
    .nodeColor(n => n.color as string)
    .nodeCanvasObjectMode(() => 'after')
    .nodeCanvasObject((node, ctx, globalScale) => {
      if (node.x == null || node.y == null) return
      const fontSize = Math.max(7, 11 / globalScale)
      ctx.font = `${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(30,30,30,0.9)'
      const r = Math.sqrt(Math.max(1, (node.val as number) || 1)) * 4
      ctx.fillText(node.id as string, node.x as number, (node.y as number) + r + 1)
    })
    .linkWidth(l => Math.max(0.5, (l.weight as number) * 5))
    .linkColor(l => l.color as string)
    .onNodeClick(node => emit('selectDep', node.id as string))
    .onNodeHover((node) => { hoveredNode.value = node as GraphNode | null })

  const charge = fg.d3Force('charge')
  if (charge) charge.strength(-180)
  const linkForce = fg.d3Force('link')
  if (linkForce) {
    linkForce.distance((l: GraphLink) => 60 + 80 * (1 - l.weight))
    linkForce.strength((l: GraphLink) => l.weight * 0.6)
  }

  fg.graphData(buildData())

  containerRef.value.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = containerRef.value!.getBoundingClientRect()
    tooltipX.value = e.clientX - rect.left + 14
    tooltipY.value = e.clientY - rect.top - 10
  })
}

function reheat() {
  fg?.d3ReheatSimulation()
}
function fitAll() {
  fg?.zoomToFit(400, 40)
}

onMounted(async () => {
  await initGraph()
  resizeObserver = new ResizeObserver(() => {
    if (fg && containerRef.value) {
      fg.width(containerRef.value.clientWidth).height(containerRef.value.clientHeight)
    }
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  fg?._destructor?.()
})

watch(
  () => [props.nodes, props.links, props.selectedDep, props.activeCommunities, props.jaccardThreshold],
  () => { if (fg) fg.graphData(buildData()) },
  { deep: true }
)
</script>
