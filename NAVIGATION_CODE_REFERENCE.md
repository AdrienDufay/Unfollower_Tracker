# Navigation Code Examples - Reference Guide

## Reference for Building More Pages

### ✅ DO: Relative Paths with `./`

**In index.html (root level):**
```html
<!-- Navigation to other root-level pages -->
<a href="./privacy.html">Privacy Policy</a>
<a href="./terms.html">Terms of Service</a>
<a href="./about.html">About Us</a>

<!-- Link to CSS in css folder -->
<link rel="stylesheet" href="./css/styles.css">

<!-- Link to JS in js folder -->
<script src="./js/main.js"></script>

<!-- Image in assets folder -->
<img src="./assets/images/logo.png" alt="Logo">
```

**In privacy.html (root level):**
```html
<!-- Back to root level -->
<a href="./index.html">Back to Home</a>

<!-- Link to other root pages -->
<a href="./terms.html">Terms of Service</a>
<a href="./about.html">About Us</a>

<!-- Link to CSS (same as index.html) -->
<link rel="stylesheet" href="./css/styles.css">

<!-- Link to JS -->
<script src="./js/main.js"></script>
```

---

### ✗ DON'T: Absolute Paths

```html
<!-- ✗ These break on different machines/configurations -->
<a href="/">Home</a>
<a href="/privacy">Privacy</a>
<a href="/about">About</a>

<!-- ✗ These require server routing setup -->
<a href="/api/users">Users API</a>

<!-- ✗ These are specific to one machine -->
<a href="C:\Users\david\file.html">Wrong!</a>
<a href="file:///home/user/file.html">Wrong!</a>
```

---

## 📁 Folder Structure Examples

### Example 1: Simple Flat Structure
```
project/
├── index.html
├── privacy.html
├── terms.html
├── about.html
└── css/
    └── styles.css
```

**Navigation between pages:**
```html
<!-- In any HTML file at root level -->
<a href="./index.html">Home</a>
<a href="./privacy.html">Privacy</a>
<a href="./about.html">About</a>

<!-- CSS in all files -->
<link rel="stylesheet" href="./css/styles.css">
```

---

### Example 2: Organized Structure with Subfolders
```
project/
├── index.html
├── results.html
│
├── css/
│   ├── main.css
│   └── layout.css
│
├── js/
│   ├── analysis.js
│   └── payment.js
│
├── pages/
│   ├── privacy.html
│   ├── terms.html
│   └── about.html
│
└── assets/
    ├── images/
    │   ├── logo.png
    │   └── backgrounds/
    │       └── hero.jpg
    └── fonts/
        └── jakarta.woff2
```

**Navigation:**

In root-level files (index.html, results.html):
```html
<a href="./index.html">Home</a>
<a href="./pages/privacy.html">Privacy</a>
<a href="./pages/terms.html">Terms</a>

<link rel="stylesheet" href="./css/main.css">
<script src="./js/analysis.js"></script>
<img src="./assets/images/logo.png">
```

In subfolder files (pages/privacy.html):
```html
<!-- Go up one level to root, then navigate -->
<a href="../index.html">Home</a>
<a href="./terms.html">Terms</a>
<a href="./about.html">About</a>

<!-- CSS is up one level in root -->
<link rel="stylesheet" href="../css/main.css">
<script src="../js/analysis.js"></script>

<!-- Assets are also up one level -->
<img src="../assets/images/logo.png">
```

---

### Example 3: Deeply Nested Structure
```
project/
├── index.html
├── css/styles.css
│
└── pages/
    └── legal/
        ├── privacy.html
        ├── terms.html
        └── subfolder/
            └── detailed.html
```

**Navigation:**

From project/index.html (root):
```html
<a href="./pages/legal/privacy.html">Privacy</a>
<link rel="stylesheet" href="./css/styles.css">
```

From project/pages/legal/privacy.html (2 levels deep):
```html
<!-- Go up 2 levels to reach root -->
<a href="../../index.html">Home</a>
<a href="./terms.html">Terms</a>
<a href="./subfolder/detailed.html">Details</a>

<!-- CSS is 2 levels up in root/css/ -->
<link rel="stylesheet" href="../../css/styles.css">
```

From project/pages/legal/subfolder/detailed.html (3 levels deep):
```html
<!-- Go up 3 levels to reach root -->
<a href="../../../index.html">Home</a>
<a href="../privacy.html">Privacy</a>

<!-- CSS is 3 levels up -->
<link rel="stylesheet" href="../../../css/styles.css">
```

---

## 🧮 Path Calculator

### Rule: Count your folder depth

1. **At root level** (index.html in root):
   - Use `./filename.html`
   - Example: `<a href="./privacy.html">`

2. **In subfolder** (pages/about.html):
   - To go up 1 level: `../`
   - To go to sibling: `../otherpage.html`
   - Example: `<a href="../index.html">`

3. **In nested subfolder** (pages/legal/privacy.html):
   - To go up 2 levels: `../../`
   - Example: `<a href="../../index.html">`

4. **General formula**:
   ```
   depth = number of folder levels
   path = ("../" × depth) + "filename.html"
   
   Examples:
   - Depth 0 (root): "./filename.html"
   - Depth 1: "../filename.html"
   - Depth 2: "../../filename.html"
   - Depth 3: "../../../filename.html"
   ```

---

## 💡 Real-World Examples

### Your Site Structure (Current)
```
test_backend (1)/
├── index.html
├── results.html
├── results-payment-success.html
├── privacy.html
├── terms.html
├── payment-success.html
└── ... (other files)
```

**All navigation in your project:**
```html
<!-- All at root level - use ./ -->
<a href="./index.html">Home</a>
<a href="./results.html">Results</a>
<a href="./privacy.html">Privacy</a>
<a href="./terms.html">Terms</a>
<a href="./payment-success.html">Payment</a>
```

---

### If You Reorganize Into Subfolders
```
test_backend (1)/
├── index.html
├── results.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
└── pages/
    ├── privacy.html
    ├── terms.html
    └── payment-success.html
```

**Updated navigation:**

In root files (index.html):
```html
<a href="./pages/privacy.html">Privacy</a>
<a href="./pages/terms.html">Terms</a>
<link rel="stylesheet" href="./css/styles.css">
<script src="./js/main.js"></script>
```

In subfolder files (pages/privacy.html):
```html
<a href="../index.html">Back to Home</a>
<a href="./terms.html">Terms</a>
<link rel="stylesheet" href="../css/styles.css">
<script src="../js/main.js"></script>
```

---

## 🔗 URL Patterns Quick Reference

| Purpose | Example | When to Use |
|---------|---------|------------|
| Same folder | `./privacy.html` | Always for static files |
| Parent folder | `../index.html` | From subfolders |
| Grandparent | `../../index.html` | From deeply nested |
| Next folder | `./subfolder/page.html` | Going into subdirs |
| Server API | `/api/users` | Only for backend routes |
| External site | `https://example.com` | External links |

---

## ✨ Copy-Paste Templates

### Template: New Root Page
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <!-- CSS - relative path -->
    <link rel="stylesheet" href="./css/styles.css">
</head>
<body>
    <!-- Back button - relative path -->
    <a href="./index.html">← Back to Home</a>
    
    <!-- Content -->
    <h1>Page Content</h1>
    
    <!-- JavaScript - relative path -->
    <script src="./js/main.js"></script>
</body>
</html>
```

### Template: Subfolder Page
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Subfolder Page</title>
    <!-- Go up one level to root for CSS -->
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <!-- Go up one level to root for home -->
    <a href="../index.html">← Back to Home</a>
    
    <!-- Sibling pages in same folder -->
    <a href="./other.html">Other Page</a>
    
    <h1>Subfolder Page</h1>
    
    <!-- Go up one level for JS -->
    <script src="../js/main.js"></script>
</body>
</html>
```

---

## 🎯 The Golden Rule

> **When in doubt, use relative paths with `./` and count your `../` carefully.**

This simple rule will prevent 99% of navigation issues.

---

## 📚 Further Learning

- Relative vs Absolute Paths: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web
- HTML Links: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
- File Paths: https://www.w3schools.com/html/html_filepaths.asp

---

**Keep this reference handy when building new pages!** ✨
