#!/bin/bash
# Instagram Analyzer - Verification Script
# Tests that all files are in place and properly formatted

echo "==================================="
echo "Instagram Unfollower Analyzer Check"
echo "==================================="
echo ""

# Check main files
echo "Checking required files..."
files=(
    "index.html"
    "static/js/instagramAnalyzer.js"
    "logo(do not delete).png"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
        wc -l "$file" | awk '{print "   Lines: " $1}'
    else
        echo "❌ Missing: $file"
    fi
done

echo ""
echo "Checking for required libraries in HTML..."

# Check for JSZip
if grep -q "jszip" index.html; then
    echo "✅ JSZip library reference found"
else
    echo "❌ JSZip library reference NOT found"
fi

# Check for analyzer script
if grep -q "instagramAnalyzer.js" index.html; then
    echo "✅ InstagramAnalyzer script reference found"
else
    echo "❌ InstagramAnalyzer script reference NOT found"
fi

echo ""
echo "Checking HTML syntax..."
if grep -q "<!DOCTYPE html>" index.html; then
    echo "✅ Valid HTML document structure"
else
    echo "❌ HTML structure issue detected"
fi

echo ""
echo "Checking for key analyzer functions..."
if grep -q "async analyzeZip" static/js/instagramAnalyzer.js; then
    echo "✅ analyzeZip async method found"
else
    echo "❌ analyzeZip method NOT found"
fi

if grep -q "setProgressCallback" static/js/instagramAnalyzer.js; then
    echo "✅ setProgressCallback method found"
else
    echo "❌ setProgressCallback method NOT found"
fi

if grep -q "_yield()" static/js/instagramAnalyzer.js; then
    echo "✅ Non-blocking yield method found"
else
    echo "❌ Yield method NOT found"
fi

echo ""
echo "==================================="
echo "Verification Complete!"
echo "==================================="
