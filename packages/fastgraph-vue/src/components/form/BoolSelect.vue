<template>
  <a-select v-model:value="selectValue" @change="handleChange" allowClear>
    <a-select-option :value="1"> {{ $t('Yes') }} </a-select-option>
    <a-select-option :value="0"> {{ $t('No') }} </a-select-option>
  </a-select>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  props: {
    value: Boolean,
    enumKey: String
  },

  setup(props, ctx) {
    const defaultValue = () =>
      props.value !== undefined ? (props.value ? 1 : 0) : undefined
    const selectValue = ref(defaultValue())
    watch(props, () => (selectValue.value = defaultValue()))

    const handleChange = (val: any) => {
      ctx.emit('update:value', val === undefined ? undefined : Boolean(val))
    }

    return { selectValue, handleChange }
  }
})
</script>
