export class Controls {
    constructor(game) {
        this.game = game;
        this.bulletCount = document.getElementById('bulletCount');
        this.balloonSpeed = document.getElementById('balloonSpeed');
        this.bulletSpeed = document.getElementById('bulletSpeed');
        this.balloonSize = document.getElementById('balloonSize');
        this.maxBalloonsInput = document.getElementById('maxBalloons');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.bulletCount.addEventListener('change', () => this.game.gun.updateBarrels());
        document.getElementById('pauseButton').addEventListener('click', () => this.game.togglePause());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.game.togglePause();
            }
        });
    }
}
