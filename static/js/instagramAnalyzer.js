/**
 * Instagram Unfollower Analyzer - Client-Side ZIP Processing
 * 
 * Parses Instagram exports from connections/followers_-1.html and connections/following.html
 * These are the ACTUAL files exported by Instagram, not JSON format.
 */

class InstagramAnalyzer {
    constructor() {
        this.followersList = new Set();
        this.followingList = new Set();
        this.unfollowersList = new Set();
        this.progressCallback = null;
        this.debugMode = localStorage.getItem('instagramAnalyzerDebug') === 'true';
    }

    /**
     * Set callback function for progress updates
     * @param {Function} callback - Called with progress object {progress, message}
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Update progress with optional message
     * @param {number} progress - Percentage 0-100
     * @param {string} message - Optional status message
     */
    _updateProgress(progress, message = '') {
        if (this.progressCallback) {
            // Use setTimeout to ensure UI updates asynchronously
            Promise.resolve().then(() => {
                this.progressCallback({ progress: Math.min(Math.max(progress, 0), 100), message });
            });
        }
        if (this.debugMode) {
            console.log(`[Progress: ${progress}%] ${message}`);
        }
    }

    /**
     * Yield to browser (prevents UI blocking for large operations)
     * @private
     */
    async _yield() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    /**
     * Main entry point: Analyze ZIP file
     * @param {File} zipFile - The uploaded ZIP file
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeZip(zipFile) {
        try {
            // Verify file is a ZIP
            if (!zipFile.name.toLowerCase().endsWith('.zip')) {
                throw new Error('Invalid file type. Please upload a .zip file exported from Instagram.');
            }

            this._updateProgress(5, 'Loading ZIP file...');
            await this._yield();

            // Verify JSZip is loaded
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library not loaded. Please refresh the page and try again.');
            }

            this._updateProgress(8, 'Reading file data...');
            
            // Convert file to array buffer
            let zipData;
            try {
                zipData = await zipFile.arrayBuffer();
            } catch (e) {
                throw new Error(`Failed to read file: ${e.message}`);
            }

            this._updateProgress(12, 'Parsing ZIP archive...');

            // Load and parse ZIP
            let zip;
            try {
                zip = new JSZip();
                await zip.loadAsync(zipData);
            } catch (e) {
                throw new Error(`Failed to parse ZIP: ${e.message}. Are you sure this is a valid ZIP file?`);
            }

            this._updateProgress(18, 'Scanning archive structure...');
            await this._yield();

            // Find followers and following files
            const { followersFiles, followingFile } = await this._findInstagramFiles(zip);

            if (!followersFiles || followersFiles.length === 0) {
                throw new Error('No followers data found in ZIP. This ZIP file may not be a valid Instagram export. Try exporting fresh data from Instagram Settings → Your Activity → Download Information. (Tip: enable debug mode for detailed file list)');
            }

            if (!followingFile) {
                throw new Error('No following data found in ZIP. This ZIP file may not be a valid Instagram export. Try exporting fresh data from Instagram Settings → Your Activity → Download Information. (Tip: enable debug mode for detailed file list)');
            }

            if (this.debugMode) {
                console.log(`Found ${followersFiles.length} followers file(s):`, followersFiles);
                console.log(`Found following file: ${followingFile}`);
            }

            this._updateProgress(25, `Extracting followers data (${followersFiles.length} file${followersFiles.length > 1 ? 's' : ''})...`);

            // Parse all followers files
            await this._parseFollowersFiles(zip, followersFiles);

            this._updateProgress(65, 'Extracting following data...');
            await this._yield();

            // Parse following file
            await this._parseFollowingFile(zip, followingFile);

            this._updateProgress(85, 'Calculating unfollowers...');
            await this._yield();

            // Calculate unfollowers: following - followers
            this.unfollowersList = new Set(
                [...this.followingList].filter(user => !this.followersList.has(user))
            );

            this._updateProgress(95, 'Generating results...');
            await this._yield();

            this._updateProgress(100, 'Analysis complete!');

            return this._generateResults();
        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error(`ZIP Analysis Error: ${error.message}`);
        }
    }

    /**
     * Find followers and following HTML files in ZIP
     * Instagram exports them as: connections/followers_1.html and connections/following.html
     * (Some older exports might use followers_-1.html - we support both)
     * @private
     */
    async _findInstagramFiles(zip) {
        const allFiles = [];

        // List all files in ZIP
        zip.forEach((relativePath, file) => {
            if (!file.dir) {
                allFiles.push(relativePath);
            }
        });

        if (this.debugMode) {
            console.log('[ANALYZER] Files in ZIP:', allFiles);
        }

        // Look for EXACT paths that Instagram uses
        let followersFile = null;
        let followingFile = null;

        // Search for followers HTML file
        // Instagram exports: connections/followers_1.html or connections/followers_-1.html (older)
        for (const filePath of allFiles) {
            const lower = filePath.toLowerCase();
            
            // Match either followers_1.html or followers_-1.html varieties
            if (lower.includes('connections/followers') && lower.endsWith('.html')) {
                // Verify it's specifically the followers file, not following
                if (!lower.includes('following.html')) {
                    followersFile = filePath;
                    if (this.debugMode) {
                        console.log('[ANALYZER] Found followers file:', filePath);
                    }
                    break;
                }
            }
        }

        // Search for following HTML file
        // Instagram exports: connections/following.html
        for (const filePath of allFiles) {
            const lower = filePath.toLowerCase();
            
            // Must be exactly following.html in connections folder
            if ((lower.includes('connections/following.html') || 
                 lower === 'connections/following.html') && 
                lower.endsWith('.html')) {
                followingFile = filePath;
                if (this.debugMode) {
                    console.log('[ANALYZER] Found following file:', filePath);
                }
                break;
            }
        }

        // Fallback: try more flexible matching for edge cases
        if (!followersFile) {
            for (const filePath of allFiles) {
                const lower = filePath.toLowerCase();
                if (lower.endsWith('followers_1.html') || lower.endsWith('followers_-1.html')) {
                    followersFile = filePath;
                    if (this.debugMode) {
                        console.log('[ANALYZER] Found followers file (flexible match):', filePath);
                    }
                    break;
                }
            }
        }

        if (!followingFile) {
            for (const filePath of allFiles) {
                const lower = filePath.toLowerCase();
                if (lower.endsWith('following.html') && !lower.includes('followers')) {
                    followingFile = filePath;
                    if (this.debugMode) {
                        console.log('[ANALYZER] Found following file (flexible match):', filePath);
                    }
                    break;
                }
            }
        }

        if (!followersFile) {
            console.error('[ANALYZER] Could not find followers file in ZIP');
            console.error('[ANALYZER] Available files:', allFiles);
        }
        if (!followingFile) {
            console.error('[ANALYZER] Could not find following.html in ZIP');
            console.error('[ANALYZER] Available files:', allFiles);
        }

        return { 
            followersFiles: followersFile ? [followersFile] : [],
            followingFile: followingFile
        };
    }

    /**
     * Parse all followers files and merge into single set
     * Handles JSON and HTML formats with non-blocking async processing
     * @private
     */
    async _parseFollowersFiles(zip, followersFiles) {
        for (let i = 0; i < followersFiles.length; i++) {
            const filePath = followersFiles[i];
            
            try {
                this._updateProgress(25 + (i / followersFiles.length * 40), 
                    `Processing followers file ${i + 1}/${followersFiles.length}...`);
                
                const fileData = await zip.file(filePath).async('string');
                const usernames = this._extractUsernamesFromFile(fileData, filePath);
                
                this.followersList = new Set([...this.followersList, ...usernames]);
                
                if (this.debugMode) {
                    console.log(`Parsed ${filePath}: ${usernames.size} followers`);
                }
                
                // Yield to prevent UI blocking
                await this._yield();
            } catch (error) {
                console.warn(`Error parsing followers file ${filePath}:`, error);
                // Continue with next file instead of failing
                continue;
            }
        }
    }

    /**
     * Parse following file
     * @private
     */
    async _parseFollowingFile(zip, followingFile) {
        try {
            this._updateProgress(68, 'Reading following data...');
            
            const fileData = await zip.file(followingFile).async('string');
            
            this._updateProgress(72, 'Parsing following list...');
            
            this.followingList = this._extractUsernamesFromFile(fileData, followingFile);
            
            if (this.debugMode) {
                console.log(`Parsed ${followingFile}: ${this.followingList.size} following`);
            }
            
            await this._yield();
        } catch (error) {
            throw new Error(`Failed to parse following file: ${error.message}`);
        }
    }

    /**
     * Extract usernames from file content (JSON or HTML)
     * Automatically detects file type and parses accordingly
     * @private
     */
    _extractUsernamesFromFile(fileContent, filename) {
        const lowerFilename = filename.toLowerCase();

        if (lowerFilename.endsWith('.json')) {
            return this._parseJsonFile(fileContent);
        } else if (lowerFilename.endsWith('.html')) {
            return this._parseHtmlFile(fileContent);
        } else {
            // Try both formats
            try {
                return this._parseJsonFile(fileContent);
            } catch (_) {
                return this._parseHtmlFile(fileContent);
            }
        }
    }

    /**
     * Parse JSON format from Instagram exports
     * Handles multiple JSON structures
     * @private
     */
    _parseJsonFile(jsonContent) {
        const usernames = new Set();

        try {
            const data = JSON.parse(jsonContent);
            this._extractUsernamesFromObject(data, usernames);
        } catch (error) {
            // If not valid JSON, try text extraction
            this._extractUsernamesFromText(jsonContent, usernames);
        }

        return usernames;
    }

    /**
     * Recursively extract usernames from JSON objects
     * Handles nested structures and various field names
     * @private
     */
    _extractUsernamesFromObject(obj, usernames, depth = 0) {
        if (depth > 10) return; // Prevent infinite recursion

        if (Array.isArray(obj)) {
            for (const item of obj) {
                if (typeof item === 'string') {
                    this._validateAndAddUsername(item, usernames);
                } else if (typeof item === 'object' && item !== null) {
                    this._extractUsernamesFromObject(item, usernames, depth + 1);
                }
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                // Check common username field names
                if (['username', 'user', 'name', 'handle', 'profile'].includes(key.toLowerCase())) {
                    if (typeof value === 'string') {
                        this._validateAndAddUsername(value, usernames);
                    }
                }
                // Look for nested objects with username
                if (key.toLowerCase().includes('value') && typeof value === 'string') {
                    this._validateAndAddUsername(value, usernames);
                }
                // Recurse into nested objects
                if (typeof value === 'object' && value !== null) {
                    this._extractUsernamesFromObject(value, usernames, depth + 1);
                }
            }
        }
    }

    /**
     * Parse HTML format from Instagram exports
     * Instagram exports use HTML with anchor tags containing Instagram profile links
     * Supports multiple URL formats:
     *   - Full URL: href="https://www.instagram.com/username/"
     *   - Full URL (no www): href="https://instagram.com/username/"
     *   - Relative: href="/username/"
     *   - Text content: >username</a> (fallback)
     * @private
     */
    _parseHtmlFile(htmlContent) {
        const usernames = new Set();

        if (!htmlContent || typeof htmlContent !== 'string') {
            console.warn('[ANALYZER] Invalid HTML content');
            return usernames;
        }

        // Pattern 1: Full Instagram URL - https://www.instagram.com/username/ or https://instagram.com/username/
        // Captures: href="https://www.instagram.com/USERNAME/" or href="https://instagram.com/USERNAME/"
        const instagramUrlPattern = /href=["']https:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/["']/gi;
        let match;
        
        while ((match = instagramUrlPattern.exec(htmlContent)) !== null) {
            const username = match[1];
            this._validateAndAddUsername(username, usernames);
        }

        // Pattern 2: Relative path - /username/
        // This is a fallback for older exports or alternative formats
        const relativePathPattern = /href=["']\/([a-zA-Z0-9_.]+)\/["']/gi;
        
        while ((match = relativePathPattern.exec(htmlContent)) !== null) {
            const username = match[1];
            this._validateAndAddUsername(username, usernames);
        }

        // Pattern 3: Anchor tag text content - >username</a>
        // Fallback for cases where username appears as anchor text
        const anchorTextPattern = />([a-zA-Z0-9_.]+)<\/a>/gi;
        
        while ((match = anchorTextPattern.exec(htmlContent)) !== null) {
            const text = match[1];
            // Only add if it looks like a valid username (not overly common words)
            if (text.length > 0 && text.length <= 30 && /^[a-z0-9_.]+$/i.test(text)) {
                // Validate using the standard validation
                this._validateAndAddUsername(text, usernames);
            }
        }

        if (this.debugMode) {
            console.log(`[ANALYZER] Extracted ${usernames.size} usernames from HTML using all patterns`);
        }
        
        return usernames;
    }

    /**
     * Extract usernames from plain text
     * Fallback for non-JSON, non-HTML content
     * @private
     */
    _extractUsernamesFromText(textContent, usernames) {
        // Pattern: @username or plain username-like text
        const pattern = /(?:@|^|\s)([a-zA-Z0-9_.]{1,30})(?:\s|$|@|,|\.)/gm;
        let match;

        while ((match = pattern.exec(textContent)) !== null) {
            this._validateAndAddUsername(match[1], usernames);
        }
    }

    /**
     * Validate and add username to set
     * Ensures valid Instagram username format
     * @private
     */
    _validateAndAddUsername(username, usernames) {
        if (!username || typeof username !== 'string') return;

        const cleaned = username.trim().toLowerCase();

        // Instagram username validation rules
        if (cleaned.length < 1 || cleaned.length > 30) return;
        if (!/^[a-z0-9_.]+$/.test(cleaned)) return;
        if (/^_|_$/.test(cleaned)) return; // starts or ends with underscore
        if (cleaned.includes('..')) return;

        // Exclude common non-username values
        const excludedWords = [
            'www', 'http', 'https', 'instagram', 'user', 'username', 'me',
            'followers', 'following', 'profile', 'account', 'data', 'value',
            'undefined', 'null', 'object', 'array', 'error'
        ];
        if (excludedWords.includes(cleaned)) return;

        usernames.add(cleaned);
    }

    /**
     * Generate final results object
     * @private
     */
    _generateResults() {
        const unfollowersList = Array.from(this.unfollowersList).sort();
        const previewCount = 3;
        const previewList = unfollowersList.slice(0, previewCount);
        const hiddenCount = Math.max(0, unfollowersList.length - previewCount);

        // Generate TXT content for export
        const txtContent = unfollowersList.map(u => u + '\n').join('');

        return {
            status: 'success',
            message: unfollowersList.length === 0
                ? 'Great news! Everyone you follow follows you back. 🎉'
                : `Found ${unfollowersList.length} accounts that don't follow you back.`,

            // Statistics
            unfollower_count: unfollowersList.length,
            followers_count: this.followersList.size,
            following_count: this.followingList.size,

            // Results
            unfollowers: previewList,
            unfollowers_list: previewList,
            hidden_count: hiddenCount,

            // Export
            txt_content: txtContent,

            // Metadata
            all_unfollowers: unfollowersList, // Complete list for download
            file_type: 'local_zip'
        };
    }

    /**
     * Get full unfollowers list (for download)
     */
    getFullUnfollowersList() {
        return Array.from(this.unfollowersList).sort();
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            followers: this.followersList.size,
            following: this.followingList.size,
            unfollowers: this.unfollowersList.size,
            followersFollowBack: this.followingList.size - this.unfollowersList.size
        };
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.InstagramAnalyzer = InstagramAnalyzer;
    
    // Add debugging helper
    window.enableInstagramAnalyzerDebug = () => {
        localStorage.setItem('instagramAnalyzerDebug', 'true');
        console.log('✅ InstagramAnalyzer debug mode enabled. Reload page to see detailed logs.');
    };
    
    window.disableInstagramAnalyzerDebug = () => {
        localStorage.removeItem('instagramAnalyzerDebug');
        console.log('❌ InstagramAnalyzer debug mode disabled.');
    };
    
    // Log that analyzer is loaded
    console.log('✅ InstagramAnalyzer library loaded successfully');
}
