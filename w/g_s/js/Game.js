import { Gun } from './Gun.js';
import { BalloonManager } from './BalloonManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { Controls } from './Controls.js';

export class Game {
    constructor() {
        // Load saved settings or use defaults
        this.settings = this.loadSettings();

        this.container = document.getElementById('gameContainer');
        this.score = 0;
        this.lives = 5;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.isPauseButtonClicked = false; // Add this flag
        this.lastPauseTime = 0; // Add this to prevent rapid pause toggling

        this.controls = new Controls(this);
        // Initialize components without starting them
        this.gun = new Gun(this);
        this.balloonManager = new BalloonManager(this);
        this.collisionSystem = new CollisionSystem(this);
        
        this.controlsOverlay = document.getElementById('controlsOverlay');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        
        // Create pause overlay first before setting up handlers
        this.createPauseOverlay();
        this.setupControlsHandlers();
        this.setupPauseUI();
        this.setupConfigButton();

        // Remove this line since controlsToggle doesn't exist in HTML anymore
        // this.controlsToggle = document.getElementById('controlsToggle');

        this.currentLayer = 1; // Start at config layer (outermost)
        // Remove old overlays if they exist
        this.cleanup();
        this.cleanupOldLayers();
        this.createLayers();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('gameSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            bulletCount: 5,
            bulletSpeed: 1,
            balloonSpeed: 1,
            balloonSize: 5,
            maxBalloons: 20
        };
    }

    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }

    cleanupOldLayers() {
        // Remove old elements and controls
        [
            'controlsOverlay', 'controls', 'gameHUD', 
            'pauseButton', 'configButton',
            'score-display', 'lives-display'
        ].forEach(id => {
            const oldElement = document.getElementById(id) || document.querySelector(`.${id}`);
            if (oldElement) oldElement.remove();
        });
        // Remove old overlays and duplicate game controls
        document.querySelectorAll('.pause-overlay, .game-layer, .game-controls').forEach(el => el.remove());
    }

    createLayers() {
        // First create the game HUD
        this.gameHUD = document.createElement('div');
        this.gameHUD.className = 'game-hud';
        this.gameHUD.innerHTML = `
            <div class="hud-container">
                <div class="score-display">
                    <i class="mdi mdi-trophy-outline"></i>
                    <span id="score">0</span>
                </div>
                <div class="lives-display">
                    <div class="hearts-container">
                        ${Array(5).fill('<i class="mdi mdi-heart"></i>').join('')}
                    </div>
                </div>
            </div>
            <div class="game-controls">
                <button id="pauseGame">
                    <i class="mdi mdi-pause"></i>
                </button>
                <button id="gameSettings">
                    <i class="mdi mdi-cog"></i>
                </button>
            </div>
        `;

        // Layer 3: Config Screen (outermost)
        this.configLayer = document.createElement('div');
        this.configLayer.className = 'game-layer config-layer';
        this.configLayer.innerHTML = `
            <div class="config-container">
                <h1>Game Settings</h1>
                <div class="config-sections">
                    <div class="config-section">
                        <h3>Weapon Settings</h3>
                        <div class="config-group">
                            <label>
                                <span class="setting-name">Bullets per shot</span>
                                <div class="setting-control">
                                    <input type="number" id="bulletCount" min="1" max="5" value="5">
                                    <span class="setting-range">1-5</span>
                                </div>
                            </label>
                            <label>
                                <span class="setting-name">Bullet Speed</span>
                                <div class="setting-control">
                                    <input type="number" id="bulletSpeed" min="1" max="10" value="1">
                                    <span class="setting-range">1-10</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="config-section">
                        <h3>Target Settings</h3>
                        <div class="config-group">
                            <label>
                                <span class="setting-name">Balloon Speed</span>
                                <div class="setting-control">
                                    <input type="number" id="balloonSpeed" min="1" max="5" value="1">
                                    <span class="setting-range">1-5</span>
                                </div>
                            </label>
                            <label>
                                <span class="setting-name">Balloon Size</span>
                                <div class="setting-control">
                                    <input type="number" id="balloonSize" min="1" max="5" value="5">
                                    <span class="setting-range">1-5</span>
                                </div>
                            </label>
                            <label class="full-width">
                                <span class="setting-name">Max Balloons</span>
                                <div class="setting-control range-control">
                                    <input type="range" id="maxBalloonsRange" min="5" max="50" value="20">
                                    <input type="number" id="maxBalloons" min="5" max="50" value="20">
                                    <span class="setting-range">5-50</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="config-actions">
                    <button class="primary-button" id="configDone">Apply Settings & Continue</button>
                </div>
            </div>
        `;

        // Apply saved settings to config inputs
        this.configLayer.querySelector('#bulletCount').value = this.settings.bulletCount;
        this.configLayer.querySelector('#bulletSpeed').value = this.settings.bulletSpeed;
        this.configLayer.querySelector('#balloonSpeed').value = this.settings.balloonSpeed;
        this.configLayer.querySelector('#balloonSize').value = this.settings.balloonSize;
        this.configLayer.querySelector('#maxBalloons').value = this.settings.maxBalloons;
        this.configLayer.querySelector('#maxBalloonsRange').value = this.settings.maxBalloons;

        // Layer 2: Menu Screen (middle)
        this.menuLayer = document.createElement('div');
        this.menuLayer.className = 'game-layer menu-layer';
        this.menuLayer.innerHTML = `
            <div class="menu-content">
                <h1>Balloon Shooter</h1>
                <div class="menu-buttons">
                    <button class="primary-button" id="startGame">Play</button>
                    <button class="primary-button" id="resumeGame" style="display:none">Resume</button>
                    <button class="secondary-button" id="restartGame" style="display:none">Restart</button>
                    <button class="secondary-button" id="openSettings">Settings</button>
                </div>
            </div>
        `;

        // Layer 1: Game Layer (innermost)
        this.gameLayer = document.createElement('div');
        this.gameLayer.className = 'game-layer game-active-layer';
        
        // Only append game container to game layer
        if (this.container) {
            document.body.removeChild(this.container);
            this.gameLayer.appendChild(this.container);
            
            // Re-add the gun
            const gun = document.createElement('div');
            gun.id = 'gun';
            gun.setAttribute('role', 'img');
            gun.setAttribute('aria-label', 'Gun');
            gun.innerHTML = `
                <div class="gun-base">
                    <div class="direction-indicator"></div>
                </div>
                <div class="barrels-container"></div>
            `;
            this.container.appendChild(gun);
        }

        // Append all layers to body in correct order
        document.body.appendChild(this.gameLayer);
        document.body.appendChild(this.menuLayer);
        document.body.appendChild(this.configLayer);
        // Append HUD last so it's always on top
        document.body.appendChild(this.gameHUD);
        
        // Start with config layer visible
        this.switchToLayer(3);
        this.setupLayerHandlers();
    }

    setupLayerHandlers() {
        // Config Layer handlers
        this.configLayer.querySelector('#configDone').onclick = () => {
            // Save settings before leaving config screen
            this.applyUpdatedSettings();
            
            if (this.isGameOver) {
                // If coming from game over, start fresh game
                this.score = 0;
                this.lives = 5;
                this.isGameOver = false;
                this.gameStarted = false;
            }
            
            this.switchToLayer(2);
        };

        // Menu Layer handlers
        this.menuLayer.querySelector('#startGame').onclick = () => {
            this.startGame();
            this.switchToLayer(1);
        };
        this.menuLayer.querySelector('#resumeGame').onclick = () => {
            this.resumeGame();
            this.switchToLayer(1);
        };
        this.menuLayer.querySelector('#restartGame').onclick = () => {
            window.location.reload();
        };
        this.menuLayer.querySelector('#openSettings').onclick = () => {
            this.switchToLayer(3);
        };

        // Game HUD handlers
        this.gameHUD.querySelector('#pauseGame').onclick = () => {
            this.pauseGame();
            this.switchToLayer(2);
        };
        this.gameHUD.querySelector('#gameSettings').onclick = () => {
            this.pauseGame();
            this.switchToLayer(3);
        };
    }

    switchToLayer(layerNum) {
        if (this.isGameOver && layerNum === 1) return; // Prevent switching to game layer if game is over

        this.currentLayer = layerNum;
        [this.configLayer, this.menuLayer, this.gameLayer].forEach(layer => {
            if (layer) layer.style.display = 'none';
        });

        // Hide HUD by default
        if (this.gameHUD) {
            this.gameHUD.style.display = 'none';
        }

        switch(layerNum) {
            case 3: // Config (outer)
                if (this.configLayer) {
                    this.configLayer.style.display = 'flex';
                }
                break;
            case 2: // Menu (middle)
                if (this.menuLayer) {
                    this.menuLayer.style.display = 'flex';
                    // Only show game-related buttons if game has started
                    if (this.menuLayer.querySelector('#startGame')) {
                        this.menuLayer.querySelector('#startGame').style.display = 
                            this.gameStarted && !this.isGameOver ? 'none' : 'block';
                    }
                    if (this.menuLayer.querySelector('#resumeGame')) {
                        this.menuLayer.querySelector('#resumeGame').style.display = 
                            this.gameStarted && !this.isGameOver ? 'block' : 'none';
                    }
                    if (this.menuLayer.querySelector('#restartGame')) {
                        this.menuLayer.querySelector('#restartGame').style.display = 
                            this.gameStarted && !this.isGameOver ? 'block' : 'none';
                    }
                }
                break;
            case 1: // Game (inner)
                if (this.gameLayer) {
                    this.gameLayer.style.display = 'flex';
                    // Only show HUD during active gameplay
                    if (this.gameHUD && !this.isGameOver) {
                        this.gameHUD.style.display = 'flex';
                    }
                    if (this.gameStarted && !this.isPaused && !this.isGameOver) {
                        this.resumeGame();
                    }
                }
                break;
        }
    }

    setupControlsHandlers() {
        // Only set up handlers if elements exist
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.startGame());
        }
    }

    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.controlsOverlay.style.display = 'none';
            // Change start button behavior for when config is opened during gameplay
            this.startButton.textContent = 'Resume Game';
            this.startButton.onclick = () => this.resumeGame();
            this.startButton.style.display = 'none'; // Hide start button when game starts
            
            // Ensure gun is properly positioned before starting
            const gunElement = document.getElementById('gun');
            if (gunElement) {
                // Position gun at bottom center
                gunElement.style.position = 'absolute';
                gunElement.style.bottom = '0';
                gunElement.style.left = '50%';
                gunElement.style.transform = 'translateX(-50%)';
            }
            
            // Start game components
            this.gun = new Gun(this); // Reinitialize gun
            this.gun.startAutoShooting();
            this.balloonManager.spawnBalloons();
            this.updateLives();
            this.update();
        }
        this.switchToLayer(1);
    }

    setupPauseUI() {
        document.getElementById('pauseButton').addEventListener('click', () => {
            // Only allow pause toggle every 300ms
            if (Date.now() - this.lastPauseTime < 300) return;
            this.lastPauseTime = Date.now();
            
            if (!this.isPaused) {
                this.togglePause();
            }
        });
    }

    setupConfigButton() {
        document.getElementById('configButton').addEventListener('click', () => {
            if (!this.gameStarted) return;
            this.isPaused = true;
            this.pauseGame();
            this.controlsOverlay.style.display = 'flex';
            
            // Create close button if it doesn't exist
            if (!this.closeConfigButton) {
                this.closeConfigButton = document.createElement('button');
                this.closeConfigButton.textContent = '✕';
                this.closeConfigButton.className = 'close-config';
                this.closeConfigButton.onclick = () => {
                    this.controlsOverlay.style.display = 'none';
                };
                this.controlsOverlay.appendChild(this.closeConfigButton);
            }
        });
    }

    createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.className = 'pause-overlay';
        
        const pauseContent = document.createElement('div');
        pauseContent.className = 'pause-content';
        
        const pauseText = document.createElement('div');
        pauseText.className = 'pause-text';
        pauseText.textContent = 'PAUSED';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'pause-buttons';
        
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Resume';
        resumeButton.onclick = () => {
            if (!this.isPaused) return;
            this.isPaused = false;
            this.resumeGame();
        };
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.onclick = () => window.location.reload();
        
        const configButton = document.createElement('button');
        configButton.textContent = '⚙️ Settings';
        configButton.onclick = () => {
            this.controlsOverlay.style.display = 'flex';
            // Create close button if needed
            if (!this.closeConfigButton) {
                this.closeConfigButton = document.createElement('button');
                this.closeConfigButton.textContent = '✕';
                this.closeConfigButton.className = 'close-config';
                this.closeConfigButton.onclick = () => {
                    this.controlsOverlay.style.display = 'none';
                };
                this.controlsOverlay.appendChild(this.closeConfigButton);
            }
        };
        
        buttonContainer.appendChild(resumeButton);
        buttonContainer.appendChild(configButton);
        buttonContainer.appendChild(restartButton);
        
        pauseContent.appendChild(pauseText);
        pauseContent.appendChild(buttonContainer);
        this.pauseOverlay.appendChild(pauseContent);
        
        document.body.appendChild(this.pauseOverlay);
    }

    toggleControls() {
        if (this.isPaused) {
            this.controlsOverlay.style.display = 
                this.controlsOverlay.style.display === 'none' ? 'flex' : 'none';
        }
    }

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        if (this.pauseButton) {
            this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
        
        if (this.isPaused) {
            this.pauseGame();
        } else {
            // Only resume if we're not in config mode
            if (this.controlsOverlay.style.display !== 'flex') {
                this.resumeGame();
            }
        }
    }

    pauseGame() {
        if (!this.pauseOverlay) return;
        
        this.pauseOverlay.classList.add('active');
        clearInterval(this.balloonManager.spawnIntervalId);
        this.balloonManager.spawnIntervalId = null;
        this.balloonManager.pauseAllBalloons();
        if (this.gun.shootingInterval) {
            clearInterval(this.gun.shootingInterval);
        }
        document.querySelectorAll('.bullet').forEach(bullet => {
            bullet.getAnimations().forEach(animation => animation.pause());
        });
    }

    resumeGame() {
        if (!this.pauseOverlay) return;
        
        this.isPaused = false;
        if (this.pauseButton) {
            this.pauseButton.textContent = 'Pause';
        }
        this.pauseOverlay.classList.remove('active');
        this.controlsOverlay.style.display = 'none';
        
        // Only restart game components if we were actually paused
        if (this.balloonManager.spawnIntervalId === null) {
            this.applyUpdatedSettings();
            this.balloonManager.spawnBalloons();
            this.balloonManager.resumeAllBalloons();
            this.gun.startAutoShooting();
            document.querySelectorAll('.bullet').forEach(bullet => {
                bullet.getAnimations().forEach(animation => animation.play());
            });
        }
    }

    applyUpdatedSettings() {
        if (!this.controls) return;

        const configLayer = document.querySelector('.config-layer');
        if (configLayer) {
            // Update and save settings even if game is over
            this.settings.bulletCount = parseInt(configLayer.querySelector('#bulletCount').value) || 5;
            this.settings.bulletSpeed = parseInt(configLayer.querySelector('#bulletSpeed').value) || 1;
            this.settings.balloonSpeed = parseInt(configLayer.querySelector('#balloonSpeed').value) || 1;
            this.settings.balloonSize = parseInt(configLayer.querySelector('#balloonSize').value) || 5;
            this.settings.maxBalloons = parseInt(configLayer.querySelector('#maxBalloons').value) || 20;
            
            // Always save settings when they're updated
            this.saveSettings();
            
            // Only update game components if game is not over
            if (!this.isGameOver) {
                this.gun.updateSettings(this.settings);
                this.balloonManager.updateSettings(this.settings);
                // Update manager and gun references
                this.gun.updateSettingsReferences();
                this.balloonManager.updateSettingsReferences();

                // Update balloon speeds for existing balloons
                document.querySelectorAll('.balloon').forEach(balloon => {
                    const animation = this.balloonManager.balloonAnimations.get(balloon);
                    if (animation) {
                        const speed = parseInt(this.controls.balloonSpeed?.value) || 1;
                        animation.playbackRate = speed;
                    }
                });

                // Update balloon sizes
                const sizeInput = parseInt(this.controls.balloonSize?.value) || this.balloonManager.maxBalloonSize;
                const sizeMultiplier = (sizeInput / this.balloonManager.maxBalloonSize) * 2;
                document.querySelectorAll('.balloon').forEach(balloon => {
                    balloon.style.setProperty('--size-multiplier', sizeMultiplier);
                });

                // Update max balloons
                if (this.controls.maxBalloons) {
                    this.balloonManager.maxBalloons = parseInt(this.controls.maxBalloons.value);
                }

                // Update bullet count (will affect next shots)
                if (this.controls.bulletCount) {
                    this.gun.updateBulletCount(parseInt(this.controls.bulletCount.value));
                }

                // Update bullet speed (will affect next shots)
                if (this.controls.bulletSpeed) {
                    this.gun.updateBulletSpeed(parseInt(this.controls.bulletSpeed.value));
                }
            }
        }
    }

    updateLives() {
        const heartsContainer = document.querySelector('.hearts-container');
        if (!heartsContainer) {
            console.warn('Hearts container not found, creating new one');
            return;
        }

        // Update hearts display
        const hearts = Array(5).fill('').map((_, index) => {
            if (index < this.lives) {
                return '<i class="mdi mdi-heart"></i>';
            }
            return '<i class="mdi mdi-heart-outline"></i>';
        }).join('');
        
        heartsContainer.innerHTML = hearts;

        // Add low health effect
        if (this.lives <= 2) {
            heartsContainer.classList.add('low-health');
        } else {
            heartsContainer.classList.remove('low-health');
        }

        // Add life loss animation
        if (this.lives < parseInt(heartsContainer.dataset.previousLives || 5)) {
            const lostHeart = document.createElement('i');
            lostHeart.className = 'mdi mdi-heart-broken lost-heart';
            document.body.appendChild(lostHeart);
            
            // Position and animate the lost heart
            const rect = heartsContainer.getBoundingClientRect();
            lostHeart.style.left = `${rect.left + rect.width/2}px`;
            lostHeart.style.top = `${rect.top + rect.height/2}px`;
            
            lostHeart.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
                    opacity: 1,
                    color: 'var(--color-danger)'
                },
                { 
                    transform: 'translate(-50%, -150%) scale(0) rotate(180deg)',
                    opacity: 0,
                    color: 'var(--color-danger)'
                }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => lostHeart.remove();
        }
        
        heartsContainer.dataset.previousLives = this.lives;
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        const scoreDisplay = document.querySelector('.score-display');
        scoreElement.textContent = this.score;
        
        // Add score popup animation
        scoreDisplay.classList.remove('score-change');
        void scoreDisplay.offsetWidth; // Trigger reflow
        scoreDisplay.classList.add('score-change');
        
        // Add floating score indicator
        this.createFloatingNumber('+1', scoreDisplay, 'var(--color-warning)');
    }

    createFloatingNumber(text, parentElement, color) {
        const floating = document.createElement('div');
        floating.className = 'floating-number';
        floating.textContent = text;
        floating.style.color = color;
        
        // Position relative to parent element
        const rect = parentElement.getBoundingClientRect();
        floating.style.left = `${rect.left + rect.width/2}px`;
        floating.style.top = `${rect.top + rect.height/2}px`;
        
        document.body.appendChild(floating);
        
        // Animate and remove
        floating.animate([
            { 
                transform: 'translate(-50%, -50%) scale(0.8)',
                opacity: 1
            },
            { 
                transform: 'translate(-50%, -150%) scale(1.2)',
                opacity: 0
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => floating.remove();
    }

    gameOver() {
        this.isGameOver = true;
        this.stopAllGameElements();
        this.cleanup();

        // Hide game HUD
        if (this.gameHUD) {
            this.gameHUD.style.display = 'none';
        }

        // Clear game container of any remaining elements
        while (this.container.firstChild) {
            this.container.firstChild.remove();
        }

        // Update menu layer content for game over
        const menuContent = this.menuLayer.querySelector('.menu-content');
        menuContent.innerHTML = `
            <h1>Game Over!</h1>
            <div class="game-stats">
                <div class="final-score">Final Score: ${this.score}</div>
                <div class="high-score">Best Score: ${Math.max(this.score, localStorage.getItem('highScore') || 0)}</div>
            </div>
            <div class="menu-buttons">
                <button class="primary-button" id="playAgain">Play Again</button>
                <button class="secondary-button" id="openSettings">Change Settings</button>
            </div>
        `;

        // Save high score
        const currentHighScore = localStorage.getItem('highScore') || 0;
        if (this.score > currentHighScore) {
            localStorage.setItem('highScore', this.score);
        }

        // Switch to menu layer
        this.switchToLayer(2);

        // Set up new button handlers
        const playAgainBtn = this.menuLayer.querySelector('#playAgain');
        const settingsBtn = this.menuLayer.querySelector('#openSettings');
        
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                // Reset game state
                this.score = 0;
                this.lives = 5;
                this.isGameOver = false;
                this.gameStarted = false;
                
                // Clear game area
                while (this.container.firstChild) {
                    this.container.firstChild.remove();
                }
                
                // Reset menu content to original state
                this.resetMenuContent();
                
                // Add gun back to container with proper positioning
                const gun = document.createElement('div');
                gun.id = 'gun';
                gun.setAttribute('role', 'img');
                gun.setAttribute('aria-label', 'Gun');
                gun.style.position = 'absolute';
                gun.style.bottom = '0';
                gun.style.left = '50%';
                gun.style.transform = 'translateX(-50%)';
                gun.innerHTML = `
                    <div class="gun-base">
                        <div class="direction-indicator"></div>
                    </div>
                    <div class="barrels-container"></div>
                `;
                this.container.appendChild(gun);
                
                // Create new gun instance before starting
                this.gun = new Gun(this);
                
                // Start new game directly
                this.startGame();
            };
        }
        
        if (settingsBtn) {
            settingsBtn.onclick = () => {
                this.applyUpdatedSettings();
                this.switchToLayer(3);
            };
        }
    }

    // Add this new method to reset menu content
    resetMenuContent() {
        if (this.menuLayer) {
            const menuContent = this.menuLayer.querySelector('.menu-content');
            menuContent.innerHTML = `
                <h1>Balloon Shooter</h1>
                <div class="menu-buttons">
                    <button class="primary-button" id="startGame">Play</button>
                    <button class="primary-button" id="resumeGame" style="display:none">Resume</button>
                    <button class="secondary-button" id="restartGame" style="display:none">Restart</button>
                    <button class="secondary-button" id="openSettings">Settings</button>
                </div>
            `;
            // Set up the menu handlers again
            this.setupLayerHandlers();
        }
    }

    stopAllGameElements() {
        // Stop gun shooting
        if (this.gun.shootingInterval) {
            clearInterval(this.gun.shootingInterval);
            this.gun.shootingInterval = null;
        }

        // Stop balloon spawning
        if (this.balloonManager.spawnIntervalId) {
            clearInterval(this.balloonManager.spawnIntervalId);
            this.balloonManager.spawnIntervalId = null;
        }

        // Pause all balloons
        this.balloonManager.pauseAllBalloons();

        // Stop all existing bullet animations
        document.querySelectorAll('.bullet').forEach(bullet => {
            const animations = bullet.getAnimations();
            animations.forEach(animation => animation.pause());
            // Remove bullets after a short delay
            setTimeout(() => bullet.remove(), 100);
        });
    }

    cleanup() {
        // Save settings before cleanup
        this.saveSettings();
        this.gun.cleanup();
        this.balloonManager.cleanup();
        this.collisionSystem.cleanup();
    }

    update() {
        if (!this.gameStarted) return;
        if (!this.isPaused && !this.isGameOver) {
            const bullets = document.querySelectorAll('.bullet');
            const balloons = document.querySelectorAll('.balloon:not(.bursting)');
            
            bullets.forEach(bullet => {
                balloons.forEach(balloon => {
                    if (this.collisionSystem.isColliding(
                        bullet.getBoundingClientRect(), 
                        balloon.getBoundingClientRect()
                    )) {
                        this.balloonManager.burstBalloon(balloon);
                        bullet.remove();
                    }
                });
            });
        }
        requestAnimationFrame(() => this.update());
    }

    // Remove unused methods
    checkCollisions() {} // Remove this method
    updatePositions() {} // Remove this method
}
