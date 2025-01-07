const ART_CONFIG = {
    description: {
        title: "வாழ்வின் நடனம் | The Ephemeral Dance of Life",
        concept: "பூமியின் வாழ்க்கை முறைகளின் ஒருங்கிணைந்த காட்சி | A generative art piece representing the interconnectedness of life"
    },
    canvas: {
        shapeCount: 400,
        size: { min: 1, max: 6 },
        shape: {
            circleChance: 0.5,
            polygon: {
                sides: { min: 3, max: 6 }
            }
        }
    },
    lifecycle: {
        timing: {
            maxOutsideTime: 2000,
            fadeOutDuration: 1000
        },
        probability: {
            spawn: 0.4,
            disappear: 0.005
        },
        maxShapesPercent: 50
    },
    motion: {
        speed: { min: 0.2, max: 0.8 },
        randomness: 0.2,
        interaction: {
            radius: 50,
            strength: 0.05
        }
    },
    colors: {
        hue: { min: 0, max: 360, variation: 30 },
        saturation: { min: 50, max: 100, gradient: 70 },
        lightness: { min: 30, max: 70, gradient: 50 },
        opacity: {
            min: 0.3,
            max: 0.8,
            gradient: { start: 0.8, end: 0 }
        }
    }
};
