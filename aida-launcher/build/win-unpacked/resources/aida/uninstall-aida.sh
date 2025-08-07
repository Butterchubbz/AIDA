#!/bin/bash

# An uninstaller script to clean up generated files for the AIDA application.

# Define some colors for user-friendly output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}=================================================================${NC}"
echo -e "${YELLOW} AIDA Uninstaller${NC}"
echo -e "${YELLOW}=================================================================${NC}\n"
echo -e "This script will remove all generated files and downloaded"
echo -e "dependencies for the AIDA application. This includes:\n"
echo -e "  - ${GREEN}node_modules${NC} (Frontend dependencies)"
echo -e "  - ${GREEN}.bin${NC}         (Locally downloaded Node.js)"
echo -e "  - ${GREEN}pocketbase${NC}   (PocketBase backend executable)"
echo -e "  - ${GREEN}package-lock.json${NC} (NPM lock file)"
echo -e "  - ${GREEN}dist / build${NC} (Production build output)"
echo -e "  - ${GREEN}*.zip${NC}        (Leftover downloaded archives)\n"
echo -e "${RED}WARNING: This action is destructive and cannot be undone.${NC}"
echo -e "Your source code will NOT be affected.\n"

read -p "Are you sure you want to continue? (y/n): " confirm
if [[ ! $confirm =~ ^[yY]$ ]]; then
    echo "Uninstall cancelled by user."
    exit 0
fi

echo -e "\nStarting cleanup...\n"

# Function to remove a directory if it exists
remove_dir() {
    if [ -d "$1" ]; then
        echo "Removing directory: $1"
        rm -rf "$1"
        echo -e "  -> ${GREEN}Done.${NC}"
    fi
}

# Function to remove a file if it exists
remove_file() {
    if [ -f "$1" ]; then
        echo "Removing file: $1"
        rm -f "$1"
        echo -e "  -> ${GREEN}Done.${NC}"
    fi
}

remove_dir "./node_modules"
remove_dir "./.bin"
remove_dir "./build"
remove_dir "./dist"
remove_file "./pocketbase"
remove_file "./package-lock.json"
remove_file "./pocketbase.zip"

echo -e "\n${GREEN}=================================================================${NC}"
echo -e "${GREEN} Cleanup Complete!${NC}"
echo -e "${GREEN}=================================================================${NC}\n"