<template>
  <template v-if="url">
    <a-button v-if="!image" type="link" :href="url" target="_blank">
      <template #icon>
        <DownloadOutlined />
      </template>
      {{ $t('Download') }}
    </a-button>
    <span v-else>
      <a-avatar
        :src="url"
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
        :src="url"
      />
    </span>
  </template>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { DownloadOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  props: ['value', 'record', 'image', 'url'],

  components: {
    DownloadOutlined
  },

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
