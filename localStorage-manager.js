/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LocalStorage Manager - Instagram Unfollower Data Persistence
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages all client-side data persistence using localStorage:
 * - Save/retrieve unfollower analysis data
 * - Handle data replacement on new uploads
 * - Support payment status tracking
 * - Provide utilities for results page retrieval
 * 
 * Features:
 * - Automatic data versioning to prevent outdated data loading
 * - Compression-friendly JSON serialization
 * - Error-safe retrieval with fallback defaults
 * - Payment status integration
 */

const DataStorageManager = {
    /**
     * Storage keys - must be unique to avoid collisions
     */
    KEYS: {
        ANALYSIS_DATA: 'unfollower_analysis_data_v1',
        PAYMENT_STATUS: 'unfollower_payment_status_v1',
        DATA_TIMESTAMP: 'unfollower_data_timestamp_v1',
        SESSION_ID: 'unfollower_session_id_v1',
    },

    /**
     * Maximum data size limit (5MB) - warn if exceeded
     */
    MAX_SIZE_BYTES: 5 * 1024 * 1024,

    /**
     * Save analysis data to localStorage
     * Automatically clears old data to ensure only latest is stored
     * 
     * @param {object} analysisData - Parsed analysis from ZIP
     * @param {array} analysisData.followers - Full follower list
     * @param {array} analysisData.following - Full following list
     * @param {array} analysisData.nonFollowers - Users not following back
     * @param {array} analysisData.fans - Users you follow but don't follow back
     * @returns {boolean} Success status
     */
    saveAnalysisData: function(analysisData) {
        try {
            // Defensive normalization: ensure all usernames are lowercased and unique
            function normalizeList(list) {
                if (!Array.isArray(list)) return [];
                return Array.from(new Set(list.map(u => typeof u === 'string' ? u.trim().toLowerCase() : '')))
                    .filter(Boolean);
            }

            // Validate input
            if (!analysisData || typeof analysisData !== 'object') {
                console.error('❌ Invalid analysis data format');
                return false;
            }

            // Normalize all lists
            const followers = normalizeList(analysisData.followers);
            const following = normalizeList(analysisData.following);
            const nonFollowers = normalizeList(analysisData.nonFollowers);
            const fans = normalizeList(analysisData.fans);

            // Clear any previous data (ensures replacement)
            this.clearAnalysisData();

            // Create storage object with metadata
            const storageObject = {
                followers,
                following,
                nonFollowers,
                fans,
                totalFollowers: followers.length,
                totalFollowing: following.length,
                totalNonFollowers: nonFollowers.length,
                totalFans: fans.length,
                savedAt: new Date().toISOString(),
                version: 1
            };

            // Serialize to JSON
            const jsonString = JSON.stringify(storageObject);
            const bytes = new Blob([jsonString]).size;

            // Warn if data is very large
            if (bytes > this.MAX_SIZE_BYTES) {
                console.warn(`⚠️ Data size (${(bytes / 1024).toFixed(2)}KB) exceeds recommended limit`);
            }

            // Store in localStorage
            localStorage.setItem(this.KEYS.ANALYSIS_DATA, jsonString);
            localStorage.setItem(this.KEYS.DATA_TIMESTAMP, new Date().getTime().toString());

            console.log(`✅ Saved ${storageObject.totalFollowers} followers, ${storageObject.totalNonFollowers} unfollowers to localStorage`);
            return true;

        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('❌ localStorage quota exceeded. Data not saved.');
                alert('Storage full: Clear browser data and try again.');
            } else {
                console.error('❌ Error saving data to localStorage:', e.message);
            }
            return false;
        }
    },

    /**
     * Retrieve analysis data from localStorage
     * Returns null if no data exists or data is corrupted
     * 
     * @returns {object|null} Analysis data or null
     */
    getAnalysisData: function() {
        try {
            const stored = localStorage.getItem(this.KEYS.ANALYSIS_DATA);
            if (!stored) {
                console.log('📭 No data in localStorage');
                return null;
            }

            const data = JSON.parse(stored);
            
            // Validate structure
            if (!data.followers || !Array.isArray(data.followers)) {
                console.error('❌ Invalid data structure in localStorage');
                return null;
            }

            console.log(`📦 Retrieved ${data.totalFollowers} followers, ${data.totalNonFollowers} unfollowers from localStorage`);
            return data;

        } catch (e) {
            console.error('❌ Error retrieving data from localStorage:', e.message);
            return null;
        }
    },

    /**
     * Clear all analysis data from localStorage
     * Called automatically when new file is uploaded
     */
    clearAnalysisData: function() {
        try {
            localStorage.removeItem(this.KEYS.ANALYSIS_DATA);
            localStorage.removeItem(this.KEYS.DATA_TIMESTAMP);
            console.log('🗑️ Cleared previous analysis data');
            return true;
        } catch (e) {
            console.error('❌ Error clearing data:', e.message);
            return false;
        }
    },

    /**
     * Check if valid analysis data exists
     * @returns {boolean}
     */
    hasData: function() {
        try {
            const stored = localStorage.getItem(this.KEYS.ANALYSIS_DATA);
            if (!stored) return false;
            
            const data = JSON.parse(stored);
            return data && data.followers && Array.isArray(data.followers) && data.followers.length > 0;
        } catch (e) {
            return false;
        }
    },

    /**
     * Get data age in seconds
     * @returns {number|null} Age in seconds, or null if no data
     */
    getDataAge: function() {
        try {
            const timestamp = localStorage.getItem(this.KEYS.DATA_TIMESTAMP);
            if (!timestamp) return null;
            
            const savedTime = parseInt(timestamp, 10);
            const now = new Date().getTime();
            return (now - savedTime) / 1000; // convert to seconds
        } catch (e) {
            return null;
        }
    },

    /**
     * Get human-readable data info
     * @returns {string}
     */
    getDataInfo: function() {
        const data = this.getAnalysisData();
        if (!data) return 'No data stored';

        const age = this.getDataAge();
        const ageStr = age < 60 ? `${Math.round(age)}s ago` : 
                       age < 3600 ? `${Math.round(age / 60)}m ago` : 
                       `${Math.round(age / 3600)}h ago`;

        return `${data.totalFollowers} followers | ${data.totalNonFollowers} unfollowers | Saved ${ageStr}`;
    },

    /**
     * Save Stripe session ID for payment tracking
     * @param {string} sessionId - Stripe checkout session ID
     */
    saveSessionId: function(sessionId) {
        try {
            localStorage.setItem(this.KEYS.SESSION_ID, sessionId);
            localStorage.setItem('sessionIdSavedAt', new Date().toISOString());
            console.log('💳 Stripe session saved:', sessionId);
            return true;
        } catch (e) {
            console.error('❌ Error saving session ID:', e.message);
            return false;
        }
    },

    /**
     * Retrieve Stripe session ID
     * @returns {string|null}
     */
    getSessionId: function() {
        return localStorage.getItem(this.KEYS.SESSION_ID);
    },

    /**
     * Save payment unlock status (called after Stripe confirmation)
     * @param {boolean} isUnlocked - Payment status
     */
    setPaymentStatus: function(isUnlocked) {
        try {
            localStorage.setItem(this.KEYS.PAYMENT_STATUS, isUnlocked ? 'true' : 'false');
            localStorage.setItem('paymentStatusUpdatedAt', new Date().toISOString());
            console.log(isUnlocked ? '✅ Payment unlocked' : '❌ Payment locked');
            return true;
        } catch (e) {
            console.error('❌ Error saving payment status:', e.message);
            return false;
        }
    },

    /**
     * Check payment status
     * @returns {boolean}
     */
    isPaymentUnlocked: function() {
        return localStorage.getItem(this.KEYS.PAYMENT_STATUS) === 'true';
    },

    /**
     * Get total data size in bytes
     * @returns {number}
     */
    getTotalSize: function() {
        let total = 0;
        try {
            for (let key in this.KEYS) {
                const stored = localStorage.getItem(this.KEYS[key]);
                if (stored) {
                    total += new Blob([stored]).size;
                }
            }
        } catch (e) {
            console.error('Error calculating size:', e.message);
        }
        return total;
    },

    /**
     * Export all data as JSON (for download or inspection)
     * @returns {string} JSON string
     */
    exportAsJSON: function() {
        const data = this.getAnalysisData();
        if (!data) return null;

        return JSON.stringify({
            exported: new Date().toISOString(),
            data: data
        }, null, 2);
    },

    /**
     * Clear ALL data from localStorage (nuclear option)
     * Used for resetting or testing
     */
    clearAll: function() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            localStorage.removeItem('sessionIdSavedAt');
            localStorage.removeItem('paymentStatusUpdatedAt');
            console.log('🧹 Cleared all unfollower tracking data');
            return true;
        } catch (e) {
            console.error('❌ Error clearing all data:', e.message);
            return false;
        }
    },

    /**
     * Get debug info about all stored data
     * @returns {object}
     */
    getDebugInfo: function() {
        return {
            hasData: this.hasData(),
            dataAge: this.getDataAge(),
            dataSize: this.getTotalSize(),
            paymentUnlocked: this.isPaymentUnlocked(),
            analysisInfo: this.getDataInfo(),
            keys: Object.keys(localStorage)
                .filter(k => k.includes('unfollower'))
                .reduce((acc, k) => {
                    const val = localStorage.getItem(k);
                    acc[k] = val ? val.length + ' bytes' : 'empty';
                    return acc;
                }, {})
        };
    }
};

/**
 * Make available globally for integration
 */
if (typeof window !== 'undefined') {
    window.DataStorageManager = DataStorageManager;
}

// Export for Node.js/module environments (if using bundling)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStorageManager;
}
