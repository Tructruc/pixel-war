import { ref, computed } from 'vue'

// Application states
export const AppState = {
    IDLE: 'IDLE',
    SELECTING: 'SELECTING',
    DRAWING: 'DRAWING',
    PALETTE_OPEN: 'PALETTE_OPEN'
}

// Singleton state (shared across all component instances)
let stateInstance = null

export function useAppState() {
    if (!stateInstance) {
        // Core state
        const currentState = ref(AppState.IDLE)
        const currentColor = ref(1)
        const currentTemplate = ref('Pixel')
        const rotation = ref(0)
        const drawingQueue = ref([])
        const nextPlaceTime = ref(0)
        const openPalette = ref(null) // 'shape', 'color', or null

        // Computed properties
        const canSelect = computed(() =>
            currentState.value === AppState.SELECTING && openPalette.value === null
        )

        const isDrawing = computed(() =>
            currentState.value === AppState.DRAWING
        )

        const isIdle = computed(() =>
            currentState.value === AppState.IDLE
        )

        const isPaletteOpen = computed(() =>
            currentState.value === AppState.PALETTE_OPEN || openPalette.value !== null
        )

        const canRotate = computed(() =>
            !isPaletteOpen.value
        )

        const queueLength = computed(() => drawingQueue.value.length)

        const drawingProgress = computed(() => {
            if (!isDrawing.value || queueLength.value === 0) return null
            // We don't track total, so just show queue length
            return queueLength.value
        })

        // State transition methods
        function enableSelection() {
            // Only enable if no palette is open and not currently drawing
            if (openPalette.value === null && currentState.value !== AppState.DRAWING) {
                currentState.value = AppState.SELECTING
            }
        }

        function forceEnableSelection() {
            // Force enable selection regardless of current state (used by timer)
            if (openPalette.value === null) {
                currentState.value = AppState.SELECTING
            }
        }

        function startDrawing() {
            currentState.value = AppState.DRAWING
        }

        function finishDrawing() {
            if (drawingQueue.value.length === 0) {
                // Check if timer has already expired
                if (nextPlaceTime.value <= Date.now() && openPalette.value === null) {
                    currentState.value = AppState.SELECTING
                } else {
                    currentState.value = AppState.IDLE
                }
            }
        }

        function openShapePalette() {
            openPalette.value = 'shape'
            currentState.value = AppState.PALETTE_OPEN
        }

        function openColorPalette() {
            openPalette.value = 'color'
            currentState.value = AppState.PALETTE_OPEN
        }

        function closePalette() {
            openPalette.value = null
            // Return to previous state based on queue and timer
            if (drawingQueue.value.length > 0) {
                currentState.value = AppState.DRAWING
            } else if (Date.now() >= nextPlaceTime.value) {
                currentState.value = AppState.SELECTING
            } else {
                currentState.value = AppState.IDLE
            }
        }

        function setColor(color) {
            currentColor.value = color
        }

        function setTemplate(template) {
            currentTemplate.value = template
        }

        function rotateShape() {
            rotation.value = (rotation.value + 1) % 4
        }

        function addToQueue(pixels) {
            drawingQueue.value.push(...pixels)
        }

        function dequeue() {
            return drawingQueue.value.shift()
        }

        function clearQueue() {
            drawingQueue.value = []
        }

        function cancelDrawing() {
            clearQueue()
            // Force transition to IDLE, then check if we should enable selection
            currentState.value = AppState.IDLE
            if (nextPlaceTime.value <= Date.now() && openPalette.value === null) {
                currentState.value = AppState.SELECTING
            }
        }

        function setNextPlaceTime(time) {
            nextPlaceTime.value = time
            // Check if we should transition to SELECTING
            if (time <= Date.now() && currentState.value === AppState.IDLE && openPalette.value === null) {
                currentState.value = AppState.SELECTING
            }
        }

        stateInstance = {
            // State
            currentState,
            currentColor,
            currentTemplate,
            rotation,
            drawingQueue,
            nextPlaceTime,
            openPalette,

            // Computed
            canSelect,
            isDrawing,
            isIdle,
            isPaletteOpen,
            canRotate,
            queueLength,
            drawingProgress,

            // Methods
            enableSelection,
            forceEnableSelection,
            startDrawing,
            finishDrawing,
            openShapePalette,
            openColorPalette,
            closePalette,
            setColor,
            setTemplate,
            rotateShape,
            addToQueue,
            dequeue,
            clearQueue,
            cancelDrawing,
            setNextPlaceTime,
            AppState
        }
    }

    return stateInstance
}
