import { ref, computed } from 'vue'
import { templates as defaultTemplates } from '@/constants/templates.js'
import { client } from '@/services/api.js' // We'll need to create this or use existing client access

const templates = ref({})
const isLoading = ref(false)
const error = ref(null)

export function useTemplates() {
    // Initialize with default templates
    if (Object.keys(templates.value).length === 0) {
        templates.value = { ...defaultTemplates }
    }

    const fetchTemplates = async () => {
        isLoading.value = true
        try {
            // Assuming client.service('Template').find() works like other services
            // We might need to adjust based on how the client is exposed
            const remoteTemplates = await client.service('Template').find()

            const merged = { ...defaultTemplates }
            remoteTemplates.forEach(t => {
                merged[t.name] = t.pixels
            })

            templates.value = merged
        } catch (e) {
            console.error('Failed to fetch templates:', e)
            error.value = e
        } finally {
            isLoading.value = false
        }
    }

    const createTemplate = async (name, pixels) => {
        try {
            const newTemplate = await client.service('Template').create(name, pixels)
            templates.value[newTemplate.name] = newTemplate.pixels
            return newTemplate
        } catch (e) {
            console.error('Failed to create template:', e)
            throw e
        }
    }

    return {
        templates: computed(() => templates.value),
        isLoading,
        error,
        fetchTemplates,
        createTemplate
    }
}
