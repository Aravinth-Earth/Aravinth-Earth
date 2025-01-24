export class BalloonManager {
    constructor(game) {
        this.game = game;
        this.colors = ['#FF0000', '#FF4500', '#FFA500', '#FFD700', '#7FFF00', 
                      '#00FF00', '#00FFFF', '#0000FF', '#8A2BE2', '#FF00FF'];
        this.spawnIntervalId = null;
        this.maxBalloonSize = 5;
        this.balloonIdCounter = 0;
        this.maxBalloons = parseInt(document.getElementById('maxBalloons').value);
        this.targetBalloonPercentage = 0.7; // Aim to maintain 70% of max balloons
        this.spawnBatchSize = 3; // Spawn multiple balloons at once
        this.spawnInterval = 500; // Spawn every 500ms instead of 1000ms
        this.setupControls();
        this.spawnBalloons();
        this.balloonAnimations = new Map(); // Track balloon animations
    }

    setupControls() {
        // Listen for changes to maxBalloons input
        document.getElementById('maxBalloons').addEventListener('change', (e) => {
            this.maxBalloons = parseInt(e.target.value);
        });
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    spawnBalloons() {
        if (this.game.isPaused || this.game.isGameOver) return;
        
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }

        this.spawnIntervalId = setInterval(() => {
            const currentBalloons = document.querySelectorAll('.balloon:not(.bursting)').length;
            const targetCount = Math.floor(this.maxBalloons * this.targetBalloonPercentage);
            
            if (currentBalloons < targetCount) {
                const balloonsToSpawn = Math.min(
                    this.spawnBatchSize,
                    this.maxBalloons - currentBalloons
                );
                
                // Spawn multiple balloons with slight delay between each
                for (let i = 0; i < balloonsToSpawn; i++) {
                    setTimeout(() => {
                        if (!this.game.isPaused && !this.game.isGameOver) {
                            this.createBalloon();
                        }
                    }, i * 100); // 100ms delay between each balloon in batch
                }
            }
        }, this.spawnInterval);
    }

    getRandomBalloonPosition() {
        const position = { x: 0, y: 0 };
        const spawnArea = Math.random();
        
        if (spawnArea < 0.5) { // Increased top spawn probability
            // Top edge - wider spread
            position.x = -10 + Math.random() * 120; // Goes from -10% to 110% of viewport
            position.y = -10;
        } else if (spawnArea < 0.75) {
            // Left edge
            position.x = -10;
            position.y = Math.random() * 40; // Increased height range to 40%
        } else {
            // Right edge
            position.x = 110;
            position.y = Math.random() * 40; // Increased height range to 40%
        }
        
        return position;
    }

    createBalloon() {
        const balloon = document.createElement('div');
        const balloonId = `balloon_${++this.balloonIdCounter}`;
        balloon.id = balloonId;
        balloon.className = 'balloon';
        balloon.style.backgroundColor = this.getRandomColor();
        
        // Ensure initial visibility
        balloon.style.visibility = 'visible';
        balloon.style.opacity = '1';
        
        const position = this.getRandomBalloonPosition();
        balloon.style.left = `${position.x}vw`;
        balloon.style.top = `${position.y}vh`;
        
        const sizeInput = parseInt(this.game.controls.balloonSize?.value) || this.maxBalloonSize;
        const sizeMultiplier = (sizeInput / this.maxBalloonSize) * 2;
        balloon.style.setProperty('--size-multiplier', sizeMultiplier);
        
        this.game.container.appendChild(balloon);
        
        // Force a reflow to ensure proper positioning before animation
        balloon.offsetHeight;
        
        this.setupBalloonBehavior(balloon);
        return balloon;
    }

    setupBalloonBehavior(balloon) {
        const speed = parseInt(this.game.controls.balloonSpeed.value) || 1;
        const duration = 6000;  // Base duration
        
        const gunRect = this.game.gun.element.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width/2;
        
        // Aim slightly above the gun to create better gameplay
        const gunCenterY = gunRect.top;
        
        // Get balloon's initial position in pixels instead of viewport units
        const balloonRect = balloon.getBoundingClientRect();
        const startX = balloonRect.left;
        const startY = balloonRect.top;
        const deltaX = (gunCenterX - startX);
        const deltaY = (gunCenterY - startY);

        // Set initial transform to ensure proper starting position
        balloon.style.transform = 'translate3d(0, 0, 0)';
        
        const animation = balloon.animate([
            { transform: 'translate3d(0, 0, 0)' },
            { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` }
        ], {
            duration: duration,
            easing: 'linear',
            fill: 'forwards'
        });

        // Set initial speed via playbackRate
        animation.playbackRate = speed;
        
        // Store the animation
        this.balloonAnimations.set(balloon, animation);

        // Ensure balloon is visible immediately
        requestAnimationFrame(() => {
            balloon.style.visibility = 'visible';
            balloon.style.opacity = '1';
        });

        animation.onfinish = () => {
            if (balloon.isConnected) {
                this.game.lives--;
                this.game.updateLives();
                balloon.remove();
                this.balloonAnimations.delete(balloon);
            }
        };
    }

    burstBalloon(balloon) {
        if (!balloon || !balloon.isConnected) return;
        
        balloon.classList.add('bursting');
        this.game.score++;
        document.getElementById('score').textContent = this.game.score;
        
        this.createBurstParticles(balloon);
        setTimeout(() => balloon.remove(), 300);
    }

    createBurstParticles(balloon) {
        const rect = balloon.getBoundingClientRect();
        const centerX = rect.left + rect.width/2;
        const centerY = rect.top + rect.height/2;
        const color = balloon.style.backgroundColor;
        
        for(let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.backgroundColor = color;
            
            const angle = (i / 8) * Math.PI * 2;
            const tx = Math.cos(angle) * 50;
            const ty = Math.sin(angle) * 50;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            this.game.container.appendChild(particle);
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    pauseAllBalloons() {
        this.balloonAnimations.forEach(animation => {
            animation.pause();
        });
    }

    resumeAllBalloons() {
        this.balloonAnimations.forEach(animation => {
            animation.play();
        });
    }

    cleanup() {
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }
        // Only remove balloons if game is over
        if (this.game.isGameOver) {
            document.querySelectorAll('.balloon').forEach(balloon => {
                balloon.remove();
                this.balloonAnimations.delete(balloon);
            });
        }
    }
}
