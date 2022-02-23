<template>
  <Resource :resourceKey="resourceKey" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import Resource from './Resource.vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  components: { Resource },

  setup() {
    const route = useRoute()
    const resourceKey = computed(() => route.params.key as string)
    return { resourceKey }
  }
})
</script>
