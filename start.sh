#!/bin/bash
# This script starts the AIDA application.
# It launches the backend (PocketBase) and the frontend (Vite dev server).

# --- Cleanup Function ---
# This function will be called when the script exits.
cleanup() {
    echo
    echo "--- Shutting down AIDA ---"
    # Kill all child processes of this script.
    # This is a robust way to ensure both PocketBase and Vite are stopped.
    pkill -P $$
    echo "All services stopped."
}

# Trap the EXIT signal to call the cleanup function
trap cleanup EXIT

# --- Main Operations ---
echo "--- Starting AIDA ---"

# Navigate to the script's directory to ensure paths are correct
cd "$(dirname "$0")"

# 1. Start the backend (PocketBase)
echo "Starting PocketBase server..."
cd aida
./pocketbase serve --hooksDir=pb_hooks > ../pocketbase.log 2>&1 &
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start PocketBase. See pocketbase.log for details."
    exit 1
fi
cd ..
echo "PocketBase server started."
echo

# 2. Start the frontend (Vite dev server)
echo "Starting AIDA frontend..."
cd aida
npm run start > ../aida.log 2>&1 &
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start AIDA frontend. See aida.log for details."
    exit 1
fi
cd ..
echo "AIDA frontend started."
echo

# --- User Instructions ---
echo "--- AIDA is Running ---"
echo
echo "Your AIDA application is now running."
echo "If this is your first time, you will be guided through the setup process."
echo
echo "  - AIDA App URL:      http://localhost:5174"
echo "  - PocketBase Admin:  http://127.0.0.1:8090/_/"
echo
echo "Please open your web browser and navigate to the AIDA App URL to begin."
echo
echo "---"
echo "IMPORTANT: Keep this terminal window open. Closing it will stop the AIDA services."
echo "Press Ctrl+C to shut down the application at any time."
echo "---"

# Wait indefinitely until the user interrupts the script (e.g., with Ctrl+C)
wait
