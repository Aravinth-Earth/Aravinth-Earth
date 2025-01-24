import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Replace unload with visibilitychange event
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            game.cleanup();
        }
    });
});
