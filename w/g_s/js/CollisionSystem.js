export class CollisionSystem {
    constructor(game) {
        this.game = game;
        this.bullets = new Set();
        this.updateInterval = null;
        this.startUpdate();
    }

    startUpdate() {
        this.updateInterval = setInterval(() => this.checkCollisions(), 16);
    }

    trackBullet(bullet, angle, speed) {
        this.bullets.add({
            element: bullet,
            angle: angle,
            speed: speed,
            time: 0
        });
    }

    checkCollisions() {
        if (this.game.isPaused) return;

        const gunRect = this.game.gun.element.getBoundingClientRect();
        const balloons = document.querySelectorAll('.balloon:not(.bursting)');

        // Check balloon-gun collisions
        balloons.forEach(balloon => {
            const balloonRect = balloon.getBoundingClientRect();
            if (this.isColliding(balloonRect, gunRect)) {
                balloon.remove();
                this.game.lives--;
                this.game.updateLives();
            }
        });

        // Check bullet-balloon collisions
        this.bullets.forEach(bullet => {
            if (!bullet.element.isConnected) {
                this.bullets.delete(bullet);
                return;
            }

            const bulletRect = bullet.element.getBoundingClientRect();
            balloons.forEach(balloon => {
                const balloonRect = balloon.getBoundingClientRect();
                if (this.isColliding(bulletRect, balloonRect)) {
                    this.game.balloonManager.burstBalloon(balloon);
                    bullet.element.remove();
                    this.bullets.delete(bullet);
                }
            });
        });
    }

    isColliding(rect1, rect2) {
        const center1 = {
            x: rect1.left + rect1.width/2,
            y: rect1.top + rect1.height/2
        };
        
        const center2 = {
            x: rect2.left + rect2.width/2,
            y: rect2.top + rect2.height/2
        };

        const distance = Math.sqrt(
            Math.pow(center1.x - center2.x, 2) + 
            Math.pow(center1.y - center2.y, 2)
        );

        return distance < (rect1.width/2 + rect2.width/2);
    }

    cleanup() {
        clearInterval(this.updateInterval);
        this.bullets.clear();
    }
}
