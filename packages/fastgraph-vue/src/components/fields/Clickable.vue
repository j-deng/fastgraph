<template>
  <a-tooltip v-if="title" placement="top">
    <template #title>
      <span>{{ title }}</span>
    </template>
    <a href="#" @click.prevent="onClick">{{ value }}</a>
  </a-tooltip>
  <a v-else href="#" @click.prevent="onClick">{{ value }}</a>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'

export default defineComponent({
  props: ['value', 'record', 'fieldKey', 'title'],

  setup(props) {
    const onFieldClicked = inject('onFieldClicked') as Function

    const onClick = () => {
      onFieldClicked(props.record, props.fieldKey)
    }

    return { onClick }
  }
})
</script>
