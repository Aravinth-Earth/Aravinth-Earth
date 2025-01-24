export class CollisionSystem {
    constructor(game) {
        this.game = game;
        this.activeCollisionChecks = new Set();
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
                    this.game.balloonManager.burstBalloon(balloon);
                    bullet.remove();
                    clearInterval(checkCollision);
                }
            });
        }, 16);
        
        this.activeCollisionChecks.add(checkCollision);
    }

    detectCollisions(bullet) {
        // ...existing code...
    }

    isColliding(bulletRect, balloonRect) {
        const sizeInput = parseInt(this.game.controls.balloonSize?.value) || this.game.balloonManager.maxBalloonSize;
        const sizeMultiplier = (sizeInput / this.game.balloonManager.maxBalloonSize) * 2;
        const baseSize = 40;
        const actualBalloonRadius = (baseSize * sizeMultiplier) / 2;

        const bulletCenterX = bulletRect.left + bulletRect.width/2;
        const bulletCenterY = bulletRect.top + bulletRect.height/2;
        const balloonCenterX = balloonRect.left + balloonRect.width/2;
        const balloonCenterY = balloonRect.top + balloonRect.height/2;

        const dx = bulletCenterX - balloonCenterX;
        const dy = bulletCenterY - balloonCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (3 + actualBalloonRadius);
    }

    cleanup() {
        this.activeCollisionChecks.forEach(interval => clearInterval(interval));
        this.activeCollisionChecks.clear();
        document.querySelectorAll('.bullet').forEach(bullet => bullet.remove());
    }
}
