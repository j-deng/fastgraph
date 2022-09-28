<template>
  <a-select
    v-model:value="refValue"
    :mode="multiple ? 'multiple' : undefined"
    :filterOption="false"
    :not-found-content="loading ? undefined : null"
    @change="handleChange"
    @search="search"
    :placeholder="$t('Please select')"
    allowClear
    showSearch
  >
    <template v-if="loading" #notFoundContent>
      <a-spin size="small" />
    </template>
    <a-select-option v-for="i in options" :key="i.id">
      {{ i._label }}
    </a-select-option>
  </a-select>
</template>

<script lang="ts">
import debounce from 'lodash-es/debounce'
import uniqBy from 'lodash-es/uniqBy'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import {
  defineComponent,
  ref,
  inject,
  Ref,
  computed,
  watch,
  PropType
} from 'vue'
import {
  isNoneQuery,
  makeDetailQuery,
  makeListQuery,
  resourceRouteNames
} from '../../core'
import { ResourceItem, ResourceStore } from '../../types'

export default defineComponent({
  props: {
    value: {
      type: [Array, Object] as any,
      default: undefined
    },
    module: {
      type: String,
      required: true
    },
    refField: {
      type: String,
      required: true
    },
    multiple: {
      type: Boolean,
      default: false
    },
    take: {
      type: Number,
      default: 20
    },
    sortBy: {
      type: String
    },
    sortOrder: {
      type: String as PropType<'asc' | 'desc'>,
      default: 'asc'
    }
  },

  setup(props, ctx) {
    const schema = inject('SCHEMA') as Ref<ResourceStore>
    const refResource = computed<ResourceItem | undefined>(
      () => schema.value[props.module]
    )
    const query = computed(() => makeListQuery(refResource.value))
    const orderBy = computed(
      () => props.sortBy && { [props.sortBy]: props.sortOrder }
    )
    const filters = ref<any>({})
    const variables = computed(() => ({
      take: props.take,
      filter: filters.value,
      orderBy: orderBy.value
    }))
    const { result, loading, onResult } = useQuery(query, variables, () => ({
      enabled: !isNoneQuery(query.value),
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }))

    const hasFilters = computed(() => Object.keys(filters.value).length > 0)
    const routeNames = computed(
      () => refResource.value && resourceRouteNames(refResource.value)
    )

    const options = computed(() => {
      const resultKey = routeNames.value?.index as string
      if (!result.value || !result.value[resultKey]) {
        return []
      }
      const queryValues = result.value[resultKey].data
      const propsValues: any = props.value
        ? props.multiple
          ? props.value
          : [props.value]
        : []
      const allRecords =
        hasFilters.value || isFilterById()
          ? filterByIdResult.value.concat(queryValues).concat(propsValues)
          : filterByIdResult.value.concat(propsValues).concat(queryValues)

      return uniqBy(allRecords, 'id').map((item: any) => ({
        ...item,
        _label: item[props.refField]
      }))
    })

    // support vue route query with only ref id
    const { client } = useApolloClient()
    const filterByIdResult = ref<any[]>([])
    const isFilterById = () => {
      return (
        !props.multiple && props.value?.id && props.value?._label === undefined
      )
    }
    onResult(async () => {
      if (isFilterById() && !hasFilters.value) {
        if (!options.value.find((item: any) => item.id === props.value.id)) {
          const resultKey = routeNames.value?.detail
          // @todo fix the case query filter not in ref return list
          if (resultKey) {
            const queryDoc = makeDetailQuery(refResource.value)
            const result = await client.query({
              query: queryDoc,
              variables: { id: props.value.id }
            })
            filterByIdResult.value = [result.data[resultKey]]
            return
          }
        }
      }
      filterByIdResult.value = []
    })

    const defaultValue = () =>
      props.value
        ? props.multiple
          ? props.value.map((item: any) => item.id)
          : (props.value as any).id
        : []
    const refValue = ref(defaultValue())
    watch(props, () => {
      refValue.value = defaultValue()
      filters.value = {}
      filterByIdResult.value = []
    })

    const handleChange = (value: number[]) => {
      const result = options.value.filter((item: any) =>
        props.multiple ? -1 !== value.indexOf(item.id) : value === item.id
      )
      ctx.emit('update:value', props.multiple ? result : result[0])
    }

    const search = debounce((value: string) => {
      filters.value = value ? { [props.refField]: value } : {}
    }, 300)

    const filterOption = (input: any, option: any) => {
      return (
        option.children[0].children
          .toLowerCase()
          .indexOf(input.toLowerCase()) >= 0 ||
        option.value.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    }

    return {
      loading,
      options,
      handleChange,
      filterOption,
      refValue,
      search
    }
  }
})
</script>
