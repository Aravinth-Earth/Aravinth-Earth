export class Gun {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('gun');
        this.mouseX = 0;
        this.mouseY = 0;
        this.shootingInterval = null;
        this.setupMouseTracking();
        this.startAutoShooting();
        this.updateBarrels();
    }

    setupMouseTracking() {
        this.game.container.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.rotateGun();
        });
    }

    rotateGun() {
        const gunRect = this.element.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width / 2;
        const gunCenterY = gunRect.top + gunRect.height / 2;
        
        const angle = Math.atan2(this.mouseY - gunCenterY, this.mouseX - gunCenterX);
        const degrees = angle * (180 / Math.PI);

        this.element.querySelectorAll('.gun-barrel').forEach(barrel => {
            const currentRotation = barrel.style.transform.match(/-?\d+/);
            const barrelAngle = currentRotation ? parseInt(currentRotation[0]) : 0;
            barrel.style.transform = `translateX(-50%) rotate(${degrees - 90 + barrelAngle}deg)`;
        });
    }

    shoot() {
        if (this.game.isPaused) return;
        const bullets = parseInt(this.game.controls.bulletCount.value) || 1;
        const gunRect = this.element.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width / 2;
        const gunCenterY = gunRect.top + gunRect.height / 2;
        const angle = Math.atan2(this.mouseY - gunCenterY, this.mouseX - gunCenterX);
        
        const totalSpread = 30;
        const spreadPerBullet = totalSpread / (bullets > 1 ? bullets - 1 : 1);
        const speed = parseInt(this.game.controls.bulletSpeed.value) || 3;
        const duration = 3000 / speed;
        
        for(let i = 0; i < bullets; i++) {
            const bullet = document.createElement('div');
            bullet.className = 'bullet';
            bullet.style.left = (this.element.offsetLeft + this.element.offsetWidth/2) + 'px';
            bullet.style.bottom = '50px';
            
            const randomSpread = (Math.random() - 0.5) * 2;
            const bulletAngle = angle * (180 / Math.PI) + 
                              (bullets > 1 ? spreadPerBullet * (i - (bullets-1)/2) : 0) +
                              randomSpread;
            
            bullet.dataset.angle = bulletAngle;
            bullet.dataset.startX = gunCenterX;
            bullet.dataset.startY = gunCenterY;
            bullet.dataset.speed = speed;
            
            const distance = window.innerHeight * 1.5;
            this.game.container.appendChild(bullet);
            
            const animation = bullet.animate([
                { transform: 'translate(-50%, 0)' },
                { transform: `translate(${Math.cos(bulletAngle * Math.PI/180) * distance}px, 
                            ${Math.sin(bulletAngle * Math.PI/180) * distance}px)` }
            ], {
                duration: duration,
                easing: 'linear'
            });

            animation.onfinish = () => bullet.remove();
            
            this.game.collisionSystem.trackBulletPosition(bullet, animation, bulletAngle, speed);
        }
    }

    startAutoShooting() {
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }

        this.shootingInterval = setInterval(() => {
            setTimeout(() => this.shoot(), Math.random() * 50);
        }, 100);
    }

    updateBarrels() {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        const bullets = parseInt(this.game.controls.bulletCount.value) || 1;
        const totalSpread = 30;
        const spreadPerBullet = totalSpread / (bullets > 1 ? bullets - 1 : 1);

        for (let i = 0; i < bullets; i++) {
            const barrel = document.createElement('div');
            barrel.className = 'gun-barrel';
            const angle = bullets > 1 ? spreadPerBullet * (i - (bullets-1)/2) : 0;
            const offsetX = 50 + (angle * 0.5);
            barrel.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            barrel.style.left = `${offsetX}%`;
            this.element.appendChild(barrel);
        }
    }

    cleanup() {
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }
    }
}
