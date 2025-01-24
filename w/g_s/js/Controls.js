export class Controls {
    constructor(game) {
        this.game = game;
        this.bulletCount = document.getElementById('bulletCount');
        this.balloonSpeed = document.getElementById('balloonSpeed');
        this.bulletSpeed = document.getElementById('bulletSpeed');
        this.balloonSize = document.getElementById('balloonSize');
        this.maxBalloonsInput = document.getElementById('maxBalloons');
        
        // Add sync between range and number inputs for max balloons
        const maxBalloonsRange = document.getElementById('maxBalloonsRange');
        const maxBalloonsNumber = document.getElementById('maxBalloons');
        
        maxBalloonsRange.addEventListener('input', () => {
            maxBalloonsNumber.value = maxBalloonsRange.value;
            // Trigger any existing change handlers
            maxBalloonsNumber.dispatchEvent(new Event('change'));
        });
        
        maxBalloonsNumber.addEventListener('input', () => {
            maxBalloonsRange.value = maxBalloonsNumber.value;
        });
        
        // Add balloon count display update
        setInterval(() => {
            const currentBalloons = document.querySelectorAll('.balloon:not(.bursting)').length;
            const maxBalloons = parseInt(maxBalloonsNumber.value);
            const label = maxBalloonsNumber.closest('label');
            label.setAttribute('data-current', `Active: ${currentBalloons}/${maxBalloons}`);
        }, 100);
        
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
