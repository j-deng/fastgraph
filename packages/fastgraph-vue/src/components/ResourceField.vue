<template>
  <span v-if="result.component === 'span'">{{ result.value }}</span>
  <component v-else :is="result.component" v-bind="result.attrs" />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { fieldPresent, findField } from '../field'
import { ResourceItem } from '../types'

export default defineComponent({
  props: {
    resource: {
      type: Object as PropType<ResourceItem>,
      required: true
    },
    fieldKey: {
      type: String,
      required: true
    },
    record: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const result = computed(() => {
      const { resource, fieldKey, record } = props
      const field = findField(resource, fieldKey)
      return fieldPresent(field, record)
    })

    return { result }
  }
})
</script>
