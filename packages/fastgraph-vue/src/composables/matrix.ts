import { Ref, computed } from 'vue'
import { isSortableField, columnWidth, columnEllipsis } from '../field'
import { ResourceItem } from '../types'
import useTranslation from './translation'

export default function useMatrix(
  resource: Ref<ResourceItem>,
  result: Ref<any>
) {
  const matrix = computed(() => resource.value.decorators.matrix?.keywords)
  const matrixRows = computed(() => [
    ...new Set(
      result.value
        .map((item: any) => item[matrix.value?.row])
        .filter((item: any) => item)
    )
  ])
  const matrixCols = computed(() => [
    ...new Set(
      result.value
        .map((item: any) => item[matrix.value?.col])
        .filter((item: any) => item)
    )
  ])

  const matrixDimensions = computed(
    () => matrix.value && [matrix.value?.row, ...matrixCols.value]
  )

  const matrixData = computed(() => {
    if (matrix.value) {
      const { row, col, val } = matrix.value
      return matrixRows.value.map((r) =>
        Object.assign(
          { [row]: r },
          ...result.value
            .filter((item: any) => item[row] === r)
            .map((item: any) => ({ [item[col]]: item[val] }))
        )
      )
    }
  })

  const { fieldName_t } = useTranslation()

  const matrixColumns = computed(() => {
    if (matrix.value) {
      const field = resource.value.fields.find(
        (item) => item.field === matrix.value?.row
      )
      return [
        {
          key: field?.field,
          dataIndex: field?.field,
          title: fieldName_t(field),
          sorter: isSortableField(field),
          width: columnWidth(field),
          ellipsis: columnEllipsis(field)
        },
        ...matrixCols.value.map((k) => ({
          key: k,
          dataIndex: k,
          title: k,
          width: columnWidth(undefined)
        }))
      ]
    }
  })

  return {
    matrix,
    matrixRows,
    matrixCols,
    matrixDimensions,
    matrixData,
    matrixColumns
  }
}
