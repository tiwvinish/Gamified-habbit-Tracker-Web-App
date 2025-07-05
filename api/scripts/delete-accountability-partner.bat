@echo off
echo ========================================
echo    Safe AccountabilityPartner Deletion
echo ========================================
echo.

echo 🔍 This will safely delete the AccountabilityPartner collection
echo 💾 A backup will be created before deletion
echo 🛡️  Will abort if migration hasn't been completed
echo.

echo 🚀 Running safe deletion script...
echo.
node safeDeleteAccountabilityPartner.js

echo.
echo ========================================
echo    Deletion Process Complete!
echo ========================================
echo.
echo 📋 If successful, remember to:
echo    1. Update server.js routes
echo    2. Remove old model files
echo    3. Test the simplified system
echo.
pause
