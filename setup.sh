#!/bin/bash
# This script prepares the AIDA application for its first launch.
# It checks for necessary dependencies and installs project-specific packages.

# --- Function to check if a command exists ---
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# --- Dependency Checks ---
echo "--- AIDA Setup: Checking Dependencies ---"

# 1. Check for Node.js
if ! command_exists node; then
    echo "ERROR: Node.js is not installed. Please install it to continue."
    echo "You can download it from https://nodejs.org/"
    exit 1
else
    echo "Node.js found: $(node --version)"
fi

# 2. Check for npm
if ! command_exists npm; then
    echo "ERROR: npm is not installed. Please install it to continue."
    echo "npm is usually installed with Node.js. See https://nodejs.org/"
    exit 1
else
    echo "npm found: $(npm --version)"
fi

echo "All system dependencies are met."
echo

# --- Project Installation ---
echo "--- AIDA Setup: Installing Project Packages ---"

# Navigate to the script's directory to ensure paths are correct
cd "$(dirname "$0")"

# Install root dependencies
echo "Installing root packages..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install root packages. Please check for errors."
    exit 1
fi

# Install AIDA frontend dependencies
echo "Installing AIDA frontend packages..."
cd aida
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install AIDA frontend packages. Please check for errors."
    exit 1
fi
cd ..

# Install AIDA Launcher dependencies
echo "Installing AIDA Launcher packages..."
cd aida-launcher
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install AIDA Launcher packages. Please check for errors."
    exit 1
fi
cd ..

echo "All project packages installed successfully."
echo

# --- Set Permissions ---
echo "--- AIDA Setup: Setting File Permissions ---"
chmod +x aida/pocketbase
chmod +x aida-launcher/node_modules/.bin/tsc
chmod +x aida-launcher/node_modules/.bin/electron-builder
# The following file is large and might fail in some environments, but we'll try.
chmod +x aida-launcher/node_modules/app-builder-bin/linux/x64/app-builder || echo "Warning: Could not set permissions for app-builder. The Electron build might fail."

echo "File permissions set."
echo
echo "--- AIDA Setup Complete ---"
echo "You can now run the application using the start.sh script."
