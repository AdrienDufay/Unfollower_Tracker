# 💾 Quick LocalStorage Integration - Code Snippets

Copy-paste ready code snippets for integrating localStorage into your site.

---

## 1️⃣ Add Script Tag to HTML Head

Add this to **both** index.html and results-payment-success.html:

```html
<head>
    ...existing head content...
    
    <!-- localStorage Manager - REQUIRED -->
    <script src="./localStorage-manager.js"></script>
    
    ...rest of head...
</head>
```

---

## 2️⃣ Upload Handler - index.html (JavaScript)

When user uploads a ZIP file, add this to your upload event handler:

```javascript
// When file upload STARTS (before processing)
function onFileSelected(file) {
    // CRITICAL: Clear old data immediately
    DataStorageManager.clearAnalysisData();
    
    // Then process the file
    processZipFile(file);
}

// Wire up to file input
document.getElementById('file-upload').addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        onFileSelected(e.target.files[0]);
    }
});

// Also handle drag and drop
document.getElementById('uploadArea').addEventListener('drop', function(e) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        onFileSelected(e.dataTransfer.files[0]);
    }
});
```

---

## 3️⃣ Save Results After Analysis - index.html (JavaScript)

After ZIP analysis completes, save results:

```javascript
// Called when analysis is complete
function onAnalysisComplete(analysisData) {
    // Save to localStorage
    const saved = DataStorageManager.saveAnalysisData(analysisData);
    
    if (saved) {
        console.log('✅ Data saved to localStorage');
        // Show results to user
        displayResults(analysisData);
    } else {
        showError('Failed to save data');
    }
}
```

---

## 4️⃣ Display Preview - index.html (JavaScript)

Show partial results before payment:

```javascript
function displayPartialResults(analysisData) {
    const PREVIEW_LIMIT = 5;
    const unfollowers = analysisData.nonFollowers || [];
    
    // Show only first 5
    const preview = unfollowers.slice(0, PREVIEW_LIMIT);
    
    // Build HTML
    let html = `<h3>Unfollowers Found: ${unfollowers.length}</h3>`;
    html += `<p>Showing first ${Math.min(PREVIEW_LIMIT, unfollowers.length)} of ${unfollowers.length}</p>`;
    
    preview.forEach(user => {
        html += `
            <div class="result-item">
                <img src="${user.profile_pic_url || 'default.png'}" alt="">
                <strong>${user.username}</strong>
            </div>
        `;
    });
    
    // Show payment CTA if more exists
    if (unfollowers.length > PREVIEW_LIMIT) {
        html += `
            <p>🔒 ${unfollowers.length - PREVIEW_LIMIT} more unfollowers hidden</p>
            <button onclick="goToPayment()">Unlock Full List</button>
        `;
    }
    
    document.getElementById('results').innerHTML = html;
}

// Wire it up
onAnalysisComplete = function(data) {
    DataStorageManager.saveAnalysisData(data);
    displayPartialResults(data);
};
```

---

## 5️⃣ Display Full Results - results-payment-success.html (JavaScript)

On success page, retrieve and show full data:

```html
<script src="./localStorage-manager.js"></script>
<script>
    // Run on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Get stored data
        const analysisData = DataStorageManager.getAnalysisData();
        
        if (!analysisData) {
            // No data found, redirect back to upload
            window.location.href = './index.html';
            return;
        }
        
        // Show full results (NOT preview)
        displayFullResults(analysisData);
    });

    function displayFullResults(data) {
        const html = `
            <div class="success-page">
                <h1>✅ Payment Complete</h1>
                
                <div class="stats">
                    <div>
                        <h3>${data.totalFollowers}</h3>
                        <p>Followers</p>
                    </div>
                    <div>
                        <h3>${data.totalGroupFollowers}</h3>
                        <p>Following</p>
                    </div>
                    <div>
                        <h3>${data.totalNonFollowers}</h3>
                        <p>Unfollowers</p>
                    </div>
                    <div>
                        <h3>${data.totalFans}</h3>
                        <p>Don't Follow Back</p>
                    </div>
                </div>
                
                <h2>Your Unfollowers (${data.nonFollowers.length})</h2>
                <div class="unfollower-list">
                    ${data.nonFollowers.map(user => `
                        <div class="user-card">
                            <img src="${user.profile_pic_url || 'default.png'}" alt="">
                            <strong>${user.username}</strong>
                            <p>${user.name}</p>
                        </div>
                    `).join('')}
                </div>
                
                <button onclick="downloadList(${JSON.stringify(data.nonFollowers)})">
                    ⬇️ Download List
                </button>
            </div>
        `;
        
        document.getElementById('content').innerHTML = html;
    }
</script>
```

---

## 6️⃣ Handle Multiple Uploads (Data Replacement)

Automatically clear old data on new upload:

```javascript
// Wrapper function to handle all uploads
async function handleNewFileUpload(file) {
    console.log('📤 New file uploaded, clearing old data');
    
    // CRITICAL: Clear old analysis
    DataStorageManager.clearAnalysisData();
    
    // Show loading state
    showLoadingState();
    
    try {
        // Process ZIP
        const analysisData = await processZipFile(file);
        
        // Save new results
        const saved = DataStorageManager.saveAnalysisData(analysisData);
        
        if (!saved) {
            throw new Error('Failed to save analysis');
        }
        
        // Display preview (5 items)
        showPreviewResults(analysisData);
        
        // Hide loading state
        hideLoadingState();
        
    } catch (error) {
        console.error('Error processing file:', error);
        showError(error.message);
    }
}

// Wire to file input
document.getElementById('file-upload').addEventListener('change', e => {
    if (e.target.files[0]) {
        handleNewFileUpload(e.target.files[0]);
    }
});
```

---

## 7️⃣ Payment Status Management

Track payment status:

```javascript
// When user clicks "Unlock" button
function goToPayment() {
    const data = DataStorageManager.getAnalysisData();
    if (!data) {
        alert('Please upload a file first');
        return;
    }
    
    // Optional: Save Stripe session ID if available
    // const sessionId = 'cs_test_abc123...';
    // DataStorageManager.saveSessionId(sessionId);
    
    // Redirect to Stripe (or open modal)
    window.location.href = 'https://buy.stripe.com/your-link';
}

// After payment succeeds (on success page)
document.addEventListener('DOMContentLoaded', function() {
    // Check Stripe confirmed payment
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
        // Mark as paid
        DataStorageManager.setPaymentStatus(true);
        DataStorageManager.saveSessionId(sessionId);
    }
    
    // Load and display full data
    const data = DataStorageManager.getAnalysisData();
    if (data) {
        displayFullResults(data);
    }
});
```

---

## 8️⃣ Download Results Function

Allow users to download their unfollower list:

```javascript
function downloadUnfollowerList(analysisData) {
    const unfollowers = analysisData.nonFollowers || [];
    
    // Create CSV
    let csv = 'username,name,profile_url\n';
    unfollowers.forEach(user => {
        csv += `"${user.username}","${user.name}","${user.profile_pic_url || ''}"\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unfollowers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ Downloaded ${unfollowers.length} unfollowers`);
}

// Wire to download button
document.querySelector('#download-btn').addEventListener('click', function() {
    const data = DataStorageManager.getAnalysisData();
    if (data) {
        downloadUnfollowerList(data);
    }
});
```

---

## 9️⃣ Error Handling

Gracefully handle storage errors:

```javascript
function saveDataWithErrorHandling(analysisData) {
    try {
        // Clear old data
        DataStorageManager.clearAnalysisData();
        
        // Try to save
        const success = DataStorageManager.saveAnalysisData(analysisData);
        
        if (!success) {
            showError('⚠️ Could not save data. Storage may be full.');
            return false;
        }
        
        console.log('✅ Data saved successfully');
        return true;
        
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            showError('Storage quota exceeded. Clear browser cache and try again.');
        } else {
            showError('Error saving data: ' + error.message);
        }
        return false;
    }
}
```

---

## 🔟 Debug Utilities

Helper functions for debugging:

```javascript
// Print all stored data to console
function debugShowAllData() {
    const data = DataStorageManager.getAnalysisData();
    console.log('📦 All Stored Data:', data);
}

// Print summary info
function debugShowInfo() {
    console.log(`
        Has Data: ${DataStorageManager.hasData()}
        Info: ${DataStorageManager.getDataInfo()}
        Payment Unlocked: ${DataStorageManager.isPaymentUnlocked()}
        Size: ${(DataStorageManager.getTotalSize() / 1024).toFixed(2)} KB
        Debug: ${JSON.stringify(DataStorageManager.getDebugInfo(), null, 2)}
    `);
}

// Export data for backup
function debugExportData() {
    const json = DataStorageManager.exportAsJSON();
    console.log(json);
    // Copy from console and save to file
}

// Clear everything (nuclear option)
function debugClearAll() {
    if (confirm('Really clear ALL data?')) {
        DataStorageManager.clearAll();
        console.log('✅ All data cleared');
    }
}

// Make debug functions available in console
window.debug = {
    showAll: debugShowAllData,
    showInfo: debugShowInfo,
    export: debugExportData,
    clearAll: debugClearAll
};

// Usage in browser console:
// debug.showInfo()
// debug.export()
// debug.clearAll()
```

---

## Summary: Integration Checklist

- [ ] Add `localStorage-manager.js` to `<head>` of index.html
- [ ] Add `localStorage-manager.js` to `<head>` of results-payment-success.html
- [ ] Call `DataStorageManager.clearAnalysisData()` when new file uploaded
- [ ] Call `DataStorageManager.saveAnalysisData(data)` after analysis completes
- [ ] Show preview (first 5) on index.html
- [ ] Call `DataStorageManager.getAnalysisData()` on success page
- [ ] Display full results (all items) on success page
- [ ] Test data replacement with multiple uploads
- [ ] Test persistence across page reloads
- [ ] Test across multiple browsers

**Done!** Your localStorage integration is complete. 🎉

