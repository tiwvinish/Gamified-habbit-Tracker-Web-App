@echo off
echo ========================================
echo    Partner System Diagnosis & Fix
echo ========================================
echo.

echo 🔍 Step 1: Diagnosing partner system...
echo.
node diagnosePartnerSystem.js

echo.
echo ========================================
echo.

echo 🔧 Step 2: Fixing partner system...
echo.
node fixPartnerSystem.js

echo.
echo ========================================
echo    Partner System Fix Complete!
echo ========================================
echo.
echo 💡 Now try the "Discover Compatible Partners" button
echo    in your frontend application.
echo.
pause
