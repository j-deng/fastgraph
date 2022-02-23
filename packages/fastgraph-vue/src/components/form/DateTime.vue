<template>
  <a-date-picker
    v-model:value="dateValue"
    :showTime="showTime"
    :format="format"
    @change="handleChange"
  />
</template>

<script lang="ts">
import dayjs from 'dayjs'
import { computed, defineComponent, ref, watch } from 'vue'

export default defineComponent({
  props: {
    value: String,
    showTime: { type: Boolean, default: false }
  },

  setup(props, ctx) {
    const defaultValue = () => props.value && dayjs(props.value)
    const dateValue = ref(defaultValue())
    watch(props, () => (dateValue.value = defaultValue()))

    const format = computed(() =>
      props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
    )

    const handleChange = (val: any) => {
      ctx.emit('update:value', val?.format(format.value) || null)
    }

    return { dateValue, format, handleChange }
  }
})
</script>
