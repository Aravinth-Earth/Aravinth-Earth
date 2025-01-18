document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('choices-visualization');
    const ageInput = document.getElementById('age-input');
    const metaSummary = document.getElementById('meta-summary');
    
    // Create canvas once at initialization
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Add utility functions inside the scope
    function countPastDecisions(branches) {
        return branches.filter(b => b.past).length - 1;
    }

    function countFuturePaths(branches) {
        return branches.filter(b => !b.past).length;
    }

    function updateVisualization() {
        const age = parseInt(ageInput.value);
        
        // Update canvas dimensions
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const branches = generateBranches(canvas.width, canvas.height, age);
        const pastDecisions = countPastDecisions(branches);
        const futurePaths = countFuturePaths(branches);
        
        metaSummary.textContent = `At age ${age}, you have ${futurePaths} possible future paths. ${pastDecisions} major decisions were made in the past.`;
        
        drawBranches(ctx, branches);
    }

    function generateBranches(width, height, age) {
        const startX = 50;
        const startY = height / 2;
        const branches = [];
        const straightLength = width * 0.15;
        const midpointX = width * 0.5;  // Today's position
        
        // Generate past branches from birth
        const pastBranchCount = Math.floor(Math.random() * 3) + 3; // 3-5 initial paths
        for(let i = 0; i < pastBranchCount; i++) {
            const isMainPath = i === Math.floor(pastBranchCount / 2); // Middle path is the main one
            const initialAngle = (Math.random() * 0.6 - 0.3) + (i - pastBranchCount/2) * 0.2;
            
            let currentX = startX;
            let currentY = startY;
            let currentAngle = initialAngle;
            
            // Create segments to reach today's line
            const segments = Math.floor((midpointX - startX) / straightLength);
            for(let j = 0; j < segments; j++) {
                const segment = {
                    x: currentX,
                    y: currentY,
                    length: straightLength,
                    angle: currentAngle,
                    past: true,
                    active: isMainPath // Only main path is active
                };
                branches.push(segment);
                
                // Update position for next segment
                currentX += Math.cos(currentAngle) * straightLength;
                currentY += Math.sin(currentAngle) * straightLength;
                
                // Slightly adjust angle for natural curve
                if (!isMainPath && j < segments - 1) {
                    currentAngle += (Math.random() * 0.4 - 0.2);
                }
            }
        }
        
        // Generate future branches from today's position
        const futureDepth = Math.min(Math.floor(age / 5) + 2, 5);
        branches.push(...generateBranchStructure(
            midpointX,
            startY,
            0,
            straightLength * 0.8,
            futureDepth,
            false,
            1
        ));

        return branches;
    }

    // Initialize visualization
    window.addEventListener('resize', updateVisualization);
    updateVisualization();

    // Update on age change
    ageInput.addEventListener('change', updateVisualization);
    ageInput.addEventListener('input', updateVisualization);
});

function generateBranchStructure(x, y, angle, length, depth, isPast, direction) {
    const branches = [];
    
    // Add current branch
    branches.push({
        x: x,
        y: y,
        length: length,
        angle: angle,
        past: isPast
    });

    if (depth <= 0) return branches;

    const isStraight = Math.random() < 0.3; // Reduce probability of straight segments
    
    if (isPast && isStraight) {
        const newX = x + Math.cos(angle) * length;
        const newY = y + Math.sin(angle) * length;
        branches.push(...generateBranchStructure(
            newX, newY, angle, length, depth - 1, true, direction
        ));
    } else {
        const numBranches = isPast ? 1 : Math.floor(Math.random() * 3) + 2;
        const spread = Math.PI / 2.5; // Wider spread angle
        
        for (let i = 0; i < numBranches; i++) {
            const newLength = length * 0.85;
            let newAngle;
            
            if (isPast) {
                newAngle = angle + (Math.random() * 0.4 - 0.2);
            } else {
                newAngle = angle + (-spread/2 + (i * spread/(numBranches-1)));
                newAngle += (Math.random() * 0.3 - 0.15);
            }

            const newX = x + Math.cos(angle) * length;
            const newY = y + Math.sin(angle) * length;
            
            branches.push(...generateBranchStructure(
                newX, newY, newAngle, newLength, depth - 1, 
                isPast && i === 0, direction
            ));
        }
    }

    return branches;
}

function drawBranches(ctx, branches) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw section labels
    drawSectionLabels(ctx);

    // Draw non-past branches first
    branches.forEach(branch => {
        if (!branch.past) {
            drawBranch(ctx, branch, false);
        }
    });

    // Draw past branches on top
    branches.forEach(branch => {
        if (branch.past) {
            drawBranch(ctx, branch, true);
        }
    });
}

function drawSectionLabels(ctx) {
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    
    // Section labels
    ctx.fillText('The Past', ctx.canvas.width * 0.25, 30);
    ctx.fillText('Today', ctx.canvas.width * 0.5, 30);
    ctx.fillText('The Future', ctx.canvas.width * 0.75, 30);
    
    // Birth point label
    ctx.fillText("You're born", 50, ctx.canvas.height / 2 - 20);
    
    // Draw vertical lines for sections
    ctx.strokeStyle = 'rgba(102, 102, 102, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width * 0.5, 40);
    ctx.lineTo(ctx.canvas.width * 0.5, ctx.canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBranch(ctx, branch, isPast) {
    ctx.beginPath();
    ctx.moveTo(branch.x, branch.y);
    const endX = branch.x + Math.cos(branch.angle) * branch.length;
    const endY = branch.y + Math.sin(branch.angle) * branch.length;
    ctx.lineTo(endX, endY);
    
    if (isPast) {
        if (branch.active) {
            ctx.strokeStyle = '#888'; // Active past path
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#444'; // Inactive past paths
            ctx.lineWidth = 1.5;
        }
    } else {
        ctx.strokeStyle = 'rgba(40, 167, 69, 0.6)'; // Future paths
        ctx.lineWidth = 1.5;
    }
    ctx.stroke();
    
    // Add glow effect for future and active past paths
    if (!isPast || branch.active) {
        ctx.strokeStyle = isPast ? 'rgba(136, 136, 136, 0.2)' : 'rgba(40, 167, 69, 0.2)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}
