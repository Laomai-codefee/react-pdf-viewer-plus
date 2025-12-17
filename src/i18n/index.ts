import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locale/zh-CN'
import enUS from './locale/en-US'

const namespaces = ['common', 'viewer', 'annotator']

i18n.use(initReactI18next).init({
    resources: {
        'zh-CN': zhCN,
        'en-US': enUS
    },
    lng: 'zh-CN',
    fallbackLng: 'en-US',
    ns: namespaces,
    defaultNS: 'common',
    interpolation: { escapeValue: false }
})

export default i18n
