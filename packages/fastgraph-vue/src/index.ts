import { App } from 'vue'
import Entry from './components/Entry.vue'
import Resource from './components/Resource.vue'
import RefField from './components/fields/Ref.vue'
import EnumField from './components/fields/Enum.vue'
import UploadField from './components/fields/Upload.vue'
import RefSelect from './components/form/RefSelect.vue'
import EnumSelect from './components/form/EnumSelect.vue'
import BoolSelect from './components/form/BoolSelect.vue'
import DateTime from './components/form/DateTime.vue'
import UploadSelect from './components/form/UploadSelect.vue'

export * from './types'
import { LanguageMessages, registerJoiMessages } from './validation'
export { default as useTranslation } from './composables/translation'
export { getResourcePermissions, getRouteAwareConfig } from './utils'

export { Entry, Resource }

export default {
  install: (
    app: App<any>,
    options?: {
      joiMessages?: LanguageMessages
    }
  ) => {
    if (options?.joiMessages) {
      registerJoiMessages(options.joiMessages)
    }
    app.component('fg-resource', Resource)
    app.component('fg-ref', RefField)
    app.component('fg-enum', EnumField)
    app.component('fg-upload', UploadField)
    app.component('fg-ref-select', RefSelect)
    app.component('fg-enum-select', EnumSelect)
    app.component('fg-bool-select', BoolSelect)
    app.component('fg-datetime', DateTime)
    app.component('fg-upload-select', UploadSelect)
  }
}
