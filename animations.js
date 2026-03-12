/* ============================================
   ANIMATION UTILITIES & SCROLL TRIGGERS
   Mobile-first JavaScript animation system
   ============================================ */

class AnimationManager {
    constructor() {
        this.observer = this.createIntersectionObserver();
        this.init();
    }

    /**
     * Intersection Observer for scroll reveal animations
     */
    createIntersectionObserver() {
        return new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    entry.target.classList.add('in-view');
                    
                    // Unobserve after animation completes
                    if (entry.target.hasAttribute('data-observe-once')) {
                        setTimeout(() => {
                            this.observer.unobserve(entry.target);
                        }, 1000);
                    }
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    /**
     * Initialize animation system
     */
    init() {
        this.observeScrollElements();
        this.setupTapFeedback();
        this.setupButtonAnimations();
        this.setupParallax();
        this.reduceMotionCheck();
    }

    /**
     * Observe elements for scroll reveal
     */
    observeScrollElements() {
        const elements = document.querySelectorAll(
            '[data-animate], .reveal-up, .reveal-left, .reveal-right, .stagger-reveal > *'
        );
        
        elements.forEach((el) => {
            el.style.animationPlayState = 'paused';
            this.observer.observe(el);
        });
    }

    /**
     * Tap feedback for buttons
     */
    setupTapFeedback() {
        const buttons = document.querySelectorAll('button, [role="button"]');
        
        buttons.forEach((btn) => {
            btn.addEventListener('touchstart', (e) => {
                btn.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('touchend', () => {
                btn.style.transform = '';
            });
            
            btn.addEventListener('click', () => {
                this.createRipple(btn, event);
            });
        });
    }

    /**
     * Create ripple effect on button click
     */
    createRipple(button, event) {
        if (!button.classList.contains('btn-ripple')) return;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        button.style.position = 'relative';
    }

    /**
     * Button animations
     */
    setupButtonAnimations() {
        const buttons = document.querySelectorAll('button, [role="button"]');
        
        buttons.forEach((btn) => {
            btn.addEventListener('mouseenter', () => {
                if (window.matchMedia('(hover: hover)').matches) {
                    btn.style.transform = 'translateY(-2px)';
                    if (btn.classList.contains('btn-glow')) {
                        btn.style.boxShadow = '0 20px 40px rgba(255, 0, 128, 0.3)';
                    }
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.boxShadow = '';
            });
        });
    }

    /**
     * Parallax scroll effect for hero section
     */
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-slow');
        
        if (parallaxElements.length === 0) return;
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach((el) => {
                const speed = el.dataset.speed || 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }, { passive: true });
    }

    /**
     * Check for prefers-reduced-motion preference
     */
    reduceMotionCheck() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--duration-fast', '0.01ms');
            document.documentElement.style.setProperty('--duration-normal', '0.01ms');
        }
    }
}

/**
 * SCANNER ANIMATION
 * Simulates Instagram follower scanning process
 */
class ScannerAnimation {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        
        this.setup();
    }

    setup() {
        this.container.innerHTML = `
            <div class="scanner-container gpu-accelerated">
                <div class="scanner-line"></div>
                <div id="profile-bubbles"></div>
                <div class="loading-progress"></div>
            </div>
            <div style="text-align: center; margin-top: 1.5rem; color: #999;">
                <p style="font-size: 0.875rem;">Scanning followers...</p>
                <span id="scan-percentage" style="font-weight: bold; color: #FF0080;">0%</span>
            </div>
        `;
        
        this.generateProfileBubbles();
    }

    generateProfileBubbles() {
        const bubblesContainer = this.container.querySelector('#profile-bubbles');
        const bubbleCount = Math.random() * 8 + 12; // 12-20 bubbles
        
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'profile-bubble';
            bubble.style.left = Math.random() * 80 + 10 + '%';
            bubble.style.top = Math.random() * 70 + 15 + '%';
            bubble.style.animationDelay = Math.random() * 2 + 's';
            bubble.style.width = (Math.random() * 20 + 30) + 'px';
            bubble.style.height = bubble.style.width;
            
            bubblesContainer.appendChild(bubble);
        }
    }

    updateProgress(percentage) {
        const progressEl = this.container.querySelector('#scan-percentage');
        if (progressEl) {
            progressEl.textContent = Math.floor(percentage) + '%';
        }
    }
}

/**
 * RESULTS REVEAL ANIMATION
 * Animates result cards and numbers when analysis completes
 */
class ResultsReveal {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.animationDelay = 0;
    }

    reveal(data) {
        if (!this.container) return;
        
        // Animate cards in
        const cards = this.container.querySelectorAll('.result-card');
        cards.forEach((card) => {
            card.style.animationDelay = this.animationDelay + 's';
            this.animationDelay += 0.1;
        });

        // Animate numbers
        const numbers = this.container.querySelectorAll('.result-number');
        numbers.forEach((number) => {
            this.animateNumber(number, parseInt(number.textContent));
        });

        // Animate list items
        const listItems = this.container.querySelectorAll('.result-list-item');
        listItems.forEach((item, index) => {
            item.style.animationDelay = (this.animationDelay + 0.1 * index) + 's';
        });
    }

    animateNumber(element, finalValue) {
        const duration = 1000; // 1 second
        const startTime = Date.now();
        
        const updateNumber = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth count
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(finalValue * easeOut);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
}

/**
 * SMOOTH SCROLL REVEAL
 * Triggers animations as user scrolls
 */
class SmoothScrollReveal {
    constructor() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            },
            { threshold: 0.1 }
        );
        
        this.init();
    }

    init() {
        const elements = document.querySelectorAll('.reveal-item');
        elements.forEach((el) => {
            this.observer.observe(el);
        });
    }
}

/**
 * PAGE LOAD ORCHESTRATION
 * Coordinates hero and section animations on page load
 */
class PageLoadAnimation {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('load', () => {
            this.animateHero();
            this.animateSections();
        });
    }

    animateHero() {
        const hero = document.querySelector('.hero-load');
        if (!hero) return;
        
        hero.style.animationPlayState = 'running';
    }

    animateSections() {
        const sections = document.querySelectorAll('[data-section-animate]');
        
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('section-loaded');
            }, 200 * (index + 1));
        });
    }
}

/**
 * SCROLL PARALLAX BUILDER
 * Easy parallax effect setup
 */
class ParallaxBuilder {
    constructor() {
        this.init();
    }

    init() {
        const elements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            elements.forEach((el) => {
                const speed = parseFloat(el.dataset.parallax) || 0.5;
                const yPos = scrolled * speed;
                
                el.style.transform = `translateY(${yPos}px)`;
                el.style.willChange = 'transform';
            });
        }, { passive: true });
    }
}

/**
 * MICRO-INTERACTION HANDLERS
 */
class MicroInteractions {
    static init() {
        this.setupCheckboxAnimations();
        this.setupToggleAnimations();
        this.setupCardInteractions();
    }

    static setupCheckboxAnimations() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', () => {
                const wrapper = checkbox.closest('[data-checkbox-wrapper]');
                if (wrapper) {
                    wrapper.classList.toggle('checked');
                }
            });
        });
    }

    static setupToggleAnimations() {
        const toggles = document.querySelectorAll('[data-toggle]');
        
        toggles.forEach((toggle) => {
            toggle.addEventListener('click', () => {
                const target = document.querySelector(toggle.dataset.toggle);
                if (target) {
                    target.classList.toggle('toggled');
                }
            });
        });
    }

    static setupCardInteractions() {
        const cards = document.querySelectorAll('.card-hover');
        
        cards.forEach((card) => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }
}

/**
 * PERFORMANCE MONITORING
 * Detects if animations are causing jank
 */
class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.init();
    }

    init() {
        let lastTime = performance.now();
        let count = 0;

        const measure = () => {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            
            if (delta >= 1000) {
                this.fps = Math.round((count * 1000) / delta);
                count = 0;
                lastTime = currentTime;
                
                if (this.fps < 50) {
                    this.reduceAnimations();
                }
            }
            
            count++;
            requestAnimationFrame(measure);
        };
        
        requestAnimationFrame(measure);
    }

    reduceAnimations() {
        // Disable complex animations on low-FPS devices
        document.body.style.setProperty('--duration-fast', '0ms');
        document.body.style.setProperty('--duration-normal', '0ms');
    }
}

/**
 * INITIALIZE ALL ANIMATION SYSTEMS
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main animation manager
    const animationManager = new AnimationManager();
    
    // Initialize smooth scroll reveals
    new SmoothScrollReveal();
    
    // Initialize page load animation
    new PageLoadAnimation();
    
    // Initialize parallax effects
    new ParallaxBuilder();
    
    // Initialize micro-interactions
    MicroInteractions.init();
    
    // Monitor performance (optional - disable if not needed)
    // new PerformanceMonitor();
    
    console.log('✨ Animation system initialized - Ready for smooth, premium UX!');
});

/**
 * EXPORT FOR USE
 */
window.AnimationManager = AnimationManager;
window.ScannerAnimation = ScannerAnimation;
window.ResultsReveal = ResultsReveal;
window.MicroInteractions = MicroInteractions;
