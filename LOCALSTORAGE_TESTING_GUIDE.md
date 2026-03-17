# 🧪 LocalStorage Testing & Verification Guide

Complete end-to-end testing procedures for the localStorage data persistence system.

---

## 📋 Pre-Test Checklist

- [ ] `localStorage-manager.js` added to index.html
- [ ] `localStorage-manager.js` added to results-payment-success.html
- [ ] Both files in same directory
- [ ] Browser Developer Tools available (F12)
- [ ] Test ZIP file or sample JSON data ready
- [ ] Stripe test mode enabled

---

## 🧬 UNIT TESTS - localStorage-manager.js Functions

### Test 1: Save Analysis Data

**Procedure:**
```javascript
// In browser console:

// Create test data
const testData = {
    followers: [
        {username: 'user1', name: 'User One'},
        {username: 'user2', name: 'User Two'},
        {username: 'user3', name: 'User Three'},
    ],
    following: [
        {username: 'user1', name: 'User One'},
        {username: 'user2', name: 'User Two'},
    ],
    nonFollowers: [
        {username: 'user3', name: 'User Three'},
    ],
    fans: []
};

// Save it
const result = DataStorageManager.saveAnalysisData(testData);
console.log('Save result:', result);  // Should print: true
```

**Expected:**
- ✅ Console shows: `✅ Saved 3 followers, 1 unfollowers to localStorage`
- ✅ Function returns `true`
- ✅ No errors in console

**Verify in DevTools:**
1. Open DevTools (F12)
2. Application → Local Storage
3. Find key: `unfollower_analysis_data_v1`
4. Value should contain your test data

---

### Test 2: Retrieve Analysis Data

**Procedure:**
```javascript
// In browser console:

const retrieved = DataStorageManager.getAnalysisData();
console.log('Retrieved data:', retrieved);
```

**Expected:**
- ✅ Console shows the exact data you saved
- ✅ Properties: `followers`, `following`, `nonFollowers`, `fans`
- ✅ Shows `totalFollowers: 3`, `totalNonFollowers: 1`

---

### Test 3: Check Data Exists

**Procedure:**
```javascript
// In browser console:

const hasData = DataStorageManager.hasData();
console.log('Has data:', hasData);  // Should be: true
```

**Expected:**
- ✅ Returns `true` if data saved
- ✅ Returns `false` if data not present

---

### Test 4: Clear Analysis Data

**Procedure:**
```javascript
// In browser console:

DataStorageManager.clearAnalysisData();
console.log('After clear:', DataStorageManager.hasData());  // Should be: false
```

**Expected:**
- ✅ Console shows: `🗑️ Cleared previous analysis data`
- ✅ `hasData()` returns `false`
- ✅ DevTools shows localStorage key removed

---

### Test 5: Data Info String

**Procedure:**
```javascript
// In browser console:

// Save data first
const testData = {
    followers: Array(100).fill({username: 'test'}),
    following: Array(50).fill({username: 'test'}),
    nonFollowers: Array(15).fill({username: 'test'}),
    fans: Array(5).fill({username: 'test'}),
};
DataStorageManager.saveAnalysisData(testData);

// Get info
const info = DataStorageManager.getDataInfo();
console.log(info);  // Should show: "100 followers | 15 unfollowers | Saved 0s ago"
```

**Expected:**
- ✅ Returns readable string like: `"100 followers | 15 unfollowers | Saved 5s ago"`
- ✅ Updates with fresh data

---

## 🔄 INTEGRATION TESTS - Full Application Flow

### Test 6: Complete Upload → Save Flow

**Procedure:**

1. **Prepare test data (JSON)**
   ```json
   {
     "followers": [
       {"username": "john_doe", "name": "John Doe"},
       {"username": "jane_smith", "name": "Jane Smith"},
       {"username": "alice_wonder", "name": "Alice Wonder"},
       {"username": "bob_builder", "name": "Bob Builder"},
       {"username": "charlie_brown", "name": "Charlie Brown"},
       {"username": "dave_grohl", "name": "Dave Grohl"}
     ],
     "following": [
       {"username": "john_doe", "name": "John Doe"},
       {"username": "jane_smith", "name": "Jane Smith"},
       {"username": "alice_wonder", "name": "Alice Wonder"}
     ]
   }
   ```

2. **Upload the test file**
   - Go to index.html
   - Upload ZIP containing the JSON
   - Watch the analysis run

3. **Check localStorage**
   - Open DevTools (F12)
   - Application → Local Storage
   - Verify data saved

**Expected:**
- ✅ Analysis completes without error
- ✅ Console shows: `✅ Saved 6 followers, 3 unfollowers...`
- ✅ localStorage contains `unfollower_analysis_data_v1` key
- ✅ Data matches uploaded file

---

### Test 7: Data Persistence Through Page Reload

**Procedure:**

1. **Upload file** (from Test 6)
2. **Verify data saved** in localStorage
3. **Press F5** to reload page
4. **Check localStorage again**
   ```javascript
   // In console:
   DataStorageManager.getAnalysisData()
   ```

**Expected:**
- ✅ Data is still there after reload
- ✅ No data loss
- ✅ Same timestamps and values

---

### Test 8: Automatic Data Replacement on New Upload

**Critical Test - Verify old data is completely replaced**

**Procedure:**

1. **Upload FILE A**
   - Contains 10 unfollowers named: alice, bob, charlie...
   - Wait for save
   - Console: `DataStorageManager.getAnalysisData().nonFollowers.length`  → should be 10

2. **Upload FILE B**
   - Contains 5 different unfollowers named: david, emily, frank...
   - Wait for save
   - Console: `DataStorageManager.getAnalysisData().nonFollowers.length`  → should be 5 (not 15!)

3. **Verify old data is gone**
   ```javascript
   const data = DataStorageManager.getAnalysisData();
   
   // Should NOT contain FILE A's users
   const hasOldData = data.nonFollowers.some(u => 
     ['alice', 'bob', 'charlie'].includes(u.username)
   );
   console.log('Has old data:', hasOldData);  // Should be: false
   
   // Should contain FILE B's users
   const hasNewData = data.nonFollowers.some(u => 
     ['david', 'emily', 'frank'].includes(u.username)
   );
   console.log('Has new data:', hasNewData);  // Should be: true
   ```

**Expected:**
- ✅ nonFollowers count = 5 (FILE B only)
- ✅ `hasOldData` = false
- ✅ `hasNewData` = true
- ✅ Old user names completely gone
- ✅ **Zero duplicated data**

---

### Test 9: Payment Status Tracking

**Procedure:**

1. **Check initial status**
   ```javascript
   DataStorageManager.isPaymentUnlocked()  // Should be: false
   ```

2. **Set to paid**
   ```javascript
   DataStorageManager.setPaymentStatus(true);
   ```

3. **Verify paid status**
   ```javascript
   DataStorageManager.isPaymentUnlocked()  // Should be: true
   ```

4. **Reset**
   ```javascript
   DataStorageManager.setPaymentStatus(false);
   DataStorageManager.isPaymentUnlocked()  // Should be: false
   ```

**Expected:**
- ✅ Status correctly toggles
- ✅ Value persists in localStorage
- ✅ Key: `unfollower_payment_status_v1`

---

## 🔗 E2E TESTS - Complete User Journey

### Test 10: Full Payment Flow Simulation

**Scenario:** User uploads file → sees preview → pays → sees full results

**Procedure:**

#### Step 1: Upload ZIP
1. Go to [index.html](index.html)
2. Upload test ZIP with 20 unfollowers
3. Wait for analysis to complete
4. Console: `DataStorageManager.getDataInfo()`
5. **Verify:** Shows "20 unfollowers | Saved 0s ago"

#### Step 2: Preview Display
1. Page shows first 5 unfollowers (preview)
2. Button shows: "🔓 Unlock Full List (15 more)"
3. **Verify:** Preview limit works (5 items shown max)

#### Step 3: Simulate Stripe Payment
1. Click "Unlock Full List" button
2. Opens Stripe checkout (or mock in test)
3. **Verify:** localStorage data still intact
   ```javascript
   DataStorageManager.getAnalysisData().nonFollowers.length  // Still 20
   ```

#### Step 4: Stripe Success Redirect
1. After payment, Stripe redirects to `/payment-success?session_id=...`
2. results-payment-success.html loads
3. Page calls: `loadStoredAnalysisOnSuccess()`
4. **Verify:** Full results display (all 20 unfollowers)

#### Step 5: Full Results Visible
1. See all 20 unfollowers listed
2. See "Don't Follow Back" tab with fan data
3. Download button available
4. **Verify:** All data retrieved from localStorage successfully

---

### Test 11: Multiple Payment Cycles with Different Files

**Scenario:** Upload file A, pay, upload file B (new payment), verify file B shows

**Procedure:**

1. **Cycle 1: File A**
   - Upload FILE A (10 unfollowers: alice, bob, charlie...)
   - Save to localStorage
   - Simulate payment → success page shows FILE A data
   - Close all tabs

2. **Cycle 2: File B**
   - New browser tab
   - Upload FILE B (15 unfollowers: david, emily, frank...)
   - DATA REPLACEMENT should clear FILE A
   - Verify: localStorage has ONLY FILE B (not 25 items)
   ```javascript
   DataStorageManager.getAnalysisData().nonFollowers.length  // Should be 15
   ```

3. **Cycle 3: File C**
   - Upload FILE C (5 unfollowers)
   - Verify: localStorage has ONLY FILE C (not 35 items)
   ```javascript
   DataStorageManager.getAnalysisData().nonFollowers.length  // Should be 5
   ```

**Expected:**
- ✅ File A completely replaced by File B
- ✅ File B completely replaced by File C
- ✅ Each cycle shows only latest data
- ✅ No accumulation or duplication

---

## 🧩 EDGE CASE TESTS

### Test 12: Corrupted localStorage Data

**Procedure:**

1. **Manually corrupt data**
   ```javascript
   localStorage.setItem('unfollower_analysis_data_v1', 'invalid json {{{');
   ```

2. **Try to retrieve**
   ```javascript
   const data = DataStorageManager.getAnalysisData();
   console.log(data);  // Should be: null
   ```

3. **Verify fallback**
   ```javascript
   DataStorageManager.hasData()  // Should be: false
   ```

**Expected:**
- ✅ No error thrown
- ✅ Returns `null` gracefully
- ✅ Console shows error message (not crash)
- ✅ App continues functioning

---

### Test 13: Missing or Invalid Data Fields

**Procedure:**

1. **Save incomplete data**
   ```javascript
   const badData = {
       nonFollowers: null,  // Missing field
       followers: [1, 2, 3]  // Not array of objects
   };
   DataStorageManager.saveAnalysisData(badData);
   ```

2. **Check retrieval**
   ```javascript
   const retrieved = DataStorageManager.getAnalysisData();
   console.log(retrieved.fans);  // Should work or be empty array
   ```

**Expected:**
- ✅ Saved successfully (data normalized)
- ✅ Missing fields become empty arrays
- ✅ No crashes

---

### Test 14: Large Dataset (Performance)

**Procedure:**

1. **Create large test set**
   ```javascript
   const largeData = {
       followers: Array(10000).fill(null).map((_, i) => ({
           username: `user${i}`,
           name: `User ${i}`
       })),
       following: Array(5000).fill(null).map((_, i) => ({
           username: `following${i}`,
           name: `Following ${i}`
       })),
       nonFollowers: Array(2000).fill(null).map((_, i) => ({
           username: `unfollower${i}`,
           name: `Unfollower ${i}`
       })),
       fans: Array(1000).fill(null).map((_, i) => ({
           username: `fan${i}`,
           name: `Fan ${i}`
       }))
   };
   ```

2. **Time the save**
   ```javascript
   console.time('save');
   DataStorageManager.saveAnalysisData(largeData);
   console.timeEnd('save');  // Should be < 100ms
   ```

3. **Time the retrieval**
   ```javascript
   console.time('retrieve');
   const retrieved = DataStorageManager.getAnalysisData();
   console.timeEnd('retrieve');  // Should be < 50ms
   ```

4. **Check size**
   ```javascript
   const sizeKB = DataStorageManager.getTotalSize() / 1024;
   console.log(`Size: ${sizeKB.toFixed(2)} KB`);  // Should be < 5MB
   ```

**Expected:**
- ✅ Save completes in < 100ms
- ✅ Retrieve completes in < 50ms
- ✅ Total size < 5MB
- ✅ No localStorage quota errors

---

## 📊 BROWSER COMPATIBILITY TESTS

### Test 15: Cross-Browser Verification

Test these browsers:

| Browser | Test URL | Status |
|---------|----------|--------|
| Chrome | index.html | Run Test 10 |
| Firefox | index.html | Run Test 10 |
| Safari | index.html | Run Test 10 |
| Edge | index.html | Run Test 10 |
| Mobile Chrome | index.html | Run Test 10 |
| Mobile Safari | index.html | Run Test 10 |

**Procedure per browser:**
1. Upload test file
2. Verify data saves: `DataStorageManager.getDataInfo()`
3. Reload page
4. Verify data persists
5. Upload new file
6. Verify data replaces

**Expected:**
- ✅ All browsers save/retrieve correctly
- ✅ No compatibility warnings
- ✅ Consistent behavior across all

---

## 🎯 SIGN-OFF CHECKLIST

After completing all tests, verify:

### Core Functionality
- [ ] Test 1: Save data successfully
- [ ] Test 2: Retrieve data correctly
- [ ] Test 3: Check data exists
- [ ] Test 4: Clear data removes it
- [ ] Test 5: Data info string formats correctly

### Integration
- [ ] Test 6: Upload → Save completes
- [ ] Test 7: Data persists through reload
- [ ] Test 8: **New upload replaces old data completely**
- [ ] Test 9: Payment status tracking works
- [ ] Test 10: Full payment flow works end-to-end

### Edge Cases
- [ ] Test 11: Multiple cycles work correctly
- [ ] Test 12: Corrupted data handled gracefully
- [ ] Test 13: Invalid data fields handled
- [ ] Test 14: Large datasets perform well

### Browser Compatibility
- [ ] Test 15: All major browsers work

---

## 🚀 MANUAL TESTING SCRIPT

**Run this complete flow to verify everything:**

```javascript
// ═══════════════════════════════════════════════════════════════════════
// COMPLETE VERIFICATION SCRIPT - Paste in browser console
// ═══════════════════════════════════════════════════════════════════════

console.clear();
console.log('🧪 Starting Complete LocalStorage Verification Tests\n');

// Test Data
const testDataA = {
    followers: Array(50).fill(null).map((_, i) => ({username: `follower${i}`, name: `Follower ${i}`})),
    following: Array(30).fill(null).map((_, i) => ({username: `following${i}`, name: `Following ${i}`})),
    nonFollowers: Array(10).fill(null).map((_, i) => ({username: `unfollower${i}`, name: `Unfollower ${i}`})),
    fans: Array(5).fill(null).map((_, i) => ({username: `fan${i}`, name: `Fan ${i}`}))
};

const testDataB = {
    followers: Array(100).fill(null).map((_, i) => ({username: `user${i}`, name: `User ${i}`})),
    following: Array(60).fill(null).map((_, i) => ({username: `following_b${i}`, name: `Following B ${i}`})),
    nonFollowers: Array(20).fill(null).map((_, i) => ({username: `unfollower_b${i}`, name: `Unfollower B ${i}`})),
    fans: Array(15).fill(null).map((_, i) => ({username: `fan_b${i}`, name: `Fan B ${i}`}))
};

// Run tests
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (e) {
        console.error(`❌ ${name}: ${e.message}`);
        testsFailed++;
    }
}

// Test Suite
test('Save test data A', () => {
    DataStorageManager.clearAnalysisData();
    const result = DataStorageManager.saveAnalysisData(testDataA);
    if (!result) throw new Error('Save failed');
});

test('Retrieve test data A', () => {
    const retrieved = DataStorageManager.getAnalysisData();
    if (!retrieved) throw new Error('Retrieve failed');
    if (retrieved.totalFollowers !== 50) throw new Error('Follower count mismatch');
});

test('Data persists through reload', () => {
    const before = DataStorageManager.getAnalysisData();
    // Simulate reload - data should still be there
    const after = DataStorageManager.getAnalysisData();
    if (before.totalFollowers !== after.totalFollowers) throw new Error('Data changed');
});

test('New upload replaces old data', () => {
    const dataBefore = DataStorageManager.getAnalysisData();
    console.log(`   Before: ${dataBefore.totalFollowers} followers, ${dataBefore.totalNonFollowers} unfollowers`);
    
    DataStorageManager.clearAnalysisData();
    DataStorageManager.saveAnalysisData(testDataB);
    
    const dataAfter = DataStorageManager.getAnalysisData();
    console.log(`   After:  ${dataAfter.totalFollowers} followers, ${dataAfter.totalNonFollowers} unfollowers`);
    
    if (dataAfter.totalFollowers !== 100) throw new Error('Data B not saved correctly');
    if (dataAfter.totalNonFollowers !== 20) throw new Error('Data B unfollowers incorrect');
    
    // Verify old data is gone
    if (dataAfter.nonFollowers.some(u => u.username.startsWith('unfollower0'))) {
        throw new Error('Old data still exists!');
    }
});

test('Payment status tracking', () => {
    DataStorageManager.setPaymentStatus(false);
    if (DataStorageManager.isPaymentUnlocked()) throw new Error('Should be locked');
    
    DataStorageManager.setPaymentStatus(true);
    if (!DataStorageManager.isPaymentUnlocked()) throw new Error('Should be unlocked');
});

test('Clear all data', () => {
    DataStorageManager.clearAll();
    if (DataStorageManager.hasData()) throw new Error('Data not cleared');
    if (DataStorageManager.isPaymentUnlocked()) throw new Error('Payment not cleared');
});

// Report
console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review errors above.`);
}
console.log(`${'═'.repeat(50)}\n`);
```

---

## 📝 Test Results Documentation

Save results to a file:

```
Date: March 17, 2026
Tester: [Your Name]

Tests Passed: __/15
Tests Failed: __/15

Issues Found:
- [List any issues]

Browsers Tested:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile

Overall Status: [ ] PASS [ ] FAIL

Notes:
[Additional notes or observations]
```

---

## ✅ Ready for Deployment When:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All edge case tests pass
- [ ] Data replacement completely verified
- [ ] Cross-browser tested
- [ ] No console errors
- [ ] Performance acceptable (<100ms save/retrieve)
- [ ] No localStorage quota issues

**You're ready to go live!** 🚀

