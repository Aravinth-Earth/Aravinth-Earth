class Game {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.gun = document.getElementById('gun');
        this.score = 0;
        this.bulletCount = document.getElementById('bulletCount');
        this.balloonSpeed = document.getElementById('balloonSpeed');
        this.bulletSpeed = document.getElementById('bulletSpeed');
        this.balloonSize = document.getElementById('balloonSize');
        this.mouseX = 0;
        this.mouseY = 0;
        this.setupMouseTracking();
        this.shootingInterval = null;
        this.startAutoShooting();
        this.activeCollisionChecks = new Set();
        this.lives = 5;
        this.updateLives();
        this.isGameOver = false;
        this.activeBalloonsRects = new Set();
        this.colors = ['#FF0000', '#FF4500', '#FFA500', '#FFD700', '#7FFF00', 
                      '#00FF00', '#00FFFF', '#0000FF', '#8A2BE2', '#FF00FF'];
        this.maxBalloonsInput = document.getElementById('maxBalloons');
        this.spawnIntervalId = null;
        this.spawnDelay = 1000; // 1 second between spawns
        this.updateBarrels();
        this.spawnBalloons();
        this.bulletCount.addEventListener('change', () => this.updateBarrels());
        this.isPaused = false;
        this.setupPause();
        this.createPauseOverlay();
        this.maxBalloonSize = 5;
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

    setupPause() {
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.addEventListener('click', () => this.togglePause());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
    }

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseButton').textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
            // Pause all animations and intervals
            this.pauseOverlay.classList.add('active');
            clearInterval(this.spawnIntervalId);
            clearInterval(this.shootingInterval);
            
            // Pause all balloon animations
            document.querySelectorAll('.balloon').forEach(balloon => {
                balloon.getAnimations().forEach(animation => animation.pause());
            });
            
            // Pause all bullet animations
            document.querySelectorAll('.bullet').forEach(bullet => {
                bullet.getAnimations().forEach(animation => animation.pause());
            });
        } else {
            // Resume game
            this.pauseOverlay.classList.remove('active');
            this.spawnBalloons();
            this.startAutoShooting();
            
            // Resume all animations
            document.querySelectorAll('.balloon, .bullet').forEach(element => {
                element.getAnimations().forEach(animation => animation.play());
            });
        }
    }

    getRandomColor() {
        // Random color from predefined vibrant colors
        return this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Alternatively, for fully random HSL color with high saturation:
        // return `hsl(${Math.random() * 360}, 80%, 60%)`;
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
        this.pauseOverlay.remove(); // Clean up overlay on game over
    }

    setupEventListeners() {
        // Remove click event listener since shooting is automatic
    }

    setupMouseTracking() {
        this.container.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.rotateGun();
        });
    }

    rotateGun() {
        const gunRect = this.gun.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width / 2;
        const gunCenterY = gunRect.top + gunRect.height / 2;
        
        const angle = Math.atan2(this.mouseY - gunCenterY, this.mouseX - gunCenterX);
        const degrees = angle * (180 / Math.PI);

        // Rotate all barrels together
        this.gun.querySelectorAll('.gun-barrel').forEach(barrel => {
            const currentRotation = barrel.style.transform.match(/-?\d+/);
            const barrelAngle = currentRotation ? parseInt(currentRotation[0]) : 0;
            barrel.style.transform = `translateX(-50%) rotate(${degrees - 90 + barrelAngle}deg)`;
        });
    }

    startAutoShooting() {
        // Clear any existing interval
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }

        // Shoot every 100ms (10 times per second)
        this.shootingInterval = setInterval(() => {
            // Add small random delay for more natural machine gun effect
            setTimeout(() => {
                this.shoot();
            }, Math.random() * 50); // Random delay up to 50ms
        }, 100);
    }

    shoot() {
        if (this.isPaused) return;
        const bullets = parseInt(this.bulletCount.value) || 1;
        const gunRect = this.gun.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width / 2;
        const gunCenterY = gunRect.top + gunRect.height / 2;
        const angle = Math.atan2(this.mouseY - gunCenterY, this.mouseX - gunCenterX);
        
        const totalSpread = 30;
        const spreadPerBullet = totalSpread / (bullets > 1 ? bullets - 1 : 1);
        const speed = parseInt(this.bulletSpeed.value) || 3;
        const duration = 3000 / speed;
        
        for(let i = 0; i < bullets; i++) {
            const bullet = document.createElement('div');
            bullet.className = 'bullet';
            bullet.style.left = (this.gun.offsetLeft + this.gun.offsetWidth/2) + 'px';
            bullet.style.bottom = '50px';
            
            const randomSpread = (Math.random() - 0.5) * 2;
            const bulletAngle = angle * (180 / Math.PI) + 
                              (bullets > 1 ? spreadPerBullet * (i - (bullets-1)/2) : 0) +
                              randomSpread;
            
            // Store trajectory data on bullet element
            bullet.dataset.angle = bulletAngle;
            bullet.dataset.startX = gunCenterX;
            bullet.dataset.startY = gunCenterY;
            bullet.dataset.speed = speed;
            
            const distance = window.innerHeight * 1.5;
            this.container.appendChild(bullet);
            
            const animation = bullet.animate([
                { transform: 'translate(-50%, 0)' },
                { transform: `translate(${Math.cos(bulletAngle * Math.PI/180) * distance}px, 
                            ${Math.sin(bulletAngle * Math.PI/180) * distance}px)` }
            ], {
                duration: duration,
                easing: 'linear'
            });

            animation.onfinish = () => bullet.remove();
            
            // Track bullet position without relying on getBoundingClientRect
            this.trackBulletPosition(bullet, animation, bulletAngle, speed);
        }
    }

    trackBulletPosition(bullet, animation, angle, speed) {
        const startTime = performance.now();
        const checkCollision = setInterval(() => {
            if (!bullet.isConnected) {
                clearInterval(checkCollision);
                this.activeCollisionChecks.delete(checkCollision);
                return;
            }

            const elapsedTime = performance.now() - startTime;
            const distance = (elapsedTime / 1000) * (speed * 200);
            
            const radianAngle = angle * Math.PI / 180;
            const currentX = parseFloat(bullet.dataset.startX) + Math.cos(radianAngle) * distance;
            const currentY = parseFloat(bullet.dataset.startY) + Math.sin(radianAngle) * distance;
            
            // Create virtual bullet rect with proper size
            const bulletRect = {
                width: 6,
                height: 6,
                left: currentX - 3,
                top: currentY - 3,
                right: currentX + 3,
                bottom: currentY + 3
            };

            const balloons = document.querySelectorAll('.balloon:not(.bursting)');
            balloons.forEach(balloon => {
                const balloonRect = balloon.getBoundingClientRect();
                if (this.isColliding(bulletRect, balloonRect)) {
                    this.burstBalloon(balloon);
                    bullet.remove();
                    clearInterval(checkCollision);
                }
            });
        }, 16);
        
        this.activeCollisionChecks.add(checkCollision);
    }

    detectCollisions(bullet) {
        const checkCollision = setInterval(() => {
            if (!bullet.isConnected) {
                clearInterval(checkCollision);
                this.activeCollisionChecks.delete(checkCollision);
                return;
            }

            const bulletRect = bullet.getBoundingClientRect();
            const balloons = document.querySelectorAll('.balloon:not(.bursting)');

            balloons.forEach(balloon => {
                const balloonRect = balloon.getBoundingClientRect();
                
                if (this.isColliding(bulletRect, balloonRect)) {
                    this.burstBalloon(balloon);
                    bullet.remove();
                    clearInterval(checkCollision);
                }
            });
        }, 16); // Check every frame (~60fps)
        
        this.activeCollisionChecks.add(checkCollision);
    }

    isColliding(bulletRect, balloonRect) {
        // Get actual balloon size considering the size multiplier
        const sizeInput = parseInt(this.balloonSize?.value) || this.maxBalloonSize;
        const sizeMultiplier = (sizeInput / this.maxBalloonSize) * 2;
        const baseSize = 40; // matches CSS --base-size
        const actualBalloonRadius = (baseSize * sizeMultiplier) / 2;

        // Get centers
        const bulletCenterX = bulletRect.left + bulletRect.width/2;
        const bulletCenterY = bulletRect.top + bulletRect.height/2;
        const balloonCenterX = balloonRect.left + balloonRect.width/2;
        const balloonCenterY = balloonRect.top + balloonRect.height/2;

        // Calculate distance between centers
        const dx = bulletCenterX - balloonCenterX;
        const dy = bulletCenterY - balloonCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Bullet radius (3px) + actual balloon radius
        const collisionDistance = 3 + actualBalloonRadius;

        return distance < collisionDistance;
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
            
            this.container.appendChild(particle);
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-out'
            }).onfinish = () => particle.remove();
        }
    }

    burstBalloon(balloon) {
        const balloonRect = balloon.getBoundingClientRect();
        this.activeBalloonsRects.delete(balloonRect);
        this.createBurstParticles(balloon);
        balloon.classList.add('bursting');
        this.score += 1;
        document.getElementById('score').textContent = this.score;
        
        // Clean up after burst animation
        const burstAnimation = balloon.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.5)', opacity: 0.5 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        burstAnimation.onfinish = () => {
            balloon.remove();
            // Clear any associated memory/references
            balloon.onanimationend = null;
            balloon.onclick = null;
        };
    }

    isBalloonColliding(balloon1Rect, otherBalloonsRects) {
        for (let rect of otherBalloonsRects) {
            const dx = (balloon1Rect.left + balloon1Rect.width/2) - (rect.left + rect.width/2);
            const dy = (balloon1Rect.top + balloon1Rect.height/2) - (rect.top + rect.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (balloon1Rect.width/2 + rect.width/2) * 1.2; // 20% buffer
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }

    spawnBalloons() {
        if (this.isPaused) return;
        // Clear any existing spawn interval
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }

        // Start new spawn interval
        this.spawnIntervalId = setInterval(() => {
            if (this.isGameOver) {
                clearInterval(this.spawnIntervalId);
                return;
            }

            const currentBalloons = document.querySelectorAll('.balloon:not(.bursting)').length;
            const maxAllowed = parseInt(this.maxBalloonsInput?.value) || 20;
            const sizeInput = parseInt(this.balloonSize?.value) || this.maxBalloonSize;
            const sizeMultiplier = (sizeInput / this.maxBalloonSize) * 2;
            
            if (currentBalloons >= maxAllowed) {
                return; // Skip spawn but keep interval running
            }

            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.style.backgroundColor = this.getRandomColor();
            balloon.style.setProperty('--size-multiplier', sizeMultiplier);
            
            // Initial position at top of screen
            balloon.style.top = '0px';
            balloon.style.left = (Math.random() * 80 + 10) + 'vw';
            
            this.container.appendChild(balloon);
            const balloonRect = balloon.getBoundingClientRect();
            this.activeBalloonsRects.add(balloonRect);

            // Setup balloon movement and collision
            this.setupBalloonBehavior(balloon);
            
        }, this.spawnDelay);
    }

    setupBalloonBehavior(balloon) {
        const speed = parseInt(this.balloonSpeed.value) || 1;
        const duration = 6000 / speed;
        
        // Get gun position for targeting
        const gunRect = this.gun.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width/2;
        const gunCenterY = gunRect.top + gunRect.height/2;
        
        // Calculate path to gun
        const startX = balloon.offsetLeft;
        const startY = balloon.offsetTop;
        const deltaX = (gunCenterX - startX);
        const deltaY = (gunCenterY - startY);
        
        const animation = balloon.animate([
            { transform: 'translate(0, 0)' },
            { transform: `translate(${deltaX}px, ${deltaY}px)` }
        ], {
            duration: duration,
            easing: 'linear'
        });

        animation.onfinish = () => {
            if (balloon.isConnected) {
                this.lives--;
                this.updateLives();
                balloon.remove();
            }
        };
    }

    cleanup() {
        // Clear spawn interval first
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
            this.spawnIntervalId = null;
        }
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }
        // Clear all active collision checks
        this.activeCollisionChecks.forEach(interval => clearInterval(interval));
        this.activeCollisionChecks.clear();
        if (this.isGameOver) {
            const balloons = document.querySelectorAll('.balloon');
            balloons.forEach(balloon => balloon.remove());
            const bullets = document.querySelectorAll('.bullet');
            bullets.forEach(bullet => bullet.remove());
        }
        this.activeBalloonsRects.clear();
    }

    updateBarrels() {
        // Clear existing barrels
        while (this.gun.firstChild) {
            this.gun.removeChild(this.gun.firstChild);
        }

        const bullets = parseInt(this.bulletCount.value) || 1;
        const totalSpread = 30; // 30 degree total spread
        const spreadPerBullet = totalSpread / (bullets > 1 ? bullets - 1 : 1);

        // Create new barrels
        for (let i = 0; i < bullets; i++) {
            const barrel = document.createElement('div');
            barrel.className = 'gun-barrel';
            
            // Calculate barrel position
            const angle = bullets > 1 ? spreadPerBullet * (i - (bullets-1)/2) : 0;
            const offsetX = 50 + (angle * 0.5); // Slight offset for visual appeal
            
            barrel.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            barrel.style.left = `${offsetX}%`;
            
            this.gun.appendChild(barrel);
        }
    }
}

const game = new Game();
window.addEventListener('unload', () => game.cleanup());