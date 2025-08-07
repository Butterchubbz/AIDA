#!/bin/bash

# A helper script to start the AIDA application without Docker.

# Define some colors for user-friendly output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${GREEN}--------------------------------------------------${NC}"
echo -e "${GREEN}   Starting AIDA Application (without Docker)   ${NC}"
echo -e "${GREEN}--------------------------------------------------${NC}"

# --- Configuration ---
PB_VERSION="0.21.1"
NODE_VERSION="18.19.1"
PB_EXEC="./pocketbase"

# --- Step 1: Check for and download prerequisites if missing ---

# Detect OS and Architecture for correct download URLs
OS_TYPE=$(uname -s)
ARCH_TYPE=$(uname -m)
NODE_OS=""
PB_OS=""

if [ "$OS_TYPE" == "Linux" ]; then
    NODE_OS="linux"
    PB_OS="linux"
elif [ "$OS_TYPE" == "Darwin" ]; then
    NODE_OS="darwin"
    PB_OS="darwin"
else
    echo -e "${RED}Unsupported OS: $OS_TYPE${NC}"
    exit 1
fi

if [ "$ARCH_TYPE" == "x86_64" ]; then
    NODE_ARCH="x64"
    PB_ARCH="amd64"
elif [ "$ARCH_TYPE" == "arm64" ] || [ "$ARCH_TYPE" == "aarch64" ]; then
    NODE_ARCH="arm64"
    PB_ARCH="arm64"
else
    echo -e "${RED}Unsupported Architecture: $ARCH_TYPE${NC}"
    exit 1
fi

LOCAL_NODE_DIR="./.bin/node-v${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}"
LOCAL_NODE_BIN="${LOCAL_NODE_DIR}/bin"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found in PATH. Checking for a local version...${NC}"
    if [ ! -f "${LOCAL_NODE_BIN}/node" ]; then
        echo -e "${YELLOW}Local Node.js not found. Downloading v${NODE_VERSION}...${NC}"
        NODE_FILENAME="node-v${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}.tar.gz"
        NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_FILENAME}"
        
        mkdir -p ./.bin
        curl -L -o "./.bin/${NODE_FILENAME}" "$NODE_URL"
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to download Node.js.${NC}"
            rm -f "./.bin/${NODE_FILENAME}"
            exit 1
        fi
        
        echo "Extracting Node.js..."
        tar -xzf "./.bin/${NODE_FILENAME}" -C ./.bin
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to extract Node.js.${NC}"
            rm -f "./.bin/${NODE_FILENAME}"
            exit 1
        fi
        rm "./.bin/${NODE_FILENAME}"
    fi
    echo -e "${GREEN}Adding local Node.js to PATH for this session.${NC}\n"
    export PATH="${LOCAL_NODE_BIN}:${PATH}"
fi

# Check for PocketBase
if [ ! -f "$PB_EXEC" ]; then
    echo -e "${YELLOW}PocketBase executable not found. Downloading v${PB_VERSION}...${NC}"
    PB_FILENAME="pocketbase_${PB_VERSION}_${PB_OS}_${PB_ARCH}.zip"
    PB_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${PB_FILENAME}"

    curl -L -o "pocketbase.zip" "$PB_URL"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to download PocketBase.${NC}"
        rm -f "pocketbase.zip"
        exit 1
    fi

    echo "Extracting PocketBase..."
    unzip -o "pocketbase.zip" -d .
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to extract PocketBase. The 'unzip' command might be missing.${NC}"
        rm -f "pocketbase.zip"
        exit 1
    fi
    chmod +x "$PB_EXEC"
    rm "pocketbase.zip"
    echo ""
fi

# --- Step 2: Install frontend dependencies if needed ---
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules directory not found. Running 'npm install'...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}npm install failed. Please check for errors.${NC}"
        exit 1
    fi
fi

# --- Step 3: Start both processes together ---
echo -e "\nStarting backend and frontend services..."
echo -e "Press CTRL+C to stop both services."
npm run dev:unix

echo -e "\n${YELLOW}=================================================================${NC}"
echo -e "${YELLOW} AIDA has stopped. Press [Enter] to close this window.${NC}"
echo -e "${YELLOW}=================================================================${NC}"
read -p ""