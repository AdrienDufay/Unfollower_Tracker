/* ============================================
   ADVANCED ANIMATION INTEGRATION GUIDE
   Complete examples for upload + results
   ============================================ */

/**
 * EXAMPLE 1: SCANNER ANIMATION DURING FILE UPLOAD
 * 
 * This shows how to integrate the scanner animation
 * into your existing file upload handler
 */

class EnhancedFileUploadHandler {
    constructor() {
        this.scanner = null;
        this.results = null;
        this.init();
    }

    init() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('file-upload');
        
        // Handle file selection
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFile(e.target.files[0]);
        });
        
        // Handle drag and drop
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleFile(e.dataTransfer.files[0]);
        });
    }

    handleFile(file) {
        if (!file) return;
        
        // Show scanner animation
        this.showScannerAnimation();
        
        // Simulate file analysis with progress
        this.analyzeFile(file);
    }

    showScannerAnimation() {
        const uploadContent = document.getElementById('upload-content');
        const scannerContainer = document.createElement('div');
        scannerContainer.id = 'scannerContainer';
        
        uploadContent.style.display = 'none';
        uploadContent.parentElement.appendChild(scannerContainer);
        
        // Initialize scanner
        this.scanner = new ScannerAnimation('#scannerContainer');
    }

    async analyzeFile(file) {
        try {
            const data = await this.processFile(file);
            
            // Update progress to 100%
            if (this.scanner) {
                this.scanner.updateProgress(100);
            }
            
            // Wait slightly before showing results
            await this.delay(800);
            
            // Show results with animations
            this.showResults(data);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async processFile(file) {
        // Your existing file processing logic
        // This is a placeholder - adapt to your needs
        
        return new Promise((resolve) => {
            // Simulate processing
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 25;
                if (progress > 95) {
                    clearInterval(interval);
                    progress = 95;
                }
                this.scanner.updateProgress(progress);
            }, 400);
            
            // After 3 seconds, complete
            setTimeout(() => {
                clearInterval(interval);
                resolve({
                    unfollowed: 247,
                    notFollowingBack: 89,
                    trueFollowers: 3542,
                    unfollowedList: [
                        { name: 'john_doe', unfollowedDate: '2 days ago' },
                        { name: 'jane_smith', unfollowedDate: '5 days ago' },
                        { name: 'alex_jones', unfollowedDate: '1 week ago' }
                    ]
                });
            }, 3000);
        });
    }

    showResults(data) {
        const scanner = document.getElementById('scannerContainer');
        scanner.remove();
        
        const uploadContent = document.getElementById('upload-content');
        uploadContent.style.display = 'block';
        
        const resultsDisplay = document.getElementById('resultsDisplay');
        
        // Build results HTML
        resultsDisplay.innerHTML = `
            <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <i class="fas fa-check text-green-500"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">Analysis Complete!</h3>
                    <p class="text-sm text-gray-400">Here's your unfollower breakdown</p>
                </div>
            </div>

            <!-- Main Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="result-card glass-card rounded-2xl p-6 text-center">
                    <div class="text-4xl font-bold text-pink-500 mb-2">
                        <span class="result-number">${data.unfollowed}</span>
                    </div>
                    <p class="text-gray-400">Unfollowed You</p>
                </div>
                
                <div class="result-card glass-card rounded-2xl p-6 text-center">
                    <div class="text-4xl font-bold text-purple-500 mb-2">
                        <span class="result-number">${data.notFollowingBack}</span>
                    </div>
                    <p class="text-gray-400">Don't Follow Back</p>
                </div>
                
                <div class="result-card glass-card rounded-2xl p-6 text-center">
                    <div class="text-4xl font-bold text-green-500 mb-2">
                        <span class="result-number">${data.trueFollowers}</span>
                    </div>
                    <p class="text-gray-400">True Followers</p>
                </div>
            </div>

            <!-- Unfollowed List -->
            <div class="mt-6">
                <h4 class="font-bold text-white mb-4">Recently Unfollowed</h4>
                <div class="space-y-2">
                    ${data.unfollowedList.map(user => `
                        <div class="result-list-item flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
                                <div>
                                    <p class="font-semibold text-white">@${user.name}</p>
                                    <p class="text-xs text-gray-500">${user.unfollowedDate}</p>
                                </div>
                            </div>
                            <span class="text-red-400 text-sm font-bold">Unfollowed</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        resultsDisplay.classList.remove('hidden');
        
        // Trigger reveal animations
        this.results = new ResultsReveal('#resultsDisplay');
        this.results.reveal(data);
    }

    showError(message) {
        const scanner = document.getElementById('scannerContainer');
        if (scanner) scanner.remove();
        
        const uploadContent = document.getElementById('upload-content');
        uploadContent.style.display = 'block';
        
        const errorDisplay = document.getElementById('errorMessage');
        errorDisplay.textContent = message;
        errorDisplay.classList.remove('hidden');
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorDisplay.classList.add('hidden');
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedFileUploadHandler();
});


/**
 * EXAMPLE 2: CUSTOM LOADER WITH PROGRESS
 * 
 * Use this to show a more detailed loading state
 * with real progress tracking
 */

class DetailedProgressLoader {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.progress = 0;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="relative w-24 h-24 mb-6">
                    <svg class="spinner" width="100%" height="100%" viewBox="0 0 100 100">
                        <circle class="spinner-circle"
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            stroke-width="8"
                            stroke-dasharray="0,60"
                            stroke-linecap="round"/>
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#FF0080;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#7928CA;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                
                <h3 class="text-xl font-bold text-white mb-2">Analyzing Your Followers</h3>
                <p class="text-gray-400 mb-6 text-center text-sm">
                    We're processing your data <strong>100% locally</strong> in your browser
                </p>
                
                <!-- Progress bar -->
                <div class="w-full max-w-xs mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs text-gray-500">Progress</span>
                        <span class="text-xs font-bold text-pink-500" id="progressText">0%</span>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div id="progressBar" 
                            class="bg-gradient-to-r from-pink-500 to-purple-600 h-full"
                            style="width: 0%; transition: width 0.3s ease-out;"></div>
                    </div>
                </div>
                
                <!-- Status messages -->
                <div class="text-center text-sm text-gray-500">
                    <p id="statusMessage">Starting analysis...</p>
                </div>
            </div>
        `;
    }

    setProgress(percentage, status) {
        this.progress = percentage;
        
        const progressBar = this.container.querySelector('#progressBar');
        const progressText = this.container.querySelector('#progressText');
        const statusMessage = this.container.querySelector('#statusMessage');
        
        progressBar.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '%';
        
        if (status) {
            statusMessage.textContent = status;
        }
    }

    complete() {
        this.setProgress(100, 'Analysis complete!');
    }
}


/**
 * EXAMPLE 3: STAGGERED LIST ANIMATION
 * 
 * Animate individual list items as they appear
 */

class AnimatedList {
    constructor(items) {
        this.items = items;
    }

    renderWithAnimations(containerSelector) {
        const container = document.querySelector(containerSelector);
        
        container.innerHTML = this.items.map((item, index) => `
            <div class="result-list-item" style="animation-delay: ${index * 50}ms;">
                <div class="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                    <div class="flex items-center gap-3">
                        <img src="${item.avatar}" alt="${item.name}" class="w-10 h-10 rounded-full">
                        <div>
                            <p class="font-semibold text-white">${item.name}</p>
                            <p class="text-xs text-gray-500">${item.subtitle}</p>
                        </div>
                    </div>
                    <span class="text-red-400 text-sm font-bold">${item.badge}</span>
                </div>
            </div>
        `).join('');
    }
}


/**
 * EXAMPLE 4: MODAL WITH ENTRANCE ANIMATION
 * 
 * Show results in an animated modal overlay
 */

class AnimatedModal {
    constructor(title, content) {
        this.title = title;
        this.content = content;
        this.build();
    }

    build() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay fixed inset-0 bg-black/80 z-40';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-content fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0A0A0A] rounded-3xl p-8 max-w-md w-full border border-white/10 z-50';
        modal.innerHTML = `
            <h2 class="text-2xl font-bold text-white mb-4">${this.title}</h2>
            ${this.content}
            <button onclick="this.closest('.modal-content').parentElement.parentElement.removeChild(this.closest('.modal-content').parentElement); this.closest('.modal-overlay').parentElement.removeChild(this.closest('.modal-overlay'));" class="w-full mt-6 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200">Close</button>
        `;
        
        // Append to body
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }
}


/**
 * EXAMPLE 5: COMPARISON ANIMATION
 * 
 * Show before/after metrics with animated transitions
 */

class MetricsComparison {
    static create(before, after, timings = {}) {
        const { duration = 1000, delay = 300 } = timings;
        
        return `
            <div class="grid grid-cols-2 gap-4 my-6">
                <!-- Before -->
                <div class="glass-card rounded-2xl p-6 text-center">
                    <div class="text-sm font-bold text-gray-500 mb-2">BEFORE</div>
                    <div class="text-4xl font-bold mb-2" id="before-value">${before}</div>
                    <p class="text-xs text-gray-400">Following</p>
                </div>
                
                <!-- Arrow -->
                <div class="flex items-center justify-center">
                    <div class="animate-pulse">
                        <i class="fas fa-arrow-right text-pink-500"></i>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <!-- After -->
                <div class="glass-card rounded-2xl p-6 text-center result-card">
                    <div class="text-sm font-bold text-green-500 mb-2">NOW</div>
                    <div class="text-4xl font-bold result-number">0</div>
                    <p class="text-xs text-gray-400">New Followers</p>
                </div>
                
                <!-- Change -->
                <div class="glass-card rounded-2xl p-6 text-center result-card">
                    <div class="text-sm font-bold text-red-500 mb-2">LOST</div>
                    <div class="text-4xl font-bold result-number">0</div>
                    <p class="text-xs text-gray-400">Unfollowed</p>
                </div>
            </div>
        `;
    }
}


/**
 * EXAMPLE 6: ANIMATED STATS COUNTER
 * 
 * Count up animation for display numbers
 */

class AnimatedCounter {
    static countUp(element, targetValue, duration = 1000) {
        const startValue = parseInt(element.textContent) || 0;
        const difference = targetValue - startValue;
        const increment = difference / (duration / 16); // 60fps
        let currentValue = startValue;
        
        const counter = () => {
            currentValue += increment;
            
            if (increment > 0 && currentValue >= targetValue) {
                element.textContent = targetValue;
            } else if (increment < 0 && currentValue <= targetValue) {
                element.textContent = targetValue;
            } else {
                element.textContent = Math.round(currentValue);
                requestAnimationFrame(counter);
            }
        };
        
        requestAnimationFrame(counter);
    }

    static countUpAll(selector, duration = 1000) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
            const target = parseInt(el.dataset.target) || parseInt(el.textContent);
            this.countUp(el, target, duration);
        });
    }
}


/**
 * USAGE EXAMPLES
 */

/*
// 1. Start upload handler
const uploadHandler = new EnhancedFileUploadHandler();

// 2. Show progress loader
const loader = new DetailedProgressLoader('#uploadArea');
loader.setProgress(25, 'Analyzing followers...');
loader.setProgress(50, 'Detecting unfollows...');
loader.setProgress(100, 'Complete!');

// 3. Render animated list
const list = new AnimatedList([
    { avatar: 'https://i.pravatar.cc/100?img=1', name: 'john_doe', subtitle: '2 hours ago', badge: 'Unfollowed' },
    { avatar: 'https://i.pravatar.cc/100?img=2', name: 'jane_smith', subtitle: '5 hours ago', badge: 'Unfollowed' },
]);
list.renderWithAnimations('#resultsList');

// 4. Count up numbers
AnimatedCounter.countUpAll('.result-number', 1000);

// 5. Show comparison
document.getElementById('comparison').innerHTML = MetricsComparison.create(1250, 1003);
*/

console.log('✨ Advanced animation utilities loaded and ready to use!');
