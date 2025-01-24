export class Controls {
    constructor(game) {
        this.game = game;
        this.lastEscapeTime = 0;
        
        // Set up references to current controls
        this.setupControlReferences();
        this.setupEventListeners();
        this.setupEscapeKey();
    }

    setupControlReferences() {
        // Update references to use config layer controls
        const configLayer = document.querySelector('.config-layer');
        if (!configLayer) return;

        this.bulletCount = configLayer.querySelector('#bulletCount');
        this.balloonSpeed = configLayer.querySelector('#balloonSpeed');
        this.bulletSpeed = configLayer.querySelector('#bulletSpeed');
        this.balloonSize = configLayer.querySelector('#balloonSize');
        this.maxBalloonsRange = configLayer.querySelector('#maxBalloonsRange');
        this.maxBalloons = configLayer.querySelector('#maxBalloons');

        // Add immediate update listeners for all controls
        [this.bulletCount, this.balloonSpeed, this.bulletSpeed, this.balloonSize].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.game.applyUpdatedSettings(); // This will now save settings too
                });
            }
        });

        // Set up range sync with immediate updates
        if (this.maxBalloonsRange && this.maxBalloons) {
            this.maxBalloonsRange.addEventListener('input', () => {
                this.maxBalloons.value = this.maxBalloonsRange.value;
                this.game.applyUpdatedSettings(); // This will now save settings too
            });
            
            this.maxBalloons.addEventListener('input', () => {
                this.maxBalloonsRange.value = this.maxBalloons.value;
                this.game.applyUpdatedSettings(); // This will now save settings too
            });
        }
    }

    setupEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (Date.now() - this.lastEscapeTime < 300) return;
                this.lastEscapeTime = Date.now();
                
                // Handle ESC based on current layer
                switch (this.game.currentLayer) {
                    case 3: // Config layer
                        if (this.game.gameStarted) {
                            // If game is running, go back to menu
                            this.game.switchToLayer(2);
                        }
                        break;
                    case 2: // Menu layer
                        if (this.game.gameStarted) {
                            // If game is running, resume game
                            this.game.resumeGame();
                            this.game.switchToLayer(1);
                        }
                        break;
                    case 1: // Game layer
                        if (this.game.gameStarted && !this.game.isPaused) {
                            this.game.pauseGame();
                            this.game.switchToLayer(2);
                        }
                        break;
                }
            }
        });
    }

    setupEventListeners() {
        // Existing ESC key handler
        this.setupEscapeKey();
    }
}
