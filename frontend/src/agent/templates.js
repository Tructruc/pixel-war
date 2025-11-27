// Pixel Art Templates
// Mapped to project colors:
// 0:Beige, 2:Red, 4:Green, 6:Cyan, 7:Blue, 12:Orange, 13:White, 14:Purple, 15:Black

import importedTemplate from './imported_template.json';

export const templates = {
    mushroom: {
        width: 8,
        height: 8,
        pixels: [
            // Cap (Red)
            { x: 2, y: 0, color: 2 }, { x: 3, y: 0, color: 2 }, { x: 4, y: 0, color: 2 }, { x: 5, y: 0, color: 2 },
            { x: 1, y: 1, color: 2 }, { x: 2, y: 1, color: 2 }, { x: 3, y: 1, color: 2 }, { x: 4, y: 1, color: 2 }, { x: 5, y: 1, color: 2 }, { x: 6, y: 1, color: 2 },
            { x: 0, y: 2, color: 2 }, { x: 1, y: 2, color: 2 }, { x: 2, y: 2, color: 13 }, { x: 3, y: 2, color: 13 }, { x: 4, y: 2, color: 2 }, { x: 5, y: 2, color: 13 }, { x: 6, y: 2, color: 13 }, { x: 7, y: 2, color: 2 },
            { x: 0, y: 3, color: 2 }, { x: 1, y: 3, color: 13 }, { x: 2, y: 3, color: 13 }, { x: 3, y: 3, color: 13 }, { x: 4, y: 3, color: 2 }, { x: 5, y: 3, color: 13 }, { x: 6, y: 3, color: 13 }, { x: 7, y: 3, color: 13 },
            { x: 0, y: 4, color: 2 }, { x: 1, y: 4, color: 2 }, { x: 2, y: 4, color: 2 }, { x: 3, y: 4, color: 2 }, { x: 4, y: 4, color: 2 }, { x: 5, y: 4, color: 2 }, { x: 6, y: 4, color: 2 }, { x: 7, y: 4, color: 2 },
            // Stem (Beige/Skin)
            { x: 2, y: 5, color: 0 }, { x: 3, y: 5, color: 0 }, { x: 4, y: 5, color: 0 }, { x: 5, y: 5, color: 0 },
            { x: 2, y: 6, color: 0 }, { x: 3, y: 6, color: 0 }, { x: 4, y: 6, color: 0 }, { x: 5, y: 6, color: 0 },
            { x: 2, y: 7, color: 0 }, { x: 3, y: 7, color: 0 }, { x: 4, y: 7, color: 0 }, { x: 5, y: 7, color: 0 }
        ]
    },
    invader: {
        width: 11,
        height: 8,
        pixels: [
            // Purple Invader
            { x: 2, y: 0, color: 14 }, { x: 8, y: 0, color: 14 },
            { x: 3, y: 1, color: 14 }, { x: 7, y: 1, color: 14 },
            { x: 2, y: 2, color: 14 }, { x: 3, y: 2, color: 14 }, { x: 4, y: 2, color: 14 }, { x: 5, y: 2, color: 14 }, { x: 6, y: 2, color: 14 }, { x: 7, y: 2, color: 14 }, { x: 8, y: 2, color: 14 },
            { x: 1, y: 3, color: 14 }, { x: 2, y: 3, color: 14 }, { x: 4, y: 3, color: 14 }, { x: 5, y: 3, color: 14 }, { x: 6, y: 3, color: 14 }, { x: 8, y: 3, color: 14 }, { x: 9, y: 3, color: 14 },
            { x: 0, y: 4, color: 14 }, { x: 1, y: 4, color: 14 }, { x: 2, y: 4, color: 14 }, { x: 3, y: 4, color: 14 }, { x: 4, y: 4, color: 14 }, { x: 5, y: 4, color: 14 }, { x: 6, y: 4, color: 14 }, { x: 7, y: 4, color: 14 }, { x: 8, y: 4, color: 14 }, { x: 9, y: 4, color: 14 }, { x: 10, y: 4, color: 14 },
            { x: 0, y: 5, color: 14 }, { x: 2, y: 5, color: 14 }, { x: 3, y: 5, color: 14 }, { x: 4, y: 5, color: 14 }, { x: 5, y: 5, color: 14 }, { x: 6, y: 5, color: 14 }, { x: 7, y: 5, color: 14 }, { x: 8, y: 5, color: 14 }, { x: 10, y: 5, color: 14 },
            { x: 0, y: 6, color: 14 }, { x: 2, y: 6, color: 14 }, { x: 8, y: 6, color: 14 }, { x: 10, y: 6, color: 14 },
            { x: 3, y: 7, color: 14 }, { x: 4, y: 7, color: 14 }, { x: 6, y: 7, color: 14 }, { x: 7, y: 7, color: 14 }
        ]
    },
    ghost: {
        width: 8,
        height: 8,
        pixels: [
            // Red Ghost (Blinky)
            { x: 2, y: 0, color: 2 }, { x: 3, y: 0, color: 2 }, { x: 4, y: 0, color: 2 }, { x: 5, y: 0, color: 2 },
            { x: 1, y: 1, color: 2 }, { x: 2, y: 1, color: 2 }, { x: 3, y: 1, color: 2 }, { x: 4, y: 1, color: 2 }, { x: 5, y: 1, color: 2 }, { x: 6, y: 1, color: 2 },
            { x: 0, y: 2, color: 2 }, { x: 1, y: 2, color: 2 }, { x: 2, y: 2, color: 13 }, { x: 3, y: 2, color: 13 }, { x: 4, y: 2, color: 2 }, { x: 5, y: 2, color: 13 }, { x: 6, y: 2, color: 13 }, { x: 7, y: 2, color: 2 },
            { x: 0, y: 3, color: 2 }, { x: 1, y: 3, color: 2 }, { x: 2, y: 3, color: 13 }, { x: 3, y: 3, color: 7 }, { x: 4, y: 3, color: 2 }, { x: 5, y: 3, color: 13 }, { x: 6, y: 3, color: 7 }, { x: 7, y: 3, color: 2 }, // Blue pupils
            { x: 0, y: 4, color: 2 }, { x: 1, y: 4, color: 2 }, { x: 2, y: 4, color: 2 }, { x: 3, y: 4, color: 2 }, { x: 4, y: 4, color: 2 }, { x: 5, y: 4, color: 2 }, { x: 6, y: 4, color: 2 }, { x: 7, y: 4, color: 2 },
            { x: 0, y: 5, color: 2 }, { x: 1, y: 5, color: 2 }, { x: 2, y: 5, color: 2 }, { x: 3, y: 5, color: 2 }, { x: 4, y: 5, color: 2 }, { x: 5, y: 5, color: 2 }, { x: 6, y: 5, color: 2 }, { x: 7, y: 5, color: 2 },
            { x: 0, y: 6, color: 2 }, { x: 1, y: 6, color: 2 }, { x: 2, y: 6, color: 2 }, { x: 3, y: 6, color: 2 }, { x: 4, y: 6, color: 2 }, { x: 5, y: 6, color: 2 }, { x: 6, y: 6, color: 2 }, { x: 7, y: 6, color: 2 },
            { x: 0, y: 7, color: 2 }, { x: 2, y: 7, color: 2 }, { x: 5, y: 7, color: 2 }, { x: 7, y: 7, color: 2 } // Legs
        ]
    },
    pokeball: {
        width: 8,
        height: 8,
        pixels: [
            { x: 2, y: 0, color: 15 }, { x: 3, y: 0, color: 15 }, { x: 4, y: 0, color: 15 }, { x: 5, y: 0, color: 15 },
            { x: 1, y: 1, color: 15 }, { x: 2, y: 1, color: 2 }, { x: 3, y: 1, color: 2 }, { x: 4, y: 1, color: 2 }, { x: 5, y: 1, color: 2 }, { x: 6, y: 1, color: 15 },
            { x: 0, y: 2, color: 15 }, { x: 1, y: 2, color: 2 }, { x: 2, y: 2, color: 2 }, { x: 3, y: 2, color: 2 }, { x: 4, y: 2, color: 2 }, { x: 5, y: 2, color: 2 }, { x: 6, y: 2, color: 2 }, { x: 7, y: 2, color: 15 },
            { x: 0, y: 3, color: 15 }, { x: 1, y: 3, color: 2 }, { x: 2, y: 3, color: 2 }, { x: 3, y: 3, color: 15 }, { x: 4, y: 3, color: 15 }, { x: 5, y: 3, color: 2 }, { x: 6, y: 3, color: 2 }, { x: 7, y: 3, color: 15 },
            { x: 0, y: 4, color: 15 }, { x: 1, y: 4, color: 13 }, { x: 2, y: 4, color: 13 }, { x: 3, y: 4, color: 15 }, { x: 4, y: 4, color: 15 }, { x: 5, y: 4, color: 13 }, { x: 6, y: 4, color: 13 }, { x: 7, y: 4, color: 15 },
            { x: 0, y: 5, color: 15 }, { x: 1, y: 5, color: 13 }, { x: 2, y: 5, color: 13 }, { x: 3, y: 5, color: 13 }, { x: 4, y: 5, color: 13 }, { x: 5, y: 5, color: 13 }, { x: 6, y: 5, color: 13 }, { x: 7, y: 5, color: 15 },
            { x: 1, y: 6, color: 15 }, { x: 2, y: 6, color: 13 }, { x: 3, y: 6, color: 13 }, { x: 4, y: 6, color: 13 }, { x: 5, y: 6, color: 13 }, { x: 6, y: 6, color: 15 },
            { x: 2, y: 7, color: 15 }, { x: 3, y: 7, color: 15 }, { x: 4, y: 7, color: 15 }, { x: 5, y: 7, color: 15 }
        ]
    },
    "n7 logo": importedTemplate
};

export const labels = Object.keys(templates);
