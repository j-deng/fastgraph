<template>
  <a-upload
    v-model:file-list="fileList"
    name="file"
    :before-upload="beforeUpload"
    @remove="handleRemove"
    @change="handleChange"
  >
    <a-button>
      <upload-outlined></upload-outlined>
      {{ $t('Select File') }}
    </a-button>
  </a-upload>
</template>

<script lang="ts">
import type { UploadProps, UploadChangeParam } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { defineComponent, ref, watch } from 'vue'
import { UploadFile } from 'ant-design-vue/lib/upload/interface'

export default defineComponent({
  props: ['value'],

  components: {
    UploadOutlined
  },

  setup(props, ctx) {
    const defaultValue = () => {
      if (!props.value) {
        return []
      }
      if ('uid' in props.value) {
        return [props.value]
      }
      return [{ uid: '-1', ...props.value }]
    }

    const fileList = ref<UploadFile[] | any[]>(defaultValue())
    watch(props, () => (fileList.value = defaultValue()))

    const beforeUpload: UploadProps['beforeUpload'] = (file) => {
      fileList.value = [file]
      return false
    }

    const handleRemove: UploadProps['onRemove'] = () => {
      fileList.value = []
      ctx.emit('update:value', null)
    }

    const handleChange = (info: UploadChangeParam) => {
      if (fileList.value[0] && 'originFileObj' in fileList.value[0]) {
        ctx.emit('update:value', fileList.value[0].originFileObj)
      }
    }

    return {
      fileList,
      beforeUpload,
      handleRemove,
      handleChange
    }
  }
})
</script>
