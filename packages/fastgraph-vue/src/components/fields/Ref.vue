<template>
  <a-tag v-for="(item, index) of value" :key="index" :title="item">
    {{ item }}
  </a-tag>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['value', 'record', 'fieldKey']
})
</script>
