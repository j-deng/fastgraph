<template>
  {{ enumValue }}
</template>

<script lang="ts">
import { defineComponent, inject, Ref, ref, watch } from 'vue'
import { ResourceEnums } from '../../types'

export default defineComponent({
  props: ['value', 'enumKey'],

  setup(props) {
    const enums = inject('ENUMS') as Ref<ResourceEnums>
    const defaultValue = () =>
      (enums.value[props.enumKey] && enums.value[props.enumKey][props.value]) ||
      props.value
    const enumValue = ref(defaultValue())
    watch(props, () => (enumValue.value = defaultValue()))

    return { enumValue }
  }
})
</script>
