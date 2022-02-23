<template>
  <template v-if="operations.length">
    <a @click="operations[0].callback(record)">
      {{ operations[0].name }}
    </a>
    <a-divider type="vertical" v-if="operations.length > 1" />
    <a @click="operations[1].callback(record)" v-if="operations.length === 2">
      {{ operations[1].name }}
    </a>
    <a-dropdown v-if="operations.length > 2">
      <a class="ant-dropdown-link" @click.prevent>
        {{ $t('More') }}
        <DownOutlined />
      </a>
      <template #overlay>
        <a-menu>
          <a-menu-item
            v-for="action in operations.slice(1)"
            :key="action.name"
            :danger="action.danger"
            @click="action.popconfirm ? () => {} : action.callback(record)"
          >
            <template v-if="action.popconfirm">
              <a-popconfirm
                :title="action.popconfirm"
                @confirm="action.callback(record)"
              >
                {{ action.name }}
              </a-popconfirm>
            </template>
            <template v-else>
              {{ action.name }}
            </template>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </template>
</template>

<script lang="ts">
import { DownOutlined } from '@ant-design/icons-vue'
import { defineComponent, PropType } from 'vue'
import { RecordOperationItem } from '../types'

export default defineComponent({
  props: {
    record: {
      type: Object,
      required: true
    },
    operations: {
      type: Array as PropType<RecordOperationItem[]>,
      required: true
    }
  },

  components: {
    DownOutlined
  }
})
</script>
