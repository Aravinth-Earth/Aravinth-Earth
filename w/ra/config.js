/**
 * Configuration for the Life On Earth art piece
 * @description Valid ranges and explanations for each setting
 */
const ART_CONFIG = {
    description: {
        title: "வாழ்வின் நடனம் | The Ephemeral Dance of Life",      // Any string
        concept: "பூமியின் வாழ்க்கை முறைகளின் ஒருங்கிணைந்த காட்சி | A generative art piece representing the interconnectedness of life"  // Any string
    },
    canvas: {
        maxShapes: 800,                   // Range: 50-1000; Maximum number of shapes to maintain
        size: { 
            min: 0.1,                         // Range: 0.1-5; Minimum shape size in pixels
            max: 8                          // Range: min+1 to 20; Maximum shape size in pixels
        },
        shape: {
            circleChance: 0,              // Range: 0-1; Probability of creating circles vs polygons
            polygon: {
                sides: { 
                    min: 8,                 // Range: 3-8; Minimum number of polygon sides
                    max: 12                  // Range: min+1 to 12; Maximum number of polygon sides
                }
            }
        }
    },
    lifecycle: {
        timing: {
            maxOutsideTime: 1500,           // Range: 500-5000; Maximum time (ms) shapes can exist outside viewport
            fadeOutDuration: 800            // Range: 100-2000; Duration (ms) of fade out animation
        },
        probability: 0.005,                  // Range: 0.001-0.1; Single probability for lifecycle changes
    },
    motion: {
        speed: { 
            min: 0.2,                       // Range: 0.1-1.0; Minimum movement speed
            max: 0.8                        // Range: min+0.1 to 2.0; Maximum movement speed
        },
        randomness: 0.2,                    // Range: 0-1; Amount of random movement added
        interaction: {
            radius: 50,                     // Range: 20-200; Radius in pixels for shape interactions
            strength: 0.05                  // Range: 0.01-0.2; Strength of shape interactions
        }
    },
    colors: {
        hue: { 
            min: 0,                         // Range: 0-360; Minimum hue value
            max: 360,                       // Range: min+30 to 360; Maximum hue value
            variation: 15                    // Range: 0-60; Random variation in hue
        },
        saturation: { 
            min: 30,                        // Range: 0-100; Minimum saturation percentage
            max: 100,                       // Range: min+10 to 100; Maximum saturation percentage
            gradient: 70                    // Range: min to max; Mid-point for gradients
        },
        lightness: { 
            min: 0,                        // Range: 0-100; Minimum lightness percentage
            max: 70,                        // Range: min+10 to 100; Maximum lightness percentage
            gradient: 50                    // Range: min to max; Mid-point for gradients
        },
        opacity: {
            min: 0.1,                       // Range: 0.1-1; Minimum opacity
            max: 0.8,                       // Range: min+0.1 to 1; Maximum opacity
            gradient: { 
                start: 0.8,                 // Range: min to max; Starting opacity for gradients
                end: 0                      // Range: 0 to start; Ending opacity for gradients
            }
        }
    }
};
