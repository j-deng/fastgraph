import { computed, Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ResourceItem } from '../types'
import { queryToRealType } from '../utils'

export interface PageSorterQuery {
  _page?: number
  _pageSize?: number
  _sorter?: string
}

export const PAGE_SIZE = 10

export default function useRouteFilter(resource: Ref<ResourceItem>) {
  const route = useRoute()
  const router = useRouter()

  const setFilters = (
    filters: Record<string, any>,
    replace: boolean = true
  ) => {
    const params = { path: route.path, query: filters }
    if (replace) {
      router.replace(params)
    } else {
      router.push(params)
    }
  }

  const addPageAndSorter = (values: PageSorterQuery) => {
    const filters = Object.fromEntries(
      Object.entries(route.query).filter(
        ([key, _]) => !['_page', '_pageSize', '_sorter'].includes(key)
      )
    )
    router.push({ path: route.path, query: { ...filters, ...values } })
  }

  const pageAndSorter = computed(() => {
    const page = parseInt((route.query._page as string) || '1')
    const pageSize = parseInt(
      (route.query._pageSize as string) || `${PAGE_SIZE}`
    )
    let sorter: any = undefined
    const [field, order] = ((route.query._sorter || '') as string).split('-')
    if (field && order) {
      sorter = { field, order }
    }
    return { page, pageSize, sorter: sorter }
  })

  const filters = computed(() => {
    return Object.fromEntries(
      Object.entries(route.query)
        .filter(([key, _]) => !key.startsWith('_'))
        .map(([key, value]: any) => {
          const field = resource.value.fields.find((item) => item.field === key)
          return [key, field && queryToRealType(field, value)]
        })
        .filter(([_, value]) => value !== undefined)
    )
  })

  return { route, filters, pageAndSorter, setFilters, addPageAndSorter }
}
