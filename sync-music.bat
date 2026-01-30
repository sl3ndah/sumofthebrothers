@echo off
echo ========================================
echo   Update Music - Complete Workflow
echo ========================================
echo.
echo This will:
echo 1. Upload music to R2 bucket
echo 2. Update tracks metadata
echo 3. Regenerate tracks.js
echo.
pause

REM ===== Step 1: Check Requirements =====
echo.
echo [Step 1/3] Checking requirements...
echo.

REM Check if rclone is installed
where rclone >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: rclone is not installed or not in PATH
    echo Please install rclone first: winget install Rclone.Rclone
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if rclone remote is configured
rclone listremotes | findstr /C:"r2-sumofthebrothers:" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: rclone remote "r2-sumofthebrothers" not configured
    echo.
    echo Please run: rclone config
    echo Then create a remote named "r2-sumofthebrothers"
    pause
    exit /b 1
)

echo All requirements met!

REM ===== Step 2: Upload to R2 =====
echo.
echo [Step 2/3] Uploading music to R2...
echo.
echo Source: music/
echo Destination: r2-sumofthebrothers:sumofthebrothers
echo.

rclone copy music/ r2-sumofthebrothers:sumofthebrothers -P --transfers 8

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Upload failed!
    pause
    exit /b 1
)

echo.
echo Upload complete! Verifying...
rclone size r2-sumofthebrothers:sumofthebrothers

REM ===== Step 3: Update Metadata =====
echo.
echo [Step 3/3] Updating track metadata...
echo.

node generate-tracklist.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to update metadata!
    pause
    exit /b 1
)

REM ===== Done =====
echo.
echo ========================================
echo   All Done!
echo ========================================
echo.
echo Next steps:
echo 1. Review changes in tracks-metadata.json
echo 2. Test the site locally (open index.html)
echo 3. Git commit and push to deploy
echo.
pause
