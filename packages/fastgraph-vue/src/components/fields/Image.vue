<template>
  <template v-if="value">
    <a-avatar
      :src="value"
      shape="square"
      :size="48"
      @click="() => setVisible(true)"
    />
    <a-image
      :style="{ display: 'none' }"
      :preview="{
        visible,
        onVisibleChange: setVisible
      }"
      :src="value"
    />
  </template>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: ['value'],

  setup() {
    const visible = ref<boolean>(false)
    const setVisible = (value: boolean): void => {
      visible.value = value
    }
    return {
      visible,
      setVisible
    }
  }
})
</script>
