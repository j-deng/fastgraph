<template>
  <a
    @click="
      () => {
        if (newTab) {
          open(realUrl)
        } else {
          $router.push(realUrl)
        }
      }
    "
  >
    {{ realValue }}
  </a>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

/***
 * Replace dynamic params to record values
 * @param record
 * @param text string like `/resource/User?username={user.username}`
 */
function injectRecordValues(record: any, text: string) {
  return [...text.matchAll(/\{([\w.]+)\}/g)].reduce((acc, match) => {
    const val = match[1].split('.').reduce((val, key) => val[key] || '', record)
    return acc.replace(match[0], val)
  }, text)
}

export default defineComponent({
  props: ['value', 'record', 'fieldKey', 'url', 'text'],

  setup(props) {
    const realUrl = computed<string>(() => {
      if (!props.url) return props.value
      return injectRecordValues(props.record, props.url)
    })

    const realValue = computed<string>(() => {
      if (!props.text) return props.value
      return injectRecordValues(props.record, props.text)
    })

    const newTab = computed(() => realUrl.value.startsWith('http'))

    return {
      realUrl,
      realValue,
      newTab,
      open: (link: string) => window.open(link)
    }
  }
})
</script>
