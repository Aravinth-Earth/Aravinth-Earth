document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('choices-visualization');
    generateVisualization(container);
});

function generateVisualization(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const branches = generateBranches();
    drawBranches(ctx, branches);
}

function generateBranches() {
    const branches = [];
    const numBranches = Math.floor(Math.random() * 5) + 5; // Random number of branches between 5 and 10

    for (let i = 0; i < numBranches; i++) {
        const branch = {
            x: Math.random() * 800,
            y: Math.random() * 400,
            length: Math.random() * 100 + 50,
            angle: Math.random() * Math.PI * 2,
            past: Math.random() < 0.5
        };
        branches.push(branch);
    }

    return branches;
}

function drawBranches(ctx, branches) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    branches.forEach(branch => {
        ctx.beginPath();
        ctx.moveTo(branch.x, branch.y);
        ctx.lineTo(
            branch.x + Math.cos(branch.angle) * branch.length,
            branch.y + Math.sin(branch.angle) * branch.length
        );
        ctx.strokeStyle = branch.past ? 'gray' : 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}
