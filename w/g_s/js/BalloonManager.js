export class BalloonManager {
    constructor(game) {
        this.game = game;
        this.activeBalloonsRects = new Set();
        this.colors = ['#FF0000', '#FF4500', '#FFA500', '#FFD700', '#7FFF00', 
                      '#00FF00', '#00FFFF', '#0000FF', '#8A2BE2', '#FF00FF'];
        this.spawnIntervalId = null;
        this.spawnDelay = 1000;
        this.maxBalloonSize = 5;
        this.spawnBalloons();
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    spawnBalloons() {
        if (this.game.isPaused) return;
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }

        this.spawnIntervalId = setInterval(() => {
            if (this.game.isGameOver) {
                clearInterval(this.spawnIntervalId);
                return;
            }

            const currentBalloons = document.querySelectorAll('.balloon:not(.bursting)').length;
            const maxAllowed = parseInt(this.game.controls.maxBalloonsInput?.value) || 20;
            const sizeInput = parseInt(this.game.controls.balloonSize?.value) || this.maxBalloonSize;
            const sizeMultiplier = (sizeInput / this.maxBalloonSize) * 2;
            
            if (currentBalloons >= maxAllowed) return;

            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.style.backgroundColor = this.getRandomColor();
            balloon.style.setProperty('--size-multiplier', sizeMultiplier);
            balloon.style.top = '0px';
            balloon.style.left = (Math.random() * 80 + 10) + 'vw';
            
            this.game.container.appendChild(balloon);
            const balloonRect = balloon.getBoundingClientRect();
            this.activeBalloonsRects.add(balloonRect);

            this.setupBalloonBehavior(balloon);
            
        }, this.spawnDelay);
    }

    setupBalloonBehavior(balloon) {
        const speed = parseInt(this.game.controls.balloonSpeed.value) || 1;
        const duration = 6000 / speed;
        
        const gunRect = this.game.gun.element.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width/2;
        const gunCenterY = gunRect.top + gunRect.height/2;
        
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
                this.game.lives--;
                this.game.updateLives();
                balloon.remove();
            }
        };
    }

    burstBalloon(balloon) {
        const balloonRect = balloon.getBoundingClientRect();
        this.activeBalloonsRects.delete(balloonRect);
        this.createBurstParticles(balloon);
        balloon.classList.add('bursting');
        this.game.score += 1;
        document.getElementById('score').textContent = this.game.score;
        
        balloon.addEventListener('animationend', () => {
            balloon.remove();
        }, { once: true });
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

    cleanup() {
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }
        document.querySelectorAll('.balloon').forEach(balloon => balloon.remove());
    }
}
