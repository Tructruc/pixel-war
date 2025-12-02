import { ref, computed } from 'vue'
import { templates as defaultTemplates } from '@/constants/templates.js'
import { client } from '@/services/api.js'

const templates = ref({})
const templateOwners = ref({})
const isLoading = ref(false)
const error = ref(null)
let listenersSetup = false

export function useTemplates() {
    if (Object.keys(templates.value).length === 0) {
        templates.value = { ...defaultTemplates }
    }

    if (!listenersSetup) {
        listenersSetup = true

        client.service('Template').on('create', (template) => {
            templates.value[template.name] = template.pixels
            templateOwners.value[template.name] = template.creatorId
        })

        client.service('Template').on('remove', (result) => {
            const name = result.name
            if (name) {
                delete templates.value[name]
                delete templateOwners.value[name]
            }
        })
    }

    const fetchTemplates = async () => {
        isLoading.value = true
        try {
            const remoteTemplates = await client.service('Template').find()

            const merged = { ...defaultTemplates }
            remoteTemplates.forEach(t => {
                merged[t.name] = t.pixels
                templateOwners.value[t.name] = t.creatorId
            })

            templates.value = merged
        } catch (e) {
            console.error('Failed to fetch templates:', e)
            error.value = e
        } finally {
            isLoading.value = false
        }
    }

    const createTemplate = async (userId, name, pixels) => {
        try {
            const newTemplate = await client.service('Template').create(userId, name, pixels)
            templates.value[newTemplate.name] = newTemplate.pixels
            templateOwners.value[newTemplate.name] = newTemplate.creatorId
            return newTemplate
        } catch (e) {
            console.error('Failed to create template:', e)
            throw e
        }
    }

    const deleteTemplate = async (userId, name) => {
        try {
            await client.service('Template').remove(userId, name)
            delete templates.value[name]
            delete templateOwners.value[name]
        } catch (e) {
            console.error('Failed to delete template:', e)
            throw e
        }
    }

    return {
        templates: computed(() => templates.value),
        templateOwners: computed(() => templateOwners.value),
        isLoading,
        error,
        fetchTemplates,
        createTemplate,
        deleteTemplate
    }
}
