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
        this.MIN_ANIMATION_DURATION = 6000; // 6s premium cinematic (90% pre-explosion)
        this.duration = 9000; // Total incl. explosion (updated for 6s base)
        this.progress = 0;
        this.visualProgress = 0;
        this.dataReady = false; // NEW: Wait for data processing completion

        // Particle system
        this.nodes = [];
        this.connections = [];
        this.maxNodes = window.innerWidth < 768 ? 25 : 50;
        this.unfollowerIndices = [];

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

        // ── Explosion state ──────────────────────────────────────
        this.explosionTriggered  = false;
        this.explosionStartTime  = null;
        this.explosionDuration   = 1800; // ms the explosion runs
        this.explosionParticles  = [];
        this.shockwaves          = [];
        this.centralFlashOpacity = 0;
        // ─────────────────────────────────────────────────────────

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

        // Reset explosion state for re-use
        this.explosionTriggered  = false;
        this.explosionStartTime  = null;
        this.explosionParticles  = [];
        this.shockwaves          = [];
        this.centralFlashOpacity = 0;

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
        
        // NEW: visualProgress = 0→1 over exactly 5s minimum (decoupled from data speed)
        this.visualProgress = Math.min(elapsed / this.MIN_ANIMATION_DURATION, 1);
        // Legacy progress for explosion timing
        this.progress = Math.min(elapsed / this.duration, 1);

        // ── Auto-destroy after explosion finishes ────────────────
        if (this.explosionTriggered && this.explosionStartTime) {
            const expElapsed = Date.now() - this.explosionStartTime;
            if (expElapsed >= this.explosionDuration) {
                this.destroy();
                return;
            }
        }
        // ─────────────────────────────────────────────────────────

        // Clear canvas – stronger fade during explosion for contrast
        const trailAlpha = this.explosionTriggered ? 0.18 : 0.1;
        this.ctx.fillStyle = `rgba(5, 5, 5, ${trailAlpha})`;
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

        // NEW: Phases based on visualProgress (5s timeline)
        if (this.visualProgress < 0.4) {
            this.updatePhase1();
        } else if (this.visualProgress < 0.7) {
            this.updatePhase2();
        } else if (this.visualProgress < 0.9) {
            this.updatePhase3();
        } else {
            // Phase 4: LOCKED until visualProgress≥0.9 (4.5s) AND dataReady
            if (this.visualProgress >= 0.9 && this.dataReady) {
                this.updatePhase4();
            } else {
                // Continue Phase 3 visual effects during lock
                this.updatePhase3();
            }
        }

        // Render base network
        this.drawConnections();
        this.drawNodes();
        this.drawScanner();

        // ── Explosion rendering (on top of everything) ───────────
        if (this.explosionTriggered) {
            this.updateExplosion();
            this.drawExplosion();
        }
        // ─────────────────────────────────────────────────────────

        this.animationId = requestAnimationFrame(this.animate);
    }

    /**
     * Phase 1: Initial fade-in and particle motion (0-15%)
     */
    updatePhase1() {
        // Phase 1: 0-40% visualProgress (0-2s)
        const phaseProgress = this.visualProgress / 0.4;

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
     * Phase 2: Scanner bar sweeps across (40-70%)
     * Particle glow intensifies as scanner passes through
     */
    updatePhase2() {
        // Phase 2: 40-70% visualProgress (2-3.5s)
        const phaseStart = 0.4;
        const phaseEnd = 0.7;
        const phaseProgress = (this.visualProgress - phaseStart) / (phaseEnd - phaseStart);

        // Scanner position (used in drawScanner for glow calculation)
        const scannerWidth = this.isMobile ? 60 : 100;
        const scannerX = phaseProgress * (this.logicalWidth + scannerWidth * 2) - scannerWidth;

        // Nodes glow when scanner touches them
        this.nodes.forEach((node, idx) => {
            const distToScanner = Math.abs(node.x - scannerX);
            const glowDistance = 150;

            if (distToScanner < glowDistance) {
                const glowIntensity = 1 - distToScanner / glowDistance;
                node.opacity = Math.max(0.7, 0.7 + glowIntensity * 0.3);
                node.radius = this.isMobile ? 4 + glowIntensity * 2 : 6 + glowIntensity * 2;
            }

            // Gentle motion damping
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
        // Phase 3: 70-90% visualProgress (3.5-4.5s)  
        const phaseStart = 0.7;
        const phaseProgress = (this.visualProgress - phaseStart) / 0.2;

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
     * Phase 4: Network collapse (80-100%) — culminates in supernova explosion
     */
    updatePhase4() {
        // Phase 4: Magnetic convergence with Exponential In easing
        const phaseStart = 0.9;
        const t = Math.min((this.visualProgress - phaseStart) / 0.1, 1); // 0-1 over final 10%
        const easeExpoIn = 1 - Math.pow(1 - t, 3); // Accelerates toward center (black hole suck)
        
        this.nodes.forEach((node) => {
            const pullStrength = 0.08 + easeExpoIn * 0.12; // Stronger + accelerating
            const dx = node.targetX - node.x;
            const dy = node.targetY - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.5) {
                node.x += (dx / distance) * pullStrength * distance * 1.8; // Increased velocity
                node.y += (dy / distance) * pullStrength * distance * 1.8;
            }

            // Rapid fade as sucked in
            node.opacity = Math.max(0, node.opacity - easeExpoIn * 0.6);
            node.radius *= (1 - easeExpoIn * 0.3); // Shrink effect
        });

        // Connections collapse fast
        this.connections.forEach(conn => {
            conn.opacity = Math.max(0, conn.opacity - easeExpoIn * 0.5);
        });

        // ── Trigger explosion at end of convergence ────
        if (!this.explosionTriggered && easeExpoIn >= 0.9) {
            this.triggerExplosion();
        }
        // ────────────────────────────────────────────────
    }

    // ═══════════════════════════════════════════════════════════
    //  PHASE 5 — SUPERNOVA EXPLOSION
    // ═══════════════════════════════════════════════════════════

    /**
     * Spawn all explosion particles + shockwave rings from the center point
     */
    triggerExplosion() {
        if (this.explosionTriggered) return;
        this.explosionTriggered = true;
        this.explosionStartTime = Date.now();

        // NEW: Trigger results reveal animation coordinated with explosion
        const resultsContainer = document.getElementById('resultsDisplay');
        if (resultsContainer) {
            resultsContainer.style.opacity = '0';
            resultsContainer.style.transform = 'scale(0.96)';
            resultsContainer.style.transition = 'opacity 800ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            // Pop in after explosion starts
            setTimeout(() => {
                resultsContainer.style.opacity = '1';
                resultsContainer.style.transform = 'scale(1)';
            }, 200);
        }

        const cx = this.logicalWidth  / 2;
        const cy = this.logicalHeight / 2;

        // NEW: Optimized particle count per spec
        const count = this.isMobile ? 70 : 150;

        // Warm palette: deep red → hot pink → pale rose → orange-red
        const palette = [
            '#ff1744', '#ff4569', '#ff0066', '#ff4d4d',
            '#ff6b9d', '#ff3864', '#ff80ab', '#ff6e40'
        ];

        for (let i = 0; i < count; i++) {
            // Spread angle with a tiny jitter for natural look
            const angle  = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            // Speed varies: most mid-range, a few very fast streaks
            const speed  = 1.5 + Math.pow(Math.random(), 0.6) * (this.isMobile ? 7 : 10);
            const size   = 1.5 + Math.random() * (this.isMobile ? 3 : 4.5);
            const color  = palette[Math.floor(Math.random() * palette.length)];
            // Faster particles fade faster → streaking effect
            const decay  = 0.008 + (speed / 10) * 0.012 + Math.random() * 0.006;

            this.explosionParticles.push({
                x:     cx,
                y:     cy,
                vx:    Math.cos(angle) * speed,
                vy:    Math.sin(angle) * speed,
                opacity: 1,
                size,
                color,
                decay,
                // NEW: Consistent friction + horizontal drift for natural arc
                drag:  0.96,
                drift: (Math.random() - 0.5) * 0.3 // Slight horizontal curve
            });
        }

        // Two concentric shockwave rings
        const maxR = Math.min(this.logicalWidth, this.logicalHeight) * 0.55;
        this.shockwaves = [
            { radius: 0, maxRadius: maxR,        opacity: 1,   speed: maxR / 28 },
            { radius: 0, maxRadius: maxR * 0.65, opacity: 0.7, speed: maxR / 20 }
        ];

        // NEW: Intense central flash - 40% canvas whiteout
        this.centralFlashOpacity = 2.0; // Double intensity
    }

    /**
     * Tick all explosion particles + shockwaves each frame
     */
    updateExplosion() {
        // Particles w/ friction + drift
        this.explosionParticles.forEach(p => {
            // NEW: Drift creates natural arc trajectories
            p.vx += p.drift * 0.02; // Micro horizontal corrections
            p.vy += Math.sin(p.vx * 0.01) * 0.1; // Subtle vertical wave
            
            p.x  += p.vx;
            p.y  += p.vy;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.opacity = Math.max(0, p.opacity - p.decay);
        });

        // Shockwaves w/ taper + blur effect
        this.shockwaves.forEach((sw, i) => {
            sw.radius += sw.speed;
            sw.opacity = Math.max(0, sw.opacity - 0.032);
            // Tapered expansion (slows naturally)
            sw.speed *= 0.995;
        });

        // Central flash - aggressive decay for punch
        this.centralFlashOpacity = Math.max(0, this.centralFlashOpacity - 0.065);
    }

    /**
     * Render the explosion on top of the network layer
     */
    drawExplosion() {
        const cx = this.logicalWidth  / 2;
        const cy = this.logicalHeight / 2;
        const ctx = this.ctx;

        ctx.save();

        // ── Central flash ────────────────────────────────────────
        if (this.centralFlashOpacity > 0) {
            const flashSize = this.isMobile ? 80 : 130;
            const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashSize);
            flash.addColorStop(0,   `rgba(255, 255, 255, ${this.centralFlashOpacity})`);
            flash.addColorStop(0.2, `rgba(255, 80,  128, ${this.centralFlashOpacity * 0.8})`);
            flash.addColorStop(0.6, `rgba(255, 0,   80,  ${this.centralFlashOpacity * 0.3})`);
            flash.addColorStop(1,   'rgba(255, 0, 80, 0)');
            ctx.fillStyle = flash;
            ctx.beginPath();
            ctx.arc(cx, cy, flashSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Shockwave rings ──────────────────────────────────────
        this.shockwaves.forEach(sw => {
            if (sw.opacity <= 0 || sw.radius <= 0) return;
            ctx.strokeStyle = `rgba(255, 60, 120, ${sw.opacity * 0.6})`;
            ctx.lineWidth   = 2.5;
            ctx.shadowColor = 'rgba(255, 0, 80, 0.8)';
            ctx.shadowBlur  = 12;
            ctx.globalAlpha = sw.opacity;
            ctx.beginPath();
            ctx.arc(cx, cy, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;

        // ── Explosion particles ──────────────────────────────────
        this.explosionParticles.forEach(p => {
            if (p.opacity <= 0) return;

            ctx.globalAlpha = p.opacity;

            // Outer glow halo
            const haloR  = p.size * 4;
            const halo   = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
            halo.addColorStop(0,   `rgba(255, 60, 100, ${p.opacity * 0.55})`);
            halo.addColorStop(1,   'rgba(255, 0,  80,  0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
            ctx.fill();

            // Solid core dot
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur  = p.size * 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════

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
     * Draw scanner effect bar - ORIGINAL DESIGN RESTORED
     */
    drawScanner() {
        // Phase 2: visualProgress 0.4 → 0.7 (duration: 1.5 seconds)
        const phaseStart = 0.4;
        const phaseEnd = 0.7;

        if (this.visualProgress < phaseStart || this.visualProgress > phaseEnd) {
            return;
        }

        // Normalize to 0-1 within phase
        const phaseProgress = (this.visualProgress - phaseStart) / (phaseEnd - phaseStart);
        
        // Position: start off-screen left, end off-screen right
        const scannerWidth = this.isMobile ? 60 : 100;
        const scannerX = phaseProgress * (this.logicalWidth + scannerWidth * 2) - scannerWidth;
        
        const barHeight = this.logicalHeight;

        // Original simple gradient (no color changes)
        const gradient = this.ctx.createLinearGradient(
            scannerX - 50, 0,
            scannerX + 50, 0
        );
        gradient.addColorStop(0, 'rgba(255, 0, 128, 0)');
        gradient.addColorStop(0.5, this.colors.scanner);
        gradient.addColorStop(1, 'rgba(255, 0, 128, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillRect(
            scannerX - scannerWidth / 2,
            0,
            scannerWidth,
            barHeight
        );

        // Original bright center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(scannerX, 0);
        this.ctx.lineTo(scannerX, barHeight);
        this.ctx.stroke();
    }

    /**
     * NEW: Public method - Called when ZIP analysis completes (data ready)
     * Unlocks Phase 4 even if already at visualProgress≥0.9
     */
    setDataReady() {
        this.dataReady = true;
        // Immediately trigger Phase 4 if timing aligns
        if (this.visualProgress >= 0.9) {
            this.updatePhase4();
        }
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