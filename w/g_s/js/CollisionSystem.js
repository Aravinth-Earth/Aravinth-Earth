export class CollisionSystem {
    constructor(game) {
        this.game = game;
        this.activeCollisionChecks = new Set();
    }

    trackBulletPosition(bullet, animation, angle, speed) {
        if (this.game.isPaused) {
            bullet.remove();
            return;
        }

        const startTime = performance.now();
        const checkCollision = setInterval(() => {
            if (!bullet.isConnected || this.game.isPaused) {
                clearInterval(checkCollision);
                this.activeCollisionChecks.delete(checkCollision);
                return;
            }

            const elapsedTime = performance.now() - startTime;
            const distance = (elapsedTime / 1000) * (speed * 200);
            
            const radianAngle = angle * Math.PI / 180;
            const currentX = parseFloat(bullet.dataset.startX) + Math.cos(radianAngle) * distance;
            const currentY = parseFloat(bullet.dataset.startY) + Math.sin(radianAngle) * distance;
            
            bullet.style.left = `${currentX}px`;
            bullet.style.top = `${currentY}px`;
        }, 16);
        
        this.activeCollisionChecks.add(checkCollision);
    }

    isColliding(bulletRect, balloonRect) {
        const bulletCenter = {
            x: bulletRect.left + bulletRect.width/2,
            y: bulletRect.top + bulletRect.height/2
        };
        
        const balloonCenter = {
            x: balloonRect.left + balloonRect.width/2,
            y: balloonRect.top + balloonRect.height/2
        };

        const distance = Math.sqrt(
            Math.pow(bulletCenter.x - balloonCenter.x, 2) + 
            Math.pow(bulletCenter.y - balloonCenter.y, 2)
        );

        return distance <= balloonRect.width/2;
    }

    cleanup() {
        this.activeCollisionChecks.forEach(interval => clearInterval(interval));
        this.activeCollisionChecks.clear();
    }
}
