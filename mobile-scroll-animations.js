/* ============================================
   MOBILE SCROLL ANIMATIONS
   Optimized for smooth 60fps on touch devices
   ============================================ */

/**
 * MOBILE-FIRST SCROLL REVEAL SYSTEM
 * Uses requestAnimationFrame for smooth 60fps
 * Optimized for lower-end mobile devices
 */

class MobileScrollAnimations {
    constructor() {
        this.elements = [];
        this.animationFrame = null;
        this.scrollY = 0;
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            this.init();
        }
    }

    detectMobile() {
        return window.innerWidth <= 768 || 
               /iPhone|iPad|iPod|Android|webOS|BlackBerry/i.test(navigator.userAgent);
    }

    init() {
        this.collectElements();
        this.setupScrollListener();
        this.setupResizeListener();
        this.triggerInitialAnimations();
    }

    collectElements() {
        // Collect all elements with animation triggers
        const selectors = [
            '[data-animate]',
            '.reveal-up',
            '.reveal-left',
            '.reveal-right',
            '.stagger-reveal',
            '.reveal-item',
            '[data-section-animate]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!this.elements.includes(el)) {
                    this.elements.push({
                        element: el,
                        elementTop: el.getBoundingClientRect().top + window.scrollY,
                        elementHeight: el.offsetHeight,
                        animated: false,
                        offset: el.dataset.scrollOffset || 0.2 // 20% from bottom of viewport
                    });
                }
            });
        });

        // Sort by position for efficient checking
        this.elements.sort((a, b) => a.elementTop - b.elementTop);
    }

    setupScrollListener() {
        // Use passive listener for better mobile performance
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            this.checkElements();
        }, { passive: true });
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            // Recalculate positions on resize
            this.elements.forEach(item => {
                item.elementTop = item.element.getBoundingClientRect().top + window.scrollY;
            });
        }, { passive: true });
    }

    triggerInitialAnimations() {
        // Check for elements already in viewport on load
        setTimeout(() => {
            this.checkElements();
        }, 100);
    }

    checkElements() {
        const viewportHeight = window.innerHeight;
        const scrollBottom = this.scrollY + viewportHeight;

        this.elements.forEach(item => {
            if (!item.animated) {
                // Calculate trigger point (element bottom relative to viewport)
                const triggerPoint = item.elementTop + (item.elementHeight * item.offset);

                // Trigger animation when element enters viewport
                if (scrollBottom >= triggerPoint) {
                    this.animateElement(item);
                }
            }
        });
    }

    animateElement(item) {
        item.animated = true;
        const el = item.element;

        // Add animation class
        el.classList.add('in-view');
        el.style.animationPlayState = 'running';

        // For staggered items, add staggered animation to children
        if (el.classList.contains('stagger-reveal')) {
            Array.from(el.children).forEach((child, index) => {
                setTimeout(() => {
                    child.classList.add('in-view');
                    child.style.animationPlayState = 'running';
                }, index * 50); // 50ms stagger
            });
        }

        // Trigger paint optimization
        el.style.willChange = 'transform, opacity';
        
        // Remove will-change after animation completes
        const animationDuration = this.getAnimationDuration(el);
        setTimeout(() => {
            el.style.willChange = 'auto';
        }, animationDuration);
    }

    getAnimationDuration(el) {
        const computed = window.getComputedStyle(el);
        const duration = computed.animationDuration;
        
        if (duration && duration !== 'auto') {
            return parseFloat(duration) * 1000;
        }
        return 300; // Default 300ms
    }
}

/**
 * PARALLAX SCROLL FOR MOBILE
 * Lightweight parallax that doesn't cause jank
 */

class MobileParallax {
    constructor() {
        this.elements = [];
        this.scrollY = 0;
        this.isMobile = window.innerWidth <= 768;
        
        if (this.isMobile && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.init();
        }
    }

    init() {
        this.collectParallaxElements();
        this.setupScrollListener();
    }

    collectParallaxElements() {
        document.querySelectorAll('[data-parallax], .parallax-slow').forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.3; // Slower default for mobile
            
            this.elements.push({
                element: el,
                speed: speed,
                initialY: el.offsetTop
            });
        });
    }

    setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    updateParallax() {
        this.elements.forEach(item => {
            const offset = this.scrollY * item.speed;
            item.element.style.transform = `translateY(${offset}px)`;
        });
    }
}

/**
 * SCROLL PROGRESS ANIMATIONS
 * Animate elements based on scroll progress (0-100%)
 */

class ScrollProgressAnimations {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        this.collectElements();
        this.setupScrollListener();
    }

    collectElements() {
        document.querySelectorAll('[data-progress-animate]').forEach(el => {
            this.elements.push({
                element: el,
                elementTop: el.offsetTop,
                elementHeight: el.offsetHeight,
                duration: el.dataset.progressDuration || 300
            });
        });
    }

    setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    updateProgress() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        this.elements.forEach(item => {
            const elementCenter = item.elementTop + (item.elementHeight / 2);
            const scrollCenter = scrollY + (viewportHeight / 2);
            
            // Calculate progress (0 to 1)
            const distance = scrollCenter - elementCenter;
            const maxDistance = viewportHeight / 2;
            let progress = 1 - (distance / maxDistance);
            progress = Math.max(0, Math.min(1, progress)); // Clamp 0-1

            // Apply opacity and scale based on progress
            item.element.style.opacity = 0.3 + (progress * 0.7);
            item.element.style.transform = `scale(${0.9 + (progress * 0.1)})`;
        });
    }
}

/**
 * SCROLL TRIGGERED COUNTERS
 * Animate numbers as section scrolls into view
 */

class ScrollCounters {
    constructor() {
        this.counters = [];
        this.init();
    }

    init() {
        this.collectCounters();
        this.setupScrollListener();
    }

    collectCounters() {
        document.querySelectorAll('[data-scroll-count-to]').forEach(el => {
            this.counters.push({
                element: el,
                targetValue: parseInt(el.dataset.scrollCountTo),
                currentValue: 0,
                elementTop: el.offsetTop,
                animated: false,
                duration: parseInt(el.dataset.scrollCountDuration) || 1000
            });
        });
    }

    setupScrollListener() {
        window.addEventListener('scroll', () => {
            this.checkCounters();
        }, { passive: true });
    }

    checkCounters() {
        const scrollY = window.scrollY + window.innerHeight;

        this.counters.forEach(counter => {
            if (!counter.animated && scrollY >= counter.elementTop) {
                this.animateCounter(counter);
            }
        });
    }

    animateCounter(counter) {
        counter.animated = true;
        const startTime = Date.now();
        const { targetValue, duration } = counter;

        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(targetValue * easeOut);
            
            counter.element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.element.textContent = targetValue;
            }
        };

        requestAnimationFrame(updateCounter);
    }
}

/**
 * SMOOTH SCROLL BEHAVIOR
 * Enhanced smooth scrolling for mobile
 */

class SmoothScrollBehavior {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        
        if (this.isMobile) {
            this.init();
        }
    }

    init() {
        // Enable smooth scroll CSS
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Handle anchor clicks
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId && targetId !== '#') {
                    e.preventDefault();
                    this.smoothScrollTo(targetId);
                }
            });
        });
    }

    smoothScrollTo(targetId) {
        const target = document.querySelector(targetId);
        if (!target) return;

        const headerHeight = 100; // Account for fixed navbar
        const targetPosition = target.offsetTop - headerHeight;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;

        const ease = (t) => {
            // Easing function (ease-in-out)
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            window.scrollTo(0, startPosition + distance * ease(progress));
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }
}

/**
 * INTERSECTION OBSERVER BASED SCROLL ANIMATIONS
 * Most performant method for scroll reveal
 */

class IntersectionScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        const options = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    entry.target.style.animationPlayState = 'running';
                    
                    // Unobserve to avoid repeated checks
                    if (entry.target.hasAttribute('data-observe-once')) {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, options);

        // Observe all animatable elements
        const selectors = [
            '[data-animate]',
            '.reveal-up',
            '.reveal-left',
            '.reveal-right',
            '.stagger-reveal > *',
            '.reveal-item'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.animationPlayState = 'paused';
                observer.observe(el);
            });
        });
    }
}

/**
 * SCROLL DIRECTION DETECTION
 * Trigger different animations based on scroll direction
 */

class ScrollDirectionAnimations {
    constructor() {
        this.lastScrollY = 0;
        this.scrollDirection = 'down';
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > this.lastScrollY) {
                this.scrollDirection = 'down';
            } else if (currentScrollY < this.lastScrollY) {
                this.scrollDirection = 'up';
            }
            
            this.lastScrollY = currentScrollY;
            this.updateElements();
        }, { passive: true });
    }

    updateElements() {
        document.querySelectorAll('[data-scroll-direction]').forEach(el => {
            const direction = el.dataset.scrollDirection;
            
            if (direction === this.scrollDirection) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }
}

/**
 * MOBILE BOUNCE SCROLL EFFECT
 * Simulate iOS-like bounce at top/bottom
 */

class MobileBounceScroll {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        
        if (this.isMobile) {
            this.init();
        }
    }

    init() {
        const hero = document.querySelector('[data-section-animate]');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            if (scrollY < 0) {
                // Bounce at top
                const bounce = Math.abs(scrollY) * 0.5;
                hero.style.transform = `translateY(${bounce}px)`;
            } else {
                hero.style.transform = '';
            }
        }, { passive: true });
    }
}

/**
 * OPTIMIZE ANIMATIONS FOR LOW-END DEVICES
 * Detect performance and disable heavy animations if needed
 */

class PerformanceOptimizer {
    constructor() {
        this.fps = 60;
        this.isLowEnd = false;
        this.init();
    }

    init() {
        this.measureFPS();
    }

    measureFPS() {
        let lastTime = performance.now();
        let frames = 0;

        const checkFPS = () => {
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.fps = frames;
                
                if (this.fps < 40) {
                    this.disableHeavyAnimations();
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            frames++;
            requestAnimationFrame(checkFPS);
        };

        requestAnimationFrame(checkFPS);
    }

    disableHeavyAnimations() {
        // Disable parallax and scroll counters
        document.documentElement.style.setProperty('--duration-normal', '100ms');
        document.documentElement.style.setProperty('--duration-slow', '200ms');
        
        // Disable parallax effects
        document.querySelectorAll('[data-parallax]').forEach(el => {
            el.style.animation = 'none';
            el.style.transform = 'none';
        });
    }
}

/**
 * INITIALIZE ALL MOBILE SCROLL ANIMATIONS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        console.log('📱 Initializing mobile scroll animations...');
        
        // Initialize mobile scroll systems
        new MobileScrollAnimations();
        new IntersectionScrollAnimations();
        new MobileParallax();
        new ScrollCounters();
        new SmoothScrollBehavior();
        new ScrollDirectionAnimations();
        new ScrollProgressAnimations();
        new MobileBounceScroll();
        new PerformanceOptimizer();
        
        console.log('✅ Mobile scroll animations ready!');
    }
});

// Export for external use
window.MobileScrollAnimations = MobileScrollAnimations;
window.ScrollCounters = ScrollCounters;
window.MobileParallax = MobileParallax;
window.SmoothScrollBehavior = SmoothScrollBehavior;
