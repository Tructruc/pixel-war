import { reactive, ref } from 'vue';

// Singleton state to share camera across components (Canvas & Minimap)
const cam = reactive({
    zoom: 30,
    maxZoom: 200,
    minZoom: 1,
    viewX: 0,
    viewY: 0,
});

// Constants
const x_size = 1024;
const y_size = 1024;

export function useCamera() {

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    function zoomAt(mouseX, mouseY, factor, canvasWidth, canvasHeight) {
        const oldZoom = cam.zoom;
        const newZoom = clamp(oldZoom * factor, cam.minZoom, cam.maxZoom);
        if (newZoom === oldZoom) return false;

        const newX = cam.viewX - mouseX / newZoom + mouseX / oldZoom;
        const newY = cam.viewY - mouseY / newZoom + mouseY / oldZoom;

        // Calculate max view bounds
        const maxViewX = Math.max(0, x_size - canvasWidth / newZoom);
        const maxViewY = Math.max(0, y_size - canvasHeight / newZoom);

        // Clamp the view position to valid bounds
        cam.viewX = clamp(newX, 0, maxViewX);
        cam.viewY = clamp(newY, 0, maxViewY);
        cam.zoom = newZoom;

        return true; // indicated that a redraw is needed
    }

    function pan(dx, dy, canvasWidth, canvasHeight) {
        const rawViewX = cam.viewX - dx / cam.zoom;
        const rawViewY = cam.viewY - dy / cam.zoom;

        // Calculate max view bounds
        const maxViewX = Math.max(0, x_size - canvasWidth / cam.zoom);
        const maxViewY = Math.max(0, y_size - canvasHeight / cam.zoom);

        const newViewX = clamp(rawViewX, 0, maxViewX);
        const newViewY = clamp(rawViewY, 0, maxViewY);

        if (newViewX === cam.viewX && newViewY === cam.viewY) return false;

        cam.viewX = newViewX;
        cam.viewY = newViewY;

        return true;
    }

    function setView(x, y, canvasWidth, canvasHeight) {
        // Calculate max view bounds
        const maxViewX = Math.max(0, x_size - canvasWidth / cam.zoom);
        const maxViewY = Math.max(0, y_size - canvasHeight / cam.zoom);

        cam.viewX = clamp(x, 0, maxViewX);
        cam.viewY = clamp(y, 0, maxViewY);
    }

    return {
        cam,
        zoomAt,
        pan,
        setView,
        clamp
    };
}
