<template>
  <div :id="id" :style="{ width: '640px', height: '320px', ...style }"></div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  shallowRef,
  watch
} from 'vue'
import * as echarts from 'echarts'
import { ResourceItem } from '../types'

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true
    },
    resource: {
      type: Object as PropType<ResourceItem>
    },
    type: {
      type: String
    },
    dimensions: {
      type: Array as PropType<string[]>
    },
    // dimensions that generated because of @Chart decorator
    matrixDimensions: {
      type: Array as PropType<string[]>
    },
    options: {
      type: Object as any
    },
    data: {
      type: Array as any,
      default: () => []
    },
    style: {
      type: Object
    }
  },

  setup(props) {
    const chart = shallowRef<any>()
    const resizeFn = ref<any>()

    const options = computed(() => {
      const chart = props.resource?.decorators.chart
      const type: string = props.type || chart?.value || 'line'
      const options = props.options || chart?.keywords?.options || {}
      const dimensions =
        props.dimensions ||
        chart?.keywords?.dimensions ||
        // use matrix cols as dimensions
        props.matrixDimensions ||
        // default to use first 2 fields as dimensions
        props.resource?.fields.slice(0, 2).map((item) => item.field) ||
        []

      // options merge: dataset first item is source data which cannot be overridden
      return {
        legend: {},
        yAxis: {},
        xAxis: { type: 'category' },
        series: Array.from({ length: dimensions.length - 1 }, () => ({ type })),
        grid: { containLabel: true, left: 8, right: 8, bottom: 24 },
        ...options,
        dataset: [
          {
            dimensions,
            source: props.data
          },
          ...(options.dataset || [])
        ]
      }
    })

    const initChart = () => {
      const elem = document.getElementById(props.id)
      if (!elem) return
      chart.value && chart.value.dispose()
      chart.value = echarts.init(elem)
      chart.value.setOption(options.value)

      window.removeEventListener('resize', resizeFn.value)
      resizeFn.value = () => chart.value.resize()
      window.addEventListener('resize', resizeFn.value)
    }

    onMounted(() => {
      initChart()
    })

    onUnmounted(() => {
      echarts.dispose(chart.value)
      window.removeEventListener('resize', resizeFn.value)
    })

    watch(props, () => initChart())
  }
})
</script>
