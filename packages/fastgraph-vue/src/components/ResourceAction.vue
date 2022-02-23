<template>
  <a-space style="margin-bottom: 24px">
    <a-button
      type="primary"
      @click="showEditDrawer()"
      v-if="supportOperations.create"
    >
      <template #icon>
        <PlusOutlined />
      </template>
      {{ $t('Add record') }}
    </a-button>
    <a-button type="primary" v-if="supportOperations.import">
      <template #icon>
        <UploadOutlined />
      </template>
      {{ $t('Import') }}
    </a-button>
    <a-button type="primary" v-if="supportOperations.export">
      <template #icon>
        <DownloadOutlined />
      </template>
      {{ $t('Export') }}
    </a-button>
    <a-popconfirm
      placement="right"
      :disabled="disableDelete"
      @confirm="deleteResource"
      v-if="supportOperations.delete"
    >
      <template #title>
        <p>{{ $t('Are you sure to delete?') }}</p>
      </template>
      <a-button danger :disabled="disableDelete">
        <template #icon>
          <DeleteOutlined />
        </template>
        {{ $t('Delete {n} record', { n: selectNumbers }) }}
      </a-button>
    </a-popconfirm>
  </a-space>
</template>

<script lang="ts">
import { computed, defineComponent, inject, Ref } from 'vue'
import {
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import { useMutation } from '@vue/apollo-composable'
import { message } from 'ant-design-vue'
import { ResourceItem } from '../types'
import { makeDeleteMutation, resourceRouteNames } from '../core'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  components: {
    DownloadOutlined,
    UploadOutlined,
    PlusOutlined,
    DeleteOutlined
  },

  setup() {
    const resource = inject('resource') as Ref<ResourceItem>
    const showEditDrawer = inject('showEditDrawer') as Function
    const selectedRowKeys = inject('selectedRowKeys') as Ref<any[]>
    const refetchList = inject('refetchList') as Function

    const mutation = computed(() => makeDeleteMutation(resource.value))
    const {
      mutate: deleteResource,
      loading,
      onDone,
      onError
    } = useMutation(mutation, () => ({
      variables: {
        ids: selectedRowKeys.value
      }
    }))

    const { t } = useI18n()

    onDone((res) => {
      refetchList()
      message.success(t('Success'))
    })

    onError((err) => {
      message.error(err.message)
    })

    const selectNumbers = computed(() => selectedRowKeys.value.length)
    const disableDelete = computed(
      () => selectNumbers.value === 0 || loading.value
    )

    const supportOperations = computed(() => {
      const routes = resourceRouteNames(resource.value)
      return {
        delete: !!routes?.delete,
        create: !!routes?.create,
        export: false,
        import: false
      }
    })

    return {
      resource,
      showEditDrawer,
      deleteResource,
      disableDelete,
      selectNumbers,
      supportOperations
    }
  }
})
</script>
