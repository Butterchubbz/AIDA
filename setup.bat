@echo off
rem This script prepares the AIDA application for its first launch.
rem It checks for necessary dependencies and installs project-specific packages.

echo --- AIDA Setup: Checking Dependencies ---

rem --- Function to check if a command exists ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install it to continue.
    echo You can download it from https://nodejs.org/
    exit /b 1
) else (
    for /f "delims=" %%v in ('node --version') do set NODE_VERSION=%%v
    echo Node.js found: %NODE_VERSION%
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed. Please install it to continue.
    echo npm is usually installed with Node.js. See https://nodejs.org/
    exit /b 1
) else (
    for /f "delims=" %%v in ('npm --version') do set NPM_VERSION=%%v
    echo npm found: %NPM_VERSION%
)

echo All system dependencies are met.
echo.

rem --- Project Installation ---
echo --- AIDA Setup: Installing Project Packages ---

rem Navigate to the script's directory to ensure paths are correct
cd /d "%~dp0"

echo Installing root packages...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root packages. Please check for errors.
    exit /b 1
)

echo Installing AIDA frontend packages...
cd aida
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install AIDA frontend packages. Please check for errors.
    exit /b 1
)
cd ..

echo Installing AIDA Launcher packages...
cd aida-launcher
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install AIDA Launcher packages. Please check for errors.
    exit /b 1
)
cd ..

echo All project packages installed successfully.
echo.

echo --- AIDA Setup Complete ---
echo You can now run the application using the start.bat script.
pause
