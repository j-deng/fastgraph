<template>
  <a-drawer
    :width="640"
    :visible="visible"
    :closable="false"
    :body-style="{ paddingBottom: '80px' }"
    @close="close"
  >
    <p :style="headStyle">
      {{ title }}
    </p>
    <div v-if="loading && !record" style="text-align: center; margin-top: 60px">
      <a-spin />
    </div>
    <a-row :gutter="12" v-if="record">
      <a-col v-for="item in showFields" :key="item.key" :span="item.colSpan">
        <p style="margin-bottom: 12px; color: rgba(0, 0, 0, 0.65)">
          <span style="margin-right: 8px; color: rgba(0, 0, 0, 0.85)">
            {{ item.title }}：
          </span>
          <ResourceField
            :resource="resource"
            :fieldKey="item.key"
            :record="record"
          />
        </p>
      </a-col>
    </a-row>
  </a-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, inject } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { message } from 'ant-design-vue'
import { ResourceItem, ResourceRoute } from '../types'
import { makeDetailQuery, resourceRouteNames } from '../core'
import ResourceField from './ResourceField.vue'
import { fieldRefIsList, isOmit } from '../field'
import useTranslation from '../composables/translation'

export default defineComponent({
  props: {
    visible: Boolean,
    recordId: [Number, String] as any,
    resource: {
      type: Object as PropType<ResourceItem>,
      required: true
    }
  },

  // @todo detail field may different from resource list field
  components: { ResourceField },

  setup(props) {
    const record = ref<any>()
    const closeViewDrawer = inject('closeViewDrawer') as Function
    const { fieldName_t, resourceName_t } = useTranslation()
    const title = computed(() => resourceName_t(props.resource))

    const query = computed(() => makeDetailQuery(props.resource))
    const variables = computed(() => ({ id: props.recordId }))
    const { onResult, loading, onError } = useQuery(query, variables, () => ({
      enabled: !!props.recordId && props.visible,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }))

    onResult((queryResult) => {
      const { data } = queryResult
      const resultKey = resourceRouteNames(props.resource)?.detail as string
      const value = data && data[resultKey]
      record.value = value
    })

    onError((error) => {
      message.error(error.message)
    })

    const showFields = computed(() => {
      return props.resource.fields
        .filter((field) => !isOmit(field, ResourceRoute.detail))
        .map((field) => ({
          key: field.field,
          title: fieldName_t(field),
          // @todo solSpan configable
          colSpan: field.field === 'id' || fieldRefIsList(field) ? 24 : 12
        }))
    })

    const close = () => {
      closeViewDrawer()
      setTimeout(() => {
        record.value = undefined
      }, 300)
    }

    const headStyle = {
      fontSize: '16px',
      color: 'rgba(0, 0, 0, 0.85)',
      lineHeight: '24px',
      display: 'block',
      marginBottom: '24px'
    }

    return {
      close,
      loading,
      record,
      showFields,
      title,
      headStyle
    }
  }
})
</script>
