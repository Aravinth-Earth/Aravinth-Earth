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
    }

    createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.className = 'pause-overlay';
        const pauseText = document.createElement('div');
        pauseText.className = 'pause-text';
        pauseText.textContent = 'PAUSED';
        this.pauseOverlay.appendChild(pauseText);
        document.body.appendChild(this.pauseOverlay);
    }

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseButton').textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
            this.pauseOverlay.classList.add('active');
            this.balloonManager.cleanup();
            if (this.gun.shootingInterval) {
                clearInterval(this.gun.shootingInterval);
            }
            document.querySelectorAll('.balloon, .bullet').forEach(element => {
                element.getAnimations().forEach(animation => animation.pause());
            });
        } else {
            this.pauseOverlay.classList.remove('active');
            this.balloonManager.spawnBalloons();
            this.gun.startAutoShooting();
            document.querySelectorAll('.balloon, .bullet').forEach(element => {
                element.getAnimations().forEach(animation => animation.play());
            });
        }
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
}
