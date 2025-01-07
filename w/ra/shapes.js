class ShapeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.shapes = new Set();
        this.lastUpdate = Date.now();
    }

    create(count) {
        for (let i = 0; i < count; i++) {
            const shape = new Shape(this);
            this.shapes.add(shape);
            this.canvas.appendChild(shape.element);
        }
    }

    update() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdate;
        this.lastUpdate = currentTime;

        this.shapes.forEach(shape => {
            if (shape.shouldRemove()) {
                this.canvas.removeChild(shape.element);
                this.shapes.delete(shape);
            }
        });

        if (this.shapes.size < this.getMaxShapes() && 
            Math.random() < ART_CONFIG.lifecycle.probability.spawn) {
            this.create(1);
        }

        this.shapes.forEach(shape => {
            shape.update(deltaTime);
        });
    }

    getMaxShapes() {
        return Math.floor(ART_CONFIG.canvas.shapeCount * 
               (ART_CONFIG.lifecycle.maxShapesPercent / 100));
    }

    clear() {
        this.shapes.forEach(shape => {
            if (shape.element.parentNode) {
                this.canvas.removeChild(shape.element);
            }
        });
        this.shapes.clear();
    }
}

class Shape {
    constructor(shapeManager) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 
            Math.random() < ART_CONFIG.canvas.shape.circleChance ? 'circle' : 'polygon');
        this.shapeManager = shapeManager;
        this.gradientId = null;
        this.init();
        this.outOfViewSince = null;
        this.fadeStart = null;
    }

    init() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = MathUtils.random(ART_CONFIG.canvas.size.min, ART_CONFIG.canvas.size.max);
        
        const speed = MathUtils.random(ART_CONFIG.motion.speed.min, ART_CONFIG.motion.speed.max);
        const angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;

        this.setupShape(ColorGenerator.generate());
    }

    setupShape(color) {
        if (this.element.tagName === 'circle') {
            this.element.setAttribute('r', this.size);
            this.element.setAttribute('cx', this.x);
            this.element.setAttribute('cy', this.y);
        } else {
            this.element.setAttribute('points', this.generatePolygonPoints());
        }

        this.element.setAttribute('fill', color);
    }

    generatePolygonPoints() {
        const sides = MathUtils.randomInt(
            ART_CONFIG.canvas.shape.polygon.sides.min,
            ART_CONFIG.canvas.shape.polygon.sides.max
        );
        return Array.from({length: sides}, (_, i) => {
            const angle = (i / sides) * Math.PI * 2;
            const px = this.x + Math.cos(angle) * this.size;
            const py = this.y + Math.sin(angle) * this.size;
            return `${px},${py}`;
        }).join(' ');
    }

    update(deltaTime) {
        this.updateMovement(deltaTime);
        this.updatePosition();
        this.updateVisibility();
        this.updateShape();
    }

    updateMovement(deltaTime) {
        const randomAngle = Math.random() * Math.PI * 2;
        this.dx += Math.cos(randomAngle) * ART_CONFIG.motion.randomness;
        this.dy += Math.sin(randomAngle) * ART_CONFIG.motion.randomness;
        
        // Apply speed limits
        const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        if (speed > ART_CONFIG.motion.speed.max) {
            this.dx = (this.dx / speed) * ART_CONFIG.motion.speed.max;
            this.dy = (this.dy / speed) * ART_CONFIG.motion.speed.max;
        }
    }

    updatePosition() {
        this.x = (this.x + this.dx + window.innerWidth) % window.innerWidth;
        this.y = (this.y + this.dy + window.innerHeight) % window.innerHeight;
    }

    updateVisibility() {
        if (!this.isInViewport()) {
            if (!this.outOfViewSince) {
                this.outOfViewSince = Date.now();
            }
        } else {
            this.outOfViewSince = null;
        }
    }

    updateShape() {
        if (this.element.tagName === 'circle') {
            this.element.setAttribute('cx', this.x);
            this.element.setAttribute('cy', this.y);
        } else {
            this.element.setAttribute('points', this.generatePolygonPoints());
        }
    }

    isInViewport() {
        const margin = this.size;
        return this.x >= -margin &&
               this.x <= window.innerWidth + margin &&
               this.y >= -margin &&
               this.y <= window.innerHeight + margin;
    }

    shouldRemove() {
        return (this.outOfViewSince && 
                Date.now() - this.outOfViewSince > ART_CONFIG.lifecycle.timing.maxOutsideTime) ||
               (this.fadeStart && 
                Date.now() - this.fadeStart > ART_CONFIG.lifecycle.timing.fadeOutDuration);
    }
}
