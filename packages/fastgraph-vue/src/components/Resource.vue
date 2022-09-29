<template>
  <template v-if="resource">
    <section v-if="showTable && showHeader">
      <ResourceFilter />
      <ResourceAction />
    </section>
    <ResourceData
      ref="resourceDataRef"
      :showChart="showChart"
      :showTable="showTable"
      :showPagination="showPagination"
      :chartStyle="chartStyle"
      :chartOptions="chartOptions"
    />
    <EditDrawer
      v-if="showTable"
      :resource="resource"
      :visible="drawerVisible"
      :recordId="record?.id"
    />
    <ViewDrawer
      v-if="showTable"
      :resource="resource"
      :visible="viewDrawerVisible"
      :recordId="record?.id"
    />
  </template>
  <template v-else>
    <a-empty :description="$t('Resource not available...')" />
  </template>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  inject,
  PropType,
  provide,
  Ref,
  ref,
  watch
} from 'vue'
import { RecordOperationItem, ResourceItem, ResourceStore } from '../types'
import ResourceData from './ResourceData.vue'
import ResourceFilter from './ResourceFilter.vue'
import ResourceAction from './ResourceAction.vue'
import EditDrawer from './EditDrawer.vue'
import ViewDrawer from './ViewDrawer.vue'

export default defineComponent({
  props: {
    resourceKey: {
      type: String,
      required: true
    },
    showChart: {
      type: Boolean,
      default: true
    },
    showTable: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    chartStyle: {
      type: Object
    },
    chartOptions: {
      type: Object
    },
    extRecordOperations: {
      type: Array as PropType<RecordOperationItem[]>
    },
    defaultFilters: {
      type: Object as PropType<any>,
      default: () => ({})
    }
  },

  components: {
    ResourceData,
    ResourceFilter,
    ResourceAction,
    EditDrawer,
    ViewDrawer
  },

  emits: ['fieldClick'],

  setup(props, ctx) {
    const schema = inject('SCHEMA') as Ref<ResourceStore>
    const drawerVisible = ref<boolean>(false)
    const viewDrawerVisible = ref<boolean>(false)
    const record = ref<any>()
    const resource = computed<ResourceItem | undefined>(
      () => schema.value[props.resourceKey as string]
    )

    const showEditDrawer = (val?: any) => {
      record.value = val
      drawerVisible.value = true
    }

    const closeEditDrawer = () => {
      drawerVisible.value = false
    }

    const showViewDrawer = (val?: any) => {
      record.value = val
      viewDrawerVisible.value = true
    }

    const closeViewDrawer = () => {
      viewDrawerVisible.value = false
    }

    const resourceDataRef = ref<InstanceType<typeof ResourceData>>()
    const refetchList = () => resourceDataRef.value?.refetch()

    provide('resource', resource)
    provide('showEditDrawer', showEditDrawer)
    provide('closeEditDrawer', closeEditDrawer)
    provide('showViewDrawer', showViewDrawer)
    provide('closeViewDrawer', closeViewDrawer)
    provide('refetchList', refetchList)

    provide(
      'extRecordOperations',
      computed(() => props.extRecordOperations)
    )
    provide(
      'defaultFilters',
      computed(() => props.defaultFilters)
    )
    provide('onFieldClicked', (record: any, field: string) => {
      ctx.emit('fieldClick', { record, field })
    })

    const selectedRowKeys = ref([])
    const onSelectedRowKeys = (keys: any) => (selectedRowKeys.value = keys)
    provide('selectedRowKeys', selectedRowKeys)
    provide('onSelectedRowKeys', onSelectedRowKeys)
    watch(props, () => onSelectedRowKeys([]))

    return {
      resource,
      record,
      drawerVisible,
      viewDrawerVisible,
      resourceDataRef,
      refetchList,
      selectedRowKeys,
      onSelectedRowKeys
    }
  }
})
</script>
