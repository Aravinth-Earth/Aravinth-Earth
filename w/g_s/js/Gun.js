export class Gun {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('gun');
        this.barrelsContainer = this.element.querySelector('.barrels-container');
        this.mouseX = 0;
        this.mouseY = 0;
        this.shootingInterval = null;
        this.lastBarrelIndex = 0;
        this.indicator = this.element.querySelector('.direction-indicator');
        this.setupMouseTracking();
        this.startAutoShooting();
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
        const gunBottomY = gunRect.bottom;
        
        // Calculate angle to cursor position
        let angle = Math.atan2(-(this.mouseY - gunBottomY), this.mouseX - gunCenterX);
        let degrees = angle * (180 / Math.PI);
        
        // Normalize to 0-360 range
        if (degrees < 0) {
            degrees += 360;
        }

        // Map the angle to 0-180 range for the upper hemisphere
        if (degrees > 180) {
            degrees = (degrees > 270) ? 0 : 180;
        }

        // Apply rotation to the indicator (remove the -90 offset and invert the angle)
        let finalRotation = -degrees+90; // Invert the angle to fix direction
        
        // Apply rotation to the indicator with translation
        requestAnimationFrame(() => {
            this.indicator.style.transform = `translateX(-50%) rotate(${finalRotation}deg)`;
        });
    }

    shoot() {
        if (this.game.isPaused) return;

        const bulletCount = parseInt(this.game.controls.bulletCount.value) || 1;
        const speed = parseInt(this.game.controls.bulletSpeed.value) || 3;
        
        // Get gun base center position
        const gunRect = this.element.getBoundingClientRect();
        const gunCenterX = gunRect.left + gunRect.width / 2;
        const gunBottomY = gunRect.bottom; // Use bottom of gun as bullet start point
        
        // Get angle to cursor
        let baseAngle = Math.atan2(-(this.mouseY - gunBottomY), this.mouseX - gunCenterX);
        baseAngle = baseAngle * (180 / Math.PI);
        
        // Normalize and clamp angle
        if (baseAngle < 0) baseAngle += 360;
        if (baseAngle > 180) baseAngle = (baseAngle > 270) ? 0 : 180;
        
        // Calculate spread for multiple bullets
        const totalSpread = 30;
        const spreadStep = bulletCount > 1 ? totalSpread / (bulletCount - 1) : 0;
        
        for (let i = 0; i < bulletCount; i++) {
            let bulletAngle = baseAngle;
            if (bulletCount > 1) {
                const spreadOffset = -totalSpread/2 + (spreadStep * i);
                bulletAngle += spreadOffset;
                bulletAngle = Math.max(0, Math.min(180, bulletAngle));
            }
            
            const radians = bulletAngle * Math.PI / 180;
            this.createAndShootBullet(gunCenterX, gunBottomY, radians, speed);
        }
    }

    createAndShootBullet(x, y, angle, speed) {
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        
        // Start bullet from gun base center
        bullet.style.left = `${x}px`;
        bullet.style.top = `${y}px`;
        
        this.game.container.appendChild(bullet);
        
        const viewportWidth = window.innerWidth * 2;
        const viewportHeight = window.innerHeight * 2;
        
        // Start animation from gun base center
        const animation = bullet.animate([
            { transform: 'translate(-50%, 0)' }, // Changed from -50% to align with bottom
            { 
                transform: `translate(
                    ${Math.cos(angle) * viewportWidth}px, 
                    ${Math.sin(-angle) * viewportHeight}px
                ) translate(-50%, 0)`
            }
        ], {
            duration: 1000 / speed,
            easing: 'linear'
        });

        animation.onfinish = () => bullet.remove();
        this.game.collisionSystem.trackBullet(bullet, angle * 180 / Math.PI, speed);
    }

    startAutoShooting() {
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }

        this.shootingInterval = setInterval(() => {
            setTimeout(() => this.shoot(), Math.random() * 50);
        }, 100);
    }

    updateBarrels() {}

    cleanup() {
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }
    }
}
