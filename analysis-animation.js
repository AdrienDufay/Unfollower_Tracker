/**
 * ANALYSIS ANIMATION SYSTEM
 * Instagram Data Scanner - Premium Full-Screen Animation
 * Performance-optimized Canvas-based particle visualization
 */

class AnalysisAnimator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.overlay = null;
        this.animationId = null;
        this.isActive = false;
        this.isDestroying = false;

        // Animation timing
        this.startTime = 0;
        this.duration = 8000; // 8 seconds total
        this.progress = 0;

        // Particle system
        this.nodes = [];
        this.connections = [];
        this.maxNodes = window.innerWidth < 768 ? 25 : 50;
        this.unfollowerIndices = [];

        // Scanner effect
        this.scannerX = 0;
        this.scannerWidth = window.innerWidth < 768 ? 60 : 100;

        // Color palette
        this.colors = {
            node: '#ec4899',
            nodeActive: '#ff1493',
            unfollower: '#ff4d4d',
            connection: 'rgba(121, 40, 202, 0.3)',
            scanner: 'rgba(255, 0, 128, 0.8)',
            scannerGlow: 'rgba(255, 0, 128, 0.4)',
            text: '#ffffff',
            textDim: '#9ca3af'
        };

        // Mobile detection
        this.isMobile = window.innerWidth < 768;
        this.devicePixelRatio = window.devicePixelRatio || 1;

        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Initialize and show the animation overlay
     */
    init() {
        if (this.isActive) return;

        this.isActive = true;

        // Create overlay if it doesn't exist
        if (!document.getElementById('analysisOverlay')) {
            this.createOverlay();
        }

        this.overlay = document.getElementById('analysisOverlay');
        this.canvas = document.getElementById('analysisCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });

        // Set canvas to actual pixel size
        this.resizeCanvas();

        // Show overlay
        this.overlay.classList.add('active');
        this.overlay.classList.remove('fade-out');

        // Initialize particles
        this.createNodes();
        this.createConnections();

        // Randomly select ~20% as "unfollowers"
        const unfollowerCount = Math.ceil(this.nodes.length * 0.2);
        for (let i = 0; i < unfollowerCount; i++) {
            const randomIdx = Math.floor(Math.random() * this.nodes.length);
            if (!this.unfollowerIndices.includes(randomIdx)) {
                this.unfollowerIndices.push(randomIdx);
            }
        }

        // Start animation loop
        this.startTime = Date.now();
        window.addEventListener('resize', this.handleResize);
        this.animate();
    }

    /**
     * Create the overlay HTML structure
     */
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'analysisOverlay';

        const canvas = document.createElement('canvas');
        canvas.id = 'analysisCanvas';

        const status = document.createElement('div');
        status.className = 'analysis-status';
        status.innerHTML = `
            <h3>Analyzing Your Instagram Data</h3>
            <p>Scanning followers and detecting unfollowers...</p>
        `;

        overlay.appendChild(canvas);
        overlay.appendChild(status);
        document.body.appendChild(overlay);

        // Also link the CSS
        if (!document.querySelector('link[href*="analysis-animation.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/analysis-animation.css';
            document.head.appendChild(link);
        }
    }

    /**
     * Resize canvas to match window size with proper pixel ratio
     */
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Set canvas size accounting for device pixel ratio
        this.canvas.width = width * this.devicePixelRatio;
        this.canvas.height = height * this.devicePixelRatio;

        // Scale context
        this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

        // Store logical dimensions
        this.logicalWidth = width;
        this.logicalHeight = height;
    }

    /**
     * Create particle nodes representing Instagram users
     */
    createNodes() {
        this.nodes = [];
        const centerX = this.logicalWidth / 2;
        const centerY = this.logicalHeight / 2;
        const radius = Math.min(this.logicalWidth, this.logicalHeight) / 3;

        for (let i = 0; i < this.maxNodes; i++) {
            const angle = (i / this.maxNodes) * Math.PI * 2;
            const distance = radius * (0.5 + Math.random() * 0.5);

            const node = {
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: this.isMobile ? 4 : 6,
                opacity: 0.7,
                isUnfollower: false,
                pulsePhase: Math.random() * Math.PI * 2,
                targetX: centerX,
                targetY: centerY
            };

            this.nodes.push(node);
        }
    }

    /**
     * Create connections between nearby nodes
     */
    createConnections() {
        this.connections = [];
        const maxDistance = this.isMobile ? 120 : 200;

        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    this.connections.push({
                        from: i,
                        to: j,
                        distance: distance,
                        opacity: Math.max(0.1, 1 - distance / maxDistance),
                        isActive: false
                    });
                }
            }
        }
    }

    /**
     * Main animation loop using requestAnimationFrame
     */
    animate() {
        if (!this.isActive || this.isDestroying) {
            return;
        }

        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(elapsed / this.duration, 1);

        // Clear canvas
        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

        // Animation phases
        if (this.progress < 0.15) {
            // Phase 1: Initial fade-in and particle expansion
            this.updatePhase1();
        } else if (this.progress < 0.5) {
            // Phase 2: Scanner effect
            this.updatePhase2();
        } else if (this.progress < 0.8) {
            // Phase 3: Unfollower detection (disconnection)
            this.updatePhase3();
        } else {
            // Phase 4: Network collapse
            this.updatePhase4();
        }

        // Render everything
        this.drawConnections();
        this.drawNodes();
        this.drawScanner();

        this.animationId = requestAnimationFrame(this.animate);
    }

    /**
     * Phase 1: Initial fade-in and particle motion (0-15%)
     */
    updatePhase1() {
        const phaseProgress = this.progress / 0.15;

        this.nodes.forEach((node, idx) => {
            // Particles move outward initially
            node.x += node.vx * 0.3;
            node.y += node.vy * 0.3;

            // Fade in
            node.opacity = Math.min(1, phaseProgress * 1.5);

            // Pulse effect
            node.pulsePhase += 0.05;
        });
    }

    /**
     * Phase 2: Scanner bar sweeps across (15-50%)
     */
    updatePhase2() {
        const phaseProgress = (this.progress - 0.15) / 0.35;

        // Move scanner from left to right
        this.scannerX = phaseProgress * this.logicalWidth;

        // Nodes glow when scanner touches them
        this.nodes.forEach((node, idx) => {
            const distToScanner = Math.abs(node.x - this.scannerX);
            const glowDistance = 150;

            if (distToScanner < glowDistance) {
                const glowIntensity = 1 - distToScanner / glowDistance;
                node.opacity = Math.max(0.7, 0.7 + glowIntensity * 0.3);
                node.radius = this.isMobile ? 4 + glowIntensity * 2 : 6 + glowIntensity * 2;
            }

            // Gentle motion
            node.vx *= 0.98;
            node.vy *= 0.98;
            node.x += node.vx;
            node.y += node.vy;
        });
    }

    /**
     * Phase 3: Unfollowers disconnect (50-80%)
     */
    updatePhase3() {
        const phaseProgress = (this.progress - 0.5) / 0.3;

        this.nodes.forEach((node, idx) => {
            if (this.unfollowerIndices.includes(idx)) {
                node.isUnfollower = true;
            }
        });

        // Update connection opacity for unfollowers
        this.connections.forEach(conn => {
            const fromIsUnfollower = this.unfollowerIndices.includes(conn.from);
            const toIsUnfollower = this.unfollowerIndices.includes(conn.to);

            if (fromIsUnfollower || toIsUnfollower) {
                conn.opacity = Math.max(0, conn.opacity - phaseProgress * 0.5);
            }
        });

        // Nodes start moving toward center
        this.nodes.forEach((node, idx) => {
            const pullStrength = phaseProgress * 0.02;
            const dx = node.targetX - node.x;
            const dy = node.targetY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                node.x += (dx / distance) * pullStrength * distance;
                node.y += (dy / distance) * pullStrength * distance;
            }

            // Unfollowers fade red
            if (this.unfollowerIndices.includes(idx)) {
                node.opacity = Math.max(0.3, node.opacity - phaseProgress * 0.1);
            }
        });
    }

    /**
     * Phase 4: Network collapse (80-100%)
     */
    updatePhase4() {
        const phaseProgress = (this.progress - 0.8) / 0.2;

        this.nodes.forEach((node, idx) => {
            const pullStrength = 0.04 + phaseProgress * 0.02;
            const dx = node.targetX - node.x;
            const dy = node.targetY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 1) {
                node.x += (dx / distance) * pullStrength * distance;
                node.y += (dy / distance) * pullStrength * distance;
            }

            // Fade out as network collapses
            node.opacity = Math.max(0, node.opacity - phaseProgress * 0.5);
        });

        // Connections fade out
        this.connections.forEach(conn => {
            conn.opacity = Math.max(0, conn.opacity - phaseProgress * 0.3);
        });
    }

    /**
     * Draw all connections between nodes
     */
    drawConnections() {
        this.connections.forEach(conn => {
            if (conn.opacity <= 0) return;

            const fromNode = this.nodes[conn.from];
            const toNode = this.nodes[conn.to];

            // Gradient for connection line
            const gradient = this.ctx.createLinearGradient(
                fromNode.x, fromNode.y,
                toNode.x, toNode.y
            );

            if (this.unfollowerIndices.includes(conn.from) ||
                this.unfollowerIndices.includes(conn.to)) {
                gradient.addColorStop(0, `rgba(255, 77, 77, ${conn.opacity * 0.1})`);
                gradient.addColorStop(1, `rgba(255, 77, 77, ${conn.opacity * 0.1})`);
            } else {
                gradient.addColorStop(0, `rgba(121, 40, 202, ${conn.opacity * 0.2})`);
                gradient.addColorStop(1, `rgba(255, 0, 128, ${conn.opacity * 0.2})`);
            }

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
            this.ctx.stroke();
        });
    }

    /**
     * Draw all particle nodes
     */
    drawNodes() {
        this.nodes.forEach((node, idx) => {
            if (node.opacity <= 0) return;

            // Pulse effect
            const pulseAmount = Math.sin(node.pulsePhase) * 0.5 + 0.5;
            const radius = node.radius + pulseAmount * 0.5;

            // Determine node color
            let nodeColor = this.colors.node;
            if (this.unfollowerIndices.includes(idx)) {
                nodeColor = this.colors.unfollower;
            }

            // Draw outer glow
            const glowGradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, radius * 3
            );
            glowGradient.addColorStop(0, `rgba(255, 0, 128, ${node.opacity * 0.3})`);
            glowGradient.addColorStop(1, `rgba(255, 0, 128, 0)`);

            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw node circle
            this.ctx.fillStyle = nodeColor;
            this.ctx.globalAlpha = node.opacity;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw node border
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${node.opacity * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            this.ctx.globalAlpha = 1;
        });
    }

    /**
     * Draw scanner effect bar
     */
    drawScanner() {
        if (this.progress < 0.15 || this.progress > 0.5) return;

        const barHeight = this.logicalHeight;

        // Vertical glow bar
        const gradient = this.ctx.createLinearGradient(
            this.scannerX - 50, 0,
            this.scannerX + 50, 0
        );
        gradient.addColorStop(0, 'rgba(255, 0, 128, 0)');
        gradient.addColorStop(0.5, this.colors.scanner);
        gradient.addColorStop(1, 'rgba(255, 0, 128, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillRect(
            this.scannerX - this.scannerWidth / 2,
            0,
            this.scannerWidth,
            barHeight
        );

        // Bright center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.scannerX, 0);
        this.ctx.lineTo(this.scannerX, barHeight);
        this.ctx.stroke();
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.isMobile = window.innerWidth < 768;
        this.resizeCanvas();
        this.nodes.forEach(node => {
            node.targetX = this.logicalWidth / 2;
            node.targetY = this.logicalHeight / 2;
        });
    }

    /**
     * Destroy the animation and show results
     */
    destroy() {
        if (this.isDestroying) return;
        this.isDestroying = true;

        // Fade out overlay
        this.overlay.classList.add('fade-out');

        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Remove resize listener
        window.removeEventListener('resize', this.handleResize);

        // Remove overlay after fade
        setTimeout(() => {
            if (this.overlay && this.overlay.parentElement) {
                this.overlay.classList.remove('active');
            }
            this.isActive = false;
            this.isDestroying = false;
        }, 600);
    }
}

// Create global instance
let analysisAnimator = null;

/**
 * Start the analysis animation
 * Call this when analysis begins
 */
function startAnalysisAnimation() {
    if (!analysisAnimator) {
        analysisAnimator = new AnalysisAnimator();
    }
    analysisAnimator.init();
}

/**
 * Stop the analysis animation
 * Call this when analysis completes
 */
function stopAnalysisAnimation() {
    if (analysisAnimator) {
        analysisAnimator.destroy();
    }
}
