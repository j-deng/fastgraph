import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { resourceName } from '../core'
import { fieldName } from '../field'
import { ResourceField, ResourceItem } from '../types'

export default function useTranslation() {
  const { t } = useI18n()
  const scope = inject('fgTranslationScope', 'app')
  // @todo
  // const capitalizeFields = inject('capitalizeFields', false)

  const fieldName_t = (field: ResourceField | undefined) => {
    const name = fieldName(field)
    return t(`${scope}.${name}`, name, {
      missingWarn: false,
      fallbackWarn: false
    })
  }

  const resourceName_t = (resource: ResourceItem) => {
    const name = resourceName(resource)
    return t(`${scope}.${name}`, name, {
      missingWarn: false,
      fallbackWarn: false
    })
  }

  const value_t = (value: string) => {
    return t(`${scope}.${value}`, value, {
      missingWarn: false,
      fallbackWarn: false
    })
  }

  return { t, resourceName_t, fieldName_t, value_t }
}
