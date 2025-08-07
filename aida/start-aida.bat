@echo off
setlocal enabledelayedexpansion
title AIDA Startup Script

:: --- Configuration ---
set "PB_VERSION=0.21.1"
set "NODE_VERSION=18.19.1"
set "PB_EXEC=.\pocketbase.exe"
set "LOCAL_NODE_DIR=.\.bin\node-v%NODE_VERSION%-win-x64"
set "LOCAL_NODE_EXE=%LOCAL_NODE_DIR%\node.exe"

echo --------------------------------------------------
echo    Starting AIDA Application (without Docker)   
echo --------------------------------------------------
echo.

:: --- Step 1: Check for and download prerequisites if missing ---

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found in PATH. Checking for a local version...
    if not exist "%LOCAL_NODE_EXE%" (
        echo Local Node.js not found. Downloading v%NODE_VERSION%...
        set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip"
        set "NODE_ZIP=node.zip"
        
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_ZIP!'"
        if !errorlevel! neq 0 (
            echo ERROR: Failed to download Node.js.
            del "!NODE_ZIP!" >nul 2>nul
            pause
            exit /b 1
        )
        
        echo Extracting Node.js...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '!NODE_ZIP!' -DestinationPath '.\.bin' -Force"
        if !errorlevel! neq 0 (
            echo ERROR: Failed to extract Node.js.
            del "!NODE_ZIP!" >nul 2>nul
            pause
            exit /b 1
        )
        del "!NODE_ZIP!"
    )
    echo Adding local Node.js to PATH for this session.
    set "PATH=%LOCAL_NODE_DIR%;%PATH%"
    echo.
)

:: Check for PocketBase
if not exist "%PB_EXEC%" (
    echo PocketBase executable not found. Downloading v%PB_VERSION%...
    set "PB_URL=https://github.com/pocketbase/pocketbase/releases/download/v%PB_VERSION%/pocketbase_%PB_VERSION%_windows_amd64.zip"
    set "PB_ZIP=pocketbase.zip"

    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '!PB_URL!' -OutFile '!PB_ZIP!'"
    if !errorlevel! neq 0 (
        echo ERROR: Failed to download PocketBase.
        del "!PB_ZIP!" >nul 2>nul
        pause
        exit /b 1
    )

    echo Extracting PocketBase...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '!PB_ZIP!' -DestinationPath '.' -Force"
    if !errorlevel! neq 0 (
        echo ERROR: Failed to extract PocketBase.
        del "!PB_ZIP!" >nul 2>nul
        pause
        exit /b 1
    )
    del "!PB_ZIP!"
    echo.
)

:: --- Step 2: Install frontend dependencies if needed ---
if not exist ".\node_modules" (
    echo node_modules directory not found. Running 'npm install'...
    call npm install
    if !errorlevel! neq 0 (
        echo ERROR: npm install failed. Please check for errors.
        pause
        exit /b 1
    )
)

:: --- Step 3: Check for PocketBase configuration ---
if not exist ".\pb_data" (
    echo PocketBase data directory not found. Running first-time setup...
    call node setup_check.js
    if !errorlevel! neq 0 (
        echo ERROR: PocketBase setup failed. Please check for errors.
        pause
        exit /b 1
    )
)

:: --- Step 4: Start both processes together ---
echo.
echo Starting backend and frontend services in this window...
echo Press CTRL+C to stop both services.
echo.
call npm run dev:win

echo.
echo =================================================================
echo  AIDA has stopped. Press any key to close this window.
echo =================================================================
pause >nul