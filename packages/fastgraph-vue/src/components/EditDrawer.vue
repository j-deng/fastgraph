<template>
  <a-drawer
    :title="$t('Edit')"
    :width="720"
    :visible="visible"
    :body-style="{ paddingBottom: '80px' }"
    @close="close"
  >
    <a-form layout="vertical">
      <a-row :gutter="16" v-for="item in formItems" :key="item.field">
        <a-col :span="24">
          <a-form-item
            :label="item.name"
            :name="item.field"
            v-bind="validateInfos[item.field]"
          >
            <component
              v-if="item.component === 'a-switch'"
              :is="item.component"
              v-bind="item.attrs"
              v-model:checked="form[item.field]"
            />
            <component
              v-else
              :is="item.component"
              v-bind="item.attrs"
              v-model:value="form[item.field]"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
    <div
      style="
        position: absolute;
        right: 0;
        bottom: 0;
        width: 100%;
        border-top: 1px solid #e9e9e9;
        padding: 10px 16px;
        background: #fff;
        text-align: right;
        z-index: 1;
      "
    >
      <a-button style="margin-right: 8px" @click="close">
        {{ $t('Cancel') }}
      </a-button>
      <a-button type="primary" :loading="loading" @click="onSubmit">
        {{ $t('Submit') }}
      </a-button>
    </div>
  </a-drawer>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, inject } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { Form, message } from 'ant-design-vue'
import { buildValidationRules } from '../validation'
import { fieldForm, fieldUpload } from '../field'
import { ResourceItem } from '../types'
import {
  isFieldMutable,
  makeCreateMutation,
  makeDetailQuery,
  makeUpdateMutation,
  refFieldToInputType,
  resourceRouteNames
} from '../core'
import useTranslation from '../composables/translation'
import { useI18n } from 'vue-i18n'

const useForm = Form.useForm

interface FormItem {
  name: string
  field: string
  component: string
  attrs?: any
}

export default defineComponent({
  props: {
    visible: Boolean,
    recordId: [Number, String] as any,
    resource: {
      type: Object as PropType<ResourceItem>,
      required: true
    }
  },

  setup(props) {
    const record = ref<any>()
    const closeEditDrawer = inject('closeEditDrawer') as Function
    const refetchList = inject('refetchList') as Function
    const isCreate = computed(() => !props.recordId)
    const defaultValue = () =>
      Object.fromEntries(
        props.resource.fields.map((item) => [item.field, undefined])
      )
    const form = ref<any>(defaultValue())

    const query = computed(() => makeDetailQuery(props.resource))
    const variables = computed(() => ({ id: props.recordId }))
    const { onResult } = useQuery(query, variables, () => ({
      enabled: !!props.recordId && props.visible,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }))

    onResult((queryResult) => {
      const { data } = queryResult
      const resultKey = resourceRouteNames(props.resource)?.detail as string
      const value = data && data[resultKey]
      record.value = value
      form.value = value ? { ...value } : defaultValue()
    })

    const { t, locale } = useI18n()
    const { fieldName_t } = useTranslation()

    const formItems = computed<FormItem[]>(() =>
      props.resource.fields
        .filter((field) => isFieldMutable(field, isCreate.value))
        .map((field) => {
          return {
            name: fieldName_t(field),
            field: field.field,
            ...fieldForm(field)
          }
        })
    )

    const rulesRef = computed(() =>
      buildValidationRules(props.resource, locale.value, props.visible)
    )
    const { resetFields, validate, validateInfos } = useForm(form, rulesRef)

    const mutationVariables = computed(() =>
      Object.fromEntries(
        Object.entries(form.value)
          .map(([key, val]) => {
            const field = props.resource.fields.find(
              (field) => field.field === key
            )
            // undefined replace null value
            // val = val === null ? undefined : val
            // @todo
            // if upload is not File object(the old value), do not update
            if (fieldUpload(field) && val && !(val instanceof File)) {
              return []
            }
            return [key, refFieldToInputType(field, val, record.value)]
          })
          .filter(([key]) => key)
      )
    )
    const mutation = computed(() =>
      isCreate.value
        ? makeCreateMutation(props.resource)
        : makeUpdateMutation(
            props.resource,
            Object.keys(mutationVariables.value)
          )
    )
    const {
      mutate: createResource,
      loading,
      onDone,
      onError
    } = useMutation(mutation, () => ({
      variables: mutationVariables.value
    }))

    onDone((res) => {
      refetchList()
      message.success(t('Success'))
      setTimeout(close, 300)
    })

    onError((err) => {
      message.error(err.message)
    })

    const onSubmit = () => {
      validate()
        .then(() => createResource())
        .catch((err) => console.error(err))
    }

    const close = () => {
      closeEditDrawer()
      resetFields()
      setTimeout(() => {
        record.value = undefined
        form.value = defaultValue()
      }, 300)
    }

    return {
      form,
      formItems,
      close,
      onSubmit,
      validateInfos,
      loading
    }
  }
})
</script>
