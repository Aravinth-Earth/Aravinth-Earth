import { Gun } from './Gun.js';
import { BalloonManager } from './BalloonManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { Controls } from './Controls.js';

export class Game {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.score = 0;
        this.lives = 5;
        this.isGameOver = false;
        this.isPaused = false;

        this.controls = new Controls(this);
        this.gun = new Gun(this);
        this.balloonManager = new BalloonManager(this);
        this.collisionSystem = new CollisionSystem(this);
        
        this.init();
    }

    init() {
        this.createPauseOverlay();
        this.updateLives();
        this.update();
    }

    createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.className = 'pause-overlay';
        const pauseText = document.createElement('div');
        pauseText.className = 'pause-text';
        pauseText.textContent = 'PAUSED';
        this.pauseOverlay.appendChild(pauseText);
        // Add overlay to body instead of game container
        document.body.appendChild(this.pauseOverlay);
    }

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseButton').textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
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
        } else {
            this.pauseOverlay.classList.remove('active');
            // Apply updated settings before resuming
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
        // Update balloon speeds for existing balloons
        document.querySelectorAll('.balloon').forEach(balloon => {
            const animation = this.balloonManager.balloonAnimations.get(balloon);
            if (animation) {
                const speed = parseInt(this.controls.balloonSpeed.value) || 1;
                animation.playbackRate = speed;
            }
        });

        // Update balloon sizes
        const sizeInput = parseInt(this.controls.balloonSize?.value) || this.balloonManager.maxBalloonSize;
        const sizeMultiplier = (sizeInput / this.balloonManager.maxBalloonSize) * 2;
        document.querySelectorAll('.balloon').forEach(balloon => {
            balloon.style.setProperty('--size-multiplier', sizeMultiplier);
        });
    }

    updateLives() {
        document.getElementById('lives').textContent = this.lives;
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.cleanup();
        
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over';
        gameOverDiv.textContent = `Game Over! Final Score: ${this.score}`;
        this.container.appendChild(gameOverDiv);
        if (this.pauseOverlay) {
            this.pauseOverlay.remove();
        }
    }

    cleanup() {
        this.gun.cleanup();
        this.balloonManager.cleanup();
        this.collisionSystem.cleanup();
    }

    update() {
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
