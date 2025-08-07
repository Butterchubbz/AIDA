@echo off
title AIDA Uninstaller

echo.
echo =================================================================
echo  AIDA Uninstaller
echo =================================================================
echo.
echo This script will remove all generated files and downloaded
echo dependencies for the AIDA application. This includes:
echo.
echo   - node_modules (Frontend dependencies)
echo   - .bin         (Locally downloaded Node.js)
echo   - pocketbase.exe (PocketBase backend executable)
echo   - package-lock.json (NPM lock file)
echo   - dist         (Vite build output)
echo   - build        (Create React App build output)
echo   - *.zip        (Leftover downloaded archives)
echo.
echo WARNING: This action is destructive and cannot be undone.
echo Your source code will NOT be affected.
echo.

set /p "confirm=Are you sure you want to continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Uninstall cancelled by user.
    pause
    exit /b
)

echo.
echo Starting cleanup...
echo.

:: Remove node_modules directory
if exist ".\node_modules" (
    echo Removing node_modules directory...
    rd /s /q ".\node_modules"
    echo   -> Done.
)

:: Remove local binaries directory
if exist ".\.bin" (
    echo Removing .bin directory (local Node.js)...
    rd /s /q ".\.bin"
    echo   -> Done.
)

:: Remove PocketBase executable
if exist ".\pocketbase.exe" (
    echo Removing pocketbase.exe...
    del /q ".\pocketbase.exe"
    echo   -> Done.
)

:: Remove package-lock.json
if exist ".\package-lock.json" (
    echo Removing package-lock.json...
    del /q ".\package-lock.json"
    echo   -> Done.
)

:: Remove build directory
if exist ".\build" (
    echo Removing build directory...
    rd /s /q ".\build"
    echo   -> Done.
)
if exist ".\dist" (
    echo Removing dist directory...
    rd /s /q ".\dist"
    echo   -> Done.
)

:: Remove leftover archives
if exist ".\pocketbase.zip" (
    echo Removing pocketbase.zip...
    del /q ".\pocketbase.zip"
    echo   -> Done.
)
if exist ".\node.zip" (
    echo Removing node.zip...
    del /q ".\node.zip"
    echo   -> Done.
)

echo.
echo =================================================================
echo  Cleanup Complete!
echo =================================================================
echo.
pause