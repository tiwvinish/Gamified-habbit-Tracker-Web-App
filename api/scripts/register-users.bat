@echo off
echo ========================================
echo    MeroHabbit User Registration
echo ========================================
echo.

echo 📁 Current Directory:
cd
echo.

echo 🔍 Checking Node.js...
node --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo 💡 Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available
echo.

echo 🚀 Starting user registration...
echo 💡 This will register 12 test users in the database
echo.

node simpleUserRegistration.js

echo.
echo ========================================
echo    Registration Complete
echo ========================================
pause
