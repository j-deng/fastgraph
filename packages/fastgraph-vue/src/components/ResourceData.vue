<template>
  <Chart
    v-if="showChart && resource.decorators.chart"
    :id="resource.key"
    :resource="resource"
    :data="dataSource"
    :matrixDimensions="matrixDimensions"
    :style="chartStyle"
    :options="chartOptions"
  />
  <a-table
    v-if="showTable"
    rowKey="id"
    :row-selection="{ onChange: onSelectedRowKeys, selectedRowKeys }"
    :dataSource="dataSource"
    :columns="columns"
    :loading="loading"
    :pagination="pagination"
    :scroll="{ x: '1300' }"
    :sorter="sorter"
    @change="handleTableChange"
  >
    <template #bodyCell="{ column, record }">
      <RecordOperation
        v-if="column.dataIndex === '_operation'"
        :record="record"
        :operations="recordOperations"
      />
      <ResourceField
        v-else
        :resource="resource"
        :fieldKey="column.key"
        :record="record"
      />
    </template>
  </a-table>
</template>

<script lang="ts">
import { useQuery } from '@vue/apollo-composable'
import {
  computed,
  defineAsyncComponent,
  defineComponent,
  inject,
  Ref,
  ref,
  watch
} from 'vue'
import { message, TableProps } from 'ant-design-vue'
import { makeListQuery, resourceRouteNames } from '../core'
import { ResourceItem, ResourceRoute } from '../types'
import RecordOperation from './RecordOperation.vue'
import ResourceField from './ResourceField.vue'
import Chart from './Chart.vue'
import { columnEllipsis, columnWidth, isOmit, isSortableField } from '../field'
import useMatrix from '../composables/matrix'
import useRecordOperation from '../composables/recordOpeartion'
import useTranslation from '../composables/translation'
import useRouteFilter, {
  PageSorterQuery,
  PAGE_SIZE
} from '../composables/routeFilter'

export default defineComponent({
  props: {
    showChart: {
      type: Boolean,
      default: true
    },
    showTable: {
      type: Boolean,
      default: true
    },
    chartStyle: {
      type: Object
    },
    chartOptions: {
      type: Object
    }
  },

  components: {
    RecordOperation,
    ResourceField,
    Chart
    // Chart: defineAsyncComponent(() => import('./Chart.vue'))
  },

  setup() {
    const resource = inject('resource') as Ref<ResourceItem>
    const { filters, pageAndSorter, addPageAndSorter } =
      useRouteFilter(resource)
    const total = ref(0)
    const current = computed(() => pageAndSorter.value.page)
    const pageSize = computed(() => pageAndSorter.value.pageSize)
    const sorter = computed(() => pageAndSorter.value.sorter)
    const pagination = computed(() => ({
      total: total.value,
      current: current.value,
      pageSize: pageSize.value
    }))
    const orderBy = computed(() => {
      const _sorter = sorter.value
      if (_sorter?.order) {
        return {
          [_sorter.field]: _sorter.order.replace('end', '')
        }
      }
    })
    const variables = computed(() => {
      return {
        skip: (current.value - 1) * pageSize.value,
        take: pageSize.value,
        filter: filters.value,
        orderBy: orderBy.value || {
          id: 'desc'
        }
      }
    })

    const resetState = () => {
      total.value = 0
    }

    watch(resource, resetState)

    const query = computed(() => makeListQuery(resource.value))
    const { loading, refetch, onResult, onError } = useQuery(query, variables, {
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    })

    const result = ref([])

    onResult((queryResult) => {
      const { data } = queryResult
      const resultKey = resourceRouteNames(resource.value)?.index as string
      result.value = (data && data[resultKey].data) || []
      total.value = (data && data[resultKey].count) || 0
    })

    onError((error) => {
      message.error(error.message)
    })

    const { matrixDimensions, matrixData, matrixColumns } = useMatrix(
      resource,
      result
    )

    const dataSource = computed(() => {
      return matrixData.value || result.value
    })

    const { recordOperations } = useRecordOperation(
      resource,
      refetch,
      inject('showEditDrawer') as Function,
      inject('showViewDrawer') as Function,
      inject('extRecordOperations') as any
    )

    const { t, fieldName_t } = useTranslation()

    const columns = computed(() => {
      const value =
        matrixColumns.value ||
        resource.value.fields
          .filter((field) => !isOmit(field, ResourceRoute.index))
          .map((field) => ({
            key: field.field,
            dataIndex: field.field,
            title: fieldName_t(field),
            sorter: isSortableField(field),
            sortOrder:
              sorter.value?.field === field.field && sorter.value.order,
            width: columnWidth(field),
            ellipsis: columnEllipsis(field)
          }))
      if (recordOperations.value.length) {
        return value.concat([
          {
            key: '_operation',
            dataIndex: '_operation',
            title: t('Operation'),
            fixed: 'right',
            width: 140
          } as any
        ])
      }
      return value
    })

    const selectedRowKeys = inject('selectedRowKeys', [])
    const onSelectedRowKeys = inject('onSelectedRowKeys')

    const handleTableChange: TableProps['onChange'] = (
      page,
      filters,
      sorter: any
    ) => {
      const { field, order } = sorter
      const query: PageSorterQuery = {}
      if (page.current && page.current > 1) {
        query._page = page.current
      }
      if (page.pageSize && page.pageSize !== PAGE_SIZE) {
        query._pageSize = page.pageSize
      }
      if (field && order) {
        query._sorter = `${field}-${order}`
      }
      addPageAndSorter(query)
    }

    return {
      resource,
      columns,
      loading,
      dataSource,
      onSelectedRowKeys,
      selectedRowKeys,
      pagination,
      sorter,
      matrixDimensions,
      refetch,
      handleTableChange,
      recordOperations
    }
  }
})
</script>
