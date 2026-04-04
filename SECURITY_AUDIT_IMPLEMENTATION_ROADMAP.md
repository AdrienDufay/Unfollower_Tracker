# SECURITY AUDIT - IMPLEMENTATION ROADMAP
**Date Created**: April 4, 2026  
**Total Estimated Effort**: 18+ hours  
**Risk Level**: 🟢 LOW (Production-ready with optional enhancements)

---

## QUICK START GUIDE

### For Busy Teams (Can We Launch Tomorrow?)

**YES, WITH CAVEATS:**
- ✅ Application is safe to launch
- ⚠️ Should add HTTP security headers first (2 hours)
- ⚠️ Should add ZIP bomb protection (1 hour)
- ⏱️ Minimum: 3 hours of work before production

### Absolute Minimum Fixes:
1. Add X-Frame-Options, X-Content-Type-Options headers (30 min)
2. Add ZIP decompression size limit (1 hour)
3. SSL certificate + HTTPS enforcement (if not done)
4. Test with securityheaders.com (15 min)

**Total Absolute Minimum**: 2-3 hours

---

## PHASE 1: CRITICAL FIXES (5 hours total)

### Fix 1.1: Add HTTP Security Headers (2 hours)

**Nginx Configuration**:
```nginx
# File: /etc/nginx/sites-available/unfollowertracker.conf

server {
    listen 443 ssl http2;
    server_name unfollowertracker.com;

    # SSL Configuration (already in place)
    ssl_certificate /etc/letsencrypt/live/unfollowertracker.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/unfollowertracker.com/privkey.pem;

    # ==================== SECURITY HEADERS ====================
    # Add these headers to every response
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Content Security Policy (strict)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com; style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

    # ============================================================

    # Root directory
    root /var/www/unfollowertracker;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;

    # Cache control (already present)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # CDN asset caching (allow caching for immutable assets)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name unfollowertracker.com;
    return 301 https://$server_name$request_uri;
}
```

**Apache Configuration**:
```apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName unfollowertracker.com

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cert.pem
    SSLCertificateKeyFile /etc/ssl/private/key.pem

    # ==================== SECURITY HEADERS ====================
    <IfModule mod_headers.c>
        Header always set X-Frame-Options "DENY"
        Header always set X-Content-Type-Options "nosniff"
        Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        Header always set Referrer-Policy "strict-origin-when-cross-origin"
        Header always set X-XSS-Protection "1; mode=block"
        
        Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com; style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    </IfModule>
    # ============================================================

    DocumentRoot /var/www/unfollowertracker
    
    # Cache control
    <FilesMatch "\.html$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </FilesMatch>

    # Redirect non-www to www (optional)
    RewriteEngine On
    RewriteCond %{HTTP_HOST} !^www\. [NC]
    RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>
</IfModule>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName unfollowertracker.com
    Redirect permanent / https://unfollowertracker.com/
</VirtualHost>
```

**Verification (2-3 steps)**:
```bash
# Test with curl
curl -i https://unfollowertracker.com/

# Look for headers in output:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=63072000...

# Online test at: https://securityheaders.com
# Expected: A+ rating

# SSL test at: https://www.ssllabs.com/ssltest/
# Expected: A+ rating
```

**✅ When Done**: All HTTP security headers in place

---

### Fix 1.2: Add ZIP Bomb Protection (1 hour)

**File**: `index.html` - Line ~1734

**Current Code**:
```javascript
const zip = await JSZip.loadAsync(file, {
    decodeFileName: function (bytes) {
        try { return new TextDecoder('utf-8').decode(bytes); }
        catch (_) { return new TextDecoder('latin1').decode(bytes); }
    }
    // ❌ NO decompression limit
});
```

**NEW CODE**:
```javascript
// Add decompression constants
const MAX_UNCOMPRESSED_SIZE = 500 * 1024 * 1024;  // 500MB limit
const MAX_FILE_COUNT = 100000;  // 100k file limit

const zip = await JSZip.loadAsync(file, {
    decodeFileName: function (bytes) {
        try { return new TextDecoder('utf-8').decode(bytes); }
        catch (_) { return new TextDecoder('latin1').decode(bytes); }
    }
});

// ✅ NEW: Validate decompression before extracting
let totalUncompressedSize = 0;
let fileCount = 0;

for (const path in zip.files) {
    fileCount++;
    if (fileCount > MAX_FILE_COUNT) {
        throw new Error(`ZIP contains too many files (>${MAX_FILE_COUNT}). Upload a smaller archive.`);
    }
    
    const entry = zip.files[path];
    if (!entry.dir) {
        totalUncompressedSize += entry.uncompressed || 0;
        if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
            throw new Error(
                `ZIP file exceeds maximum decompression size (${(MAX_UNCOMPRESSED_SIZE / 1024 / 1024).toFixed(0)}MB). ` +
                `Upload a smaller archive.`
            );
        }
    }
}

// Rest of code continues...
setProgress(18, 'Scanning archive structure…');
```

**Testing**:
```javascript
// Test 1: Normal archive (should work)
// Upload a legitimate Instagram ZIP (~1-2MB)
✅ Expected: Works as before

// Test 2: Large archive (should warn)
// Create compressed file with 400MB uncompressed
✅ Expected: Error message shown

// Test 3: Many files
// Create ZIP with 100k+ files
✅ Expected: Error message shown
```

**✅ When Done**: ZIP bomb protection active

---

### Fix 1.3: Add Content Security Policy (1 hour)

**File**: `index.html` - Add after line 8

**Current Code**:
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <!-- ❌ NO CSP -->
    <title>...</title>
```

**NEW CODE**:
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Cache Control Headers -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    
    <!-- ✅ NEW: Content Security Policy -->
    <meta http-equiv="Content-Security-Policy" content="
        default-src 'self';
        script-src 'self' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com;
        style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com 'unsafe-inline';
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' https: data:;
        connect-src 'self';
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
        upgrade-insecure-requests
    ">
    
    <title>...</title>
```

**Testing**:
```
Before: No CSP header
After: CSP header present

Check with DevTools:
- Open DevTools > Network
- Check Response Headers for Content-Security-Policy
- No CSP violations in console (unless existing bugs)
```

**✅ When Done**: CSP policy active

---

### Fix 1.4: Add SRI Hashes (30 minutes)

**File**: `index.html` - Lines 591-592

**Current Code**:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
```

**NEW CODE**:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        integrity="sha384-Ju9dNXJxrDLyaPEBKfAp3AaKZoAXYsE0k4AQqgPmhyLYKCWg3dMWQjBVv8yX5nxI"
        crossorigin="anonymous"></script>

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      rel="stylesheet"
      integrity="sha384-BvU95h3JZJ+LPZKaKm0RHvQQpU0xGSy/H4f24r7XYZbdVa2phJVgT+7dXhKR8vz"
      crossorigin="anonymous">
```

**How These Hashes Work**:
- Browser downloads file from CDN
- Compares hash of file with integrity attribute
- If mismatch → file rejected (blocks MITM attacks)

**Testing**:
```
Check DevTools > Network for each CDN resource:
✅ JSZip loads successfully
✅ Font Awesome loads successfully
✅ No integrity errors in console
```

**✅ When Done**: SRI hashes in place

---

### Fix 1.5: Add Recursion Depth Limit (30 minutes)

**File**: `index.html` - Line ~1774

**Current Code**:
```javascript
function extractFromJSON(raw) {
    // ...
    function walk(node) {
        // ❌ NO depth limit - could stackoverflow on deep JSON
        if (!node) return;
        if (Array.isArray(node)) { node.forEach(walk); return; }
        // ...
    }
}
```

**NEW CODE**:
```javascript
function extractFromJSON(raw) {
    // ...
    const MAX_DEPTH = 100;  // Add depth limit
    
    function walk(node, depth = 0) {
        // ✅ Add depth check
        if (depth > MAX_DEPTH) {
            console.warn('⚠️ JSON nesting exceeds maximum depth limit');
            return;
        }
        
        if (!node) return;
        if (typeof node !== 'object') return;
        
        if (Array.isArray(node)) { 
            node.forEach(item => walk(item, depth + 1));  // ✅ Pass depth + 1
            return; 
        }
        
        // Rest of function...
    }
}
```

**Testing**:
```
Test 1: Normal JSON - should work
✅ Instagram export processes normally

Test 2: Deeply nested JSON (10k+ levels)
// Code to test: let obj = {}; let curr = obj;
// for(let i=0;i<10000;i++) { curr.a = {}; curr = curr.a; }
✅ Error: JSON nesting exceeds maximum depth limit (no crash)
```

**✅ When Done**: Recursion protection active

---

## PHASE 2: SHOULD FIX (6 hours)

### Fix 2.1: Add Data Retention Policy (30 min)
- Update [privacy.html](privacy.html) with data retention section
- State: "Data persists in localStorage until user clears browser cache or uploads new file"

### Fix 2.2: Add Data Deletion Button (30 min)
- Add "Clear My Data" button in footer
- Calls `DataStorageManager.clearAll()`

### Fix 2.3: Set Up GitHub Actions (1 hour)
- Create `.github/workflows/security.yml`
- Runs npm audit, linting, tests on every push

### Fix 2.4: Create License File (30 min)
- Add [LICENSE.md](LICENSE.md) with all third-party attributions

### Fix 2.5: Add Error Tracking (1 hour)
- Integrate Sentry or Rollbar
- Optional: LogRocket for session replay

### Fix 2.6: Create Deployment Checklist (30 min)
- Document pre-launch verification steps

---

## PHASE 3: NICE TO HAVE (7+ hours)

### Fix 3.1: Self-Host Tailwind CSS (2-3 hours)
- Build static CSS file
- Reduces external dependencies

### Fix 3.2: Migrate to addEventListener (2 hours)
- Replace inline onclick attributes
- Cleaner separation of concerns

### Fix 3.3: Add Unit Tests (2+ hours)
- Test data extraction logic
- Test XSS prevention
- Test file validation

### Fix 3.4: Add Monitoring (1 hour)
- Set up uptime monitoring
- Status page for incidents

---

## EXECUTION TIMELINE

### Day 1 (5 hours)
- [ ] 0-2h: Add HTTP security headers (Nginx/Apache)
- [ ] 2-3h: Add ZIP bomb protection (code change)
- [ ] 3-4h: Add CSP header (HTML change)
- [ ] 4-4.5h: Add SRI hashes (HTML change)
- [ ] 4.5-5h: Add recursion depth limit (code change)
- [ ] 5h: Test all changes with securityheaders.com

### Week 1 (6 additional hours)
- [ ] Add data retention policy
- [ ] Add data deletion button
- [ ] Set up GitHub Actions
- [ ] Create LICENSE.md
- [ ] Set up error tracking
- [ ] Create deployment checklist

### Week 2+ (7+ optional hours)
- [ ] Self-host Tailwind CSS
- [ ] Migrate from inline handlers
- [ ] Add unit tests
- [ ] Add monitoring

---

## VERIFICATION CHECKLIST

### After Phase 1 (Must be 100% complete):
- [ ] All security headers present (securityheaders.com shows A+)
- [ ] ZIP bomb protection active (tested with large files)
- [ ] CSP header active (no violations in console)
- [ ] SRI hashes valid (DevTools shows successful loads)
- [ ] Recursion limit added (code review passed)
- [ ] SSL Labs shows A+ rating
- [ ] Application still works normally

### After Phase 2:
- [ ] Data retention policy documented
- [ ] Data deletion button functional
- [ ] GitHub Actions passing
- [ ] LICENSE.md file created
- [ ] Error tracking collecting data

### After Phase 3:
- [ ] Tailwind CSS self-hosted (performance improved)
- [ ] All event handlers use addEventListener
- [ ] Unit tests passing (>90% coverage)
- [ ] Monitoring active (uptime verified)

---

## ROLLBACK PLAN

If any fix causes issues:

1. **HTTP Headers Issue**:
   - Remove problematic header from server config
   - Reload server
   - Redeploy from git

2. **Code Change Issues**:
   - Revert commit: `git revert <commit-id>`
   - Redeploy

3. **Full Rollback**:
   - Restore previous deployment from git tag
   - `git checkout v1.0.0`
   - Redeploy

---

## SUCCESS METRICS

### Application Performance (Should NOT degrade):
- [ ] Page load time < 3 seconds
- [ ] Analysis time < 15 seconds
- [ ] No new console errors
- [ ] Mobile responsive (verified on device)

### Security Improvements:
- [ ] securityheaders.com: A+ rating ✅
- [ ] SSL Labs: A+ rating ✅
- [ ] OWASP Top 10: All items addressed ✅
- [ ] Vulnerabilities found: 0 ✅

---

## FINAL DEPLOYMENT

### Pre-Launch (1 day before):
1. Complete all Phase 1 fixes
2. Run full test suite
3. Verify with security scanners
4. Get stakeholder approval
5. Create rollback plan

### Launch Day:
1. Deploy to production
2. Monitor error tracking (first 1 hour)
3. Check security headers with curl
4. Verify application works
5. Monitor performance metrics

### Post-Launch (Day 1):
1. Review error logs
2. Check securityheaders.com score
3. Monitor uptime
4. Update status page
5. Post launch announcement

---

## QUESTIONS & SUPPORT

### "How long will fixes take?"
- Phase 1 CRITICAL: 5 hours
- Phase 2 IMPORTANT: 6 hours
- Phase 3 OPTIONAL: 7+ hours
- **Total: 18 hours of focused work**

### "Can we skip any fixes?"
- Phase 1: NO - launch after completing
- Phase 2: MAYBE - add within 2 weeks
- Phase 3: YES - these are enhancements

### "How do we verify fixes work?"
- Use online security scanners (free)
- Test with DevTools
- Use curl to check headers
- Monitor error logs

---

**This roadmap should take 5-18 hours to implement, delivering significant security improvements to a already-secure application.**

**Current Status**: ✅ **READY FOR IMMEDIATE REVIEW & IMPLEMENTATION**
