import { useMutation } from '@vue/apollo-composable'
import { message } from 'ant-design-vue'
import { Ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { makeDeleteMutation, resourceRouteNames } from '../core'
import { RecordOperationItem, ResourceItem } from '../types'

export default function useRecordOperation(
  resource: Ref<ResourceItem>,
  refetch: Function,
  showEditDrawer: Function,
  showViewDrawer: Function,
  extRecordOperations: Ref<RecordOperationItem[] | undefined>
) {
  const mutation = computed(() => makeDeleteMutation(resource.value))
  const { mutate: deleteResource, onDone, onError } = useMutation(mutation)

  onDone((res) => {
    message.success(t('Success'))
    refetch()
  })

  onError((err) => {
    message.error(err.message)
  })

  const { t } = useI18n()

  const recordOperations = computed<RecordOperationItem[]>(() => {
    const routes = resourceRouteNames(resource.value)
    let actions: RecordOperationItem[] = []
    if (routes?.detail && routes?.update) {
      actions.push({
        name: t('Edit'),
        callback: (record) => showEditDrawer(record)
      })
    }
    if (routes?.detail) {
      actions.push({
        name: t('View'),
        callback: (record) => showViewDrawer(record)
      })
    }
    if (extRecordOperations.value) {
      actions = actions.concat(extRecordOperations.value)
    }
    // Delete put to last
    if (routes?.delete) {
      actions.push({
        name: t('Delete'),
        popconfirm: t('Are you sure to delete?'),
        callback: (record) => deleteResource({ ids: [record.id] }),
        danger: true
      })
    }
    return actions
  })

  return { recordOperations }
}
