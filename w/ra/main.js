class ArtGenerator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.shapeManager = new ShapeManager(this.canvas);
        this.setupResizeHandler();
        this.setupCleanup();
        this.quoteManager = new QuoteManager();
    }

    setupResizeHandler() {
        const resizeCanvas = () => {
            this.canvas.setAttribute('width', window.innerWidth);
            this.canvas.setAttribute('height', window.innerHeight);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
        resizeCanvas();
    }

    start() {
        this.shapeManager.create(Math.floor(this.shapeManager.getMaxShapes() / 2));
        this.animate();
        this.quoteManager.start();
    }

    animate = () => {
        this.shapeManager.update();
        requestAnimationFrame(this.animate);
    }

    setupCleanup() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    cleanup() {
        this.shapeManager.clear();
        const defs = document.querySelector('defs');
        while (defs.firstChild) {
            defs.removeChild(defs.firstChild);
        }
    }
}

// Show loading message
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 1500);
});

const artGenerator = new ArtGenerator();
artGenerator.start();
