<template>
  <a-form
    name="advanced_search"
    class="ant-advanced-search-form"
    @submit="onSubmit"
    v-if="filterFields.length"
  >
    <a-row :gutter="24">
      <template v-for="(item, i) in filterFields" :key="item.field">
        <a-col v-show="expand || i < 2" :span="6">
          <a-form-item :name="item.field" :label="item.name">
            <component
              :is="item.component"
              v-bind="item.attrs"
              v-model:value="form[item.field]"
            />
          </a-form-item>
        </a-col>
      </template>
      <a-col :span="6" :style="{ paddingBottom: '24px' }">
        <a-button type="primary" html-type="submit">
          {{ $t('Search') }}
        </a-button>
        <a-button style="margin: 0 8px" @click="reset()">
          {{ $t('Clear') }}
        </a-button>
        <a
          v-if="filterFields.length > 2"
          style="font-size: 12px"
          @click="expand = !expand"
        >
          <template v-if="expand">
            <UpOutlined />
          </template>
          <template v-else>
            <DownOutlined />
          </template>
          {{ $t('Collapse') }}
        </a>
      </a-col>
    </a-row>
  </a-form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, Ref, ref, watch } from 'vue'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import { ResourceItem } from '../types'
import { fieldFilter, fieldForm } from '../field'
import { refFieldToSearchValue, searchValueToRefField } from '../utils'
import useTranslation from '../composables/translation'
import useRouteFilter from '../composables/routeFilter'

export default defineComponent({
  components: {
    DownOutlined,
    UpOutlined
  },

  setup() {
    const expand = ref(false)
    const resource = inject('resource') as Ref<ResourceItem>
    const { fieldName_t } = useTranslation()
    const { setFilters, filters } = useRouteFilter(resource)
    const defaultFilters = inject('defaultFilters') as Ref<any>

    const filterFields = computed(() =>
      resource.value.fields
        .filter(
          // do not show default filters
          (field) =>
            defaultFilters.value[field.field] === undefined &&
            fieldFilter(field)
        )
        .map((field) => {
          const { component, attrs } = fieldForm(field, true)
          return {
            name: fieldName_t(field),
            field: field.field,
            component,
            attrs
          }
        })
    )

    const emptyValues = () =>
      Object.fromEntries(
        filterFields.value.map((item) => [item.field, undefined])
      )

    const defaultValue = () => {
      return {
        ...emptyValues(),
        ...Object.fromEntries(
          Object.entries(filters.value).map(([key, val]) => {
            const field = resource.value.fields.find(
              (field) => field.field === key
            )
            return [key, searchValueToRefField(field, val)]
          })
        )
      }
    }

    const form = ref<any>(defaultValue())
    const reset = () => {
      setFilters({})
      form.value = emptyValues()
    }

    watch(resource, (after, before) => {
      if (before && after && after.key !== before.key) {
        form.value = emptyValues()
      }
    })

    const onSubmit = () => {
      const filters = Object.fromEntries(
        Object.entries(form.value)
          .filter(([key, val]) => val !== undefined && val !== '')
          .map(([key, val]) => {
            const field = resource.value.fields.find(
              (field) => field.field === key
            )
            return [key, refFieldToSearchValue(field, val)]
          })
      )
      setFilters(filters)
    }

    return {
      form,
      reset,
      expand,
      filterFields,
      onSubmit
    }
  }
})
</script>
