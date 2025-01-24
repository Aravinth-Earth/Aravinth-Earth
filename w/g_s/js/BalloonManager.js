export class BalloonManager {
    constructor(game) {
        this.game = game;
        this.colors = ['#FF0000', '#FF4500', '#FFA500', '#FFD700', '#7FFF00', 
                      '#00FF00', '#00FFFF', '#0000FF', '#8A2BE2', '#FF00FF'];
        this.spawnIntervalId = null;
        this.maxBalloonSize = 5;
        this.balloonIdCounter = 0;
        this.spawnBalloons();
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
            const maxAllowed = parseInt(this.game.controls.maxBalloonsInput?.value) || 20;
            
            if (currentBalloons >= maxAllowed || this.game.isPaused || this.game.isGameOver) return;
            this.createBalloon();
        }, 1000);
    }

    getRandomBalloonPosition() {
        const edge = Math.floor(Math.random() * 3);
        const position = { x: 0, y: 0 };

        switch (edge) {
            case 0:
                position.x = Math.random() * 100;
                position.y = -10;
                break;
            case 1:
                position.x = -10;
                position.y = Math.random() * 40;
                break;
            case 2:
                position.x = 110;
                position.y = Math.random() * 40;
                break;
        }

        return position;
    }

    createBalloon() {
        const balloon = document.createElement('div');
        const balloonId = `balloon_${++this.balloonIdCounter}`;
        balloon.id = balloonId;
        balloon.className = 'balloon';
        balloon.style.backgroundColor = this.getRandomColor();
        
        const position = this.getRandomBalloonPosition();
        balloon.style.left = `${position.x}vw`;
        balloon.style.top = `${position.y}vh`;
        
        const sizeInput = parseInt(this.game.controls.balloonSize?.value) || this.maxBalloonSize;
        const sizeMultiplier = (sizeInput / this.maxBalloonSize) * 2;
        balloon.style.setProperty('--size-multiplier', sizeMultiplier);
        
        this.game.container.appendChild(balloon);
        this.setupBalloonBehavior(balloon);
        
        return balloon;
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

    cleanup() {
        if (this.spawnIntervalId) {
            clearInterval(this.spawnIntervalId);
        }
        document.querySelectorAll('.balloon').forEach(balloon => balloon.remove());
    }
}
