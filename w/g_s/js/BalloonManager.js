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
        this.balloonAnimations = new Map(); // Track balloon animations
        this.balloonSpeed = 1;
        this.balloonSize = 5;
        this.updateSettingsReferences();
    }

    setupControls() {
        // Listen for changes to maxBalloons input
        document.getElementById('maxBalloons').addEventListener('change', (e) => {
            this.maxBalloons = parseInt(e.target.value);
        });
    }

    updateSettingsReferences() {
        // Get references to current settings
        const configLayer = document.querySelector('.config-layer');
        if (configLayer) {
            const speedInput = configLayer.querySelector('#balloonSpeed');
            const sizeInput = configLayer.querySelector('#balloonSize');
            const maxBalloonsInput = configLayer.querySelector('#maxBalloons');
            
            if (speedInput) this.balloonSpeed = parseInt(speedInput.value);
            if (sizeInput) this.balloonSize = parseInt(sizeInput.value);
            if (maxBalloonsInput) this.maxBalloons = parseInt(maxBalloonsInput.value);
        }
    }

    updateSettings(settings) {
        this.balloonSpeed = settings.balloonSpeed;
        this.balloonSize = settings.balloonSize;
        this.maxBalloons = settings.maxBalloons;
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
            if (this.game.isGameOver) {
                clearInterval(this.spawnIntervalId);
                return;
            }
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
        
        const sizeMultiplier = (this.balloonSize / this.maxBalloonSize) * 2;
        balloon.style.setProperty('--size-multiplier', sizeMultiplier);
        
        this.game.container.appendChild(balloon);
        
        // Force a reflow to ensure proper positioning before animation
        balloon.offsetHeight;
        
        this.setupBalloonBehavior(balloon);
        return balloon;
    }

    setupBalloonBehavior(balloon) {
        const speed = this.balloonSpeed || 1;
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
        
        const rect = balloon.getBoundingClientRect();
        const color = balloon.style.backgroundColor;
        
        // Create burst ring
        this.createBurstRing(
            rect.left + rect.width/2, 
            rect.top + rect.height/2, 
            rect.width * 0.85, // 85% of balloon size
            color
        );
        
        balloon.classList.add('bursting');
        this.game.score++;
        document.getElementById('score').textContent = this.game.score;
        
        this.createBurstParticles(balloon);
        setTimeout(() => balloon.remove(), 300);
    }

    createBurstRing(x, y, diameter, color) {
        const numSplashes = 4; // Number of overlapping splashes
        const container = document.createElement('div');
        container.className = 'burst-ring';
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        
        for (let i = 0; i < numSplashes; i++) {
            const splash = document.createElement('div');
            splash.className = 'burst-splash';
            
            // Random size variation for each splash
            const size = diameter * (0.8 + Math.random() * 0.4);
            splash.style.width = `${size}px`;
            splash.style.height = `${size}px`;
            
            // Random position offset
            const offsetX = (Math.random() - 0.5) * (diameter * 0.3);
            const offsetY = (Math.random() - 0.5) * (diameter * 0.3);
            splash.style.left = `${offsetX}px`;
            splash.style.top = `${offsetY}px`;
            
            // Create organic shape using multiple radial gradients
            const gradients = [];
            for (let j = 0; j < 3; j++) {
                const angle = Math.random() * 360;
                const distance = 50 + Math.random() * 50;
                gradients.push(`radial-gradient(
                    circle at ${Math.random() * 100}% ${Math.random() * 100}%,
                    ${color} 0%,
                    transparent ${distance}%
                )`);
            }
            splash.style.background = gradients.join(', ');
            
            container.appendChild(splash);
            
            // Animate each splash independently
            splash.animate([
                {
                    opacity: 0.4,
                    transform: 'scale(0.8) rotate(0deg)',
                    filter: 'blur(5px)'
                },
                {
                    opacity: 0.2,
                    transform: `scale(1.1) rotate(${Math.random() * 30}deg)`,
                    filter: 'blur(8px)',
                    offset: 0.7
                },
                {
                    opacity: 0,
                    transform: `scale(1.2) rotate(${Math.random() * 45}deg)`,
                    filter: 'blur(10px)'
                }
            ], {
                duration: 15000, // 15 seconds
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards',
                delay: Math.random() * 200 // Stagger the animations slightly
            });
        }
        
        this.game.container.appendChild(container);
        setTimeout(() => container.remove(), 15000);
    }

    createBurstParticles(balloon) {
        const rect = balloon.getBoundingClientRect();
        const color = balloon.style.backgroundColor;
        
        // Create container at the exact position relative to viewport
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-container';
        particleContainer.style.left = '0';
        particleContainer.style.top = '0';
        particleContainer.style.width = '100%';
        particleContainer.style.height = '100%';
        document.body.appendChild(particleContainer);
        
        for(let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.backgroundColor = color;
            // Position particle at balloon's position
            particle.style.left = rect.left + (rect.width / 2) + 'px';
            particle.style.top = rect.top + (rect.height / 2) + 'px';
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = rect.width/2 + Math.random() * 20;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rotation = Math.random() * 360;
            
            particleContainer.appendChild(particle);
            
            particle.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 500 + Math.random() * 200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });
        }

        setTimeout(() => particleContainer.remove(), 700);
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
            this.spawnIntervalId = null;
        }

        // Only remove balloons if game is over
        if (this.game.isGameOver) {
            document.querySelectorAll('.balloon').forEach(balloon => {
                const animation = this.balloonAnimations.get(balloon);
                if (animation) {
                    animation.pause();
                    this.balloonAnimations.delete(balloon);
                }
                // Remove balloons after a short delay
                setTimeout(() => balloon.remove(), 100);
            });
        }
    }
}
