<template>
  <a-select
    v-model:value="selectValue"
    :filterOption="filterOption"
    :placeholder="$t('Please select')"
    @change="handleChange"
    allowClear
    showSearch
  >
    <a-select-option v-for="item in options" :key="item[0]" :value="item[0]">
      {{ item[1] }}
    </a-select-option>
  </a-select>
</template>

<script lang="ts">
import { computed, defineComponent, inject, Ref, ref, watch } from 'vue'
import useTranslation from '../../composables/translation'
import { ResourceEnums } from '../../types'

export default defineComponent({
  props: ['value', 'enumKey'],

  setup(props, ctx) {
    const enums = inject('ENUMS') as Ref<ResourceEnums>
    const { value_t } = useTranslation()
    const options = computed(() =>
      Object.entries(enums.value[props.enumKey] || {}).map(([key, value]) => [
        key,
        value_t(value as string)
      ])
    )

    const defaultValue = () => props.value
    const selectValue = ref(defaultValue())
    watch(props, () => (selectValue.value = defaultValue()))

    const handleChange = (val: any) => {
      ctx.emit('update:value', val)
    }

    const filterOption = (input: any, option: any) => {
      return (
        option.children[0].children
          .toLowerCase()
          .indexOf(input.toLowerCase()) >= 0 ||
        option.value.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    }

    return { selectValue, options, handleChange, filterOption }
  }
})
</script>
