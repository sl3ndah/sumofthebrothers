@echo off
echo ========================================
echo   Sync Music to R2 and Update Site
echo ========================================
echo.

REM Step 1: Upload to R2
echo [1/3] Uploading music to R2...
echo.
    pause
rclone copy music/ r2-sumofthebrothers:sumofthebrothers -P --transfers 8

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Upload failed!
    pause
    exit /b 1
)

echo.
echo Upload complete!

REM Step 2: Update tracks-metadata.json
echo.
echo [2/3] Updating metadata...
echo.
node generate-tracklist.js

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to update metadata!
    pause
    exit /b 1
)

REM Step 3: Convert to tracks.js
echo.
echo [3/3] Converting to tracks.js...
echo.
node convert-to-tracksjs.js

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to convert to tracks.js!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Updated files:
echo - tracks.js
echo - tracks-metadata.json
echo.
echo Your local index.html will now show the updated tracks.
echo Next: Review changes, then commit and push
echo.
pause
