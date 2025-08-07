@echo off
rem This script starts the AIDA application.
rem It launches the backend (PocketBase) and the frontend (Vite dev server).

echo --- Starting AIDA ---

rem Navigate to the script's directory to ensure paths are correct
cd /d "%~dp0"

rem 1. Start the backend (PocketBase)
echo Starting PocketBase server in a new window...
cd aida
start "PocketBase" /B pocketbase.exe serve --hooksDir=pb_hooks > ..\pocketbase.log 2>&1
cd ..
echo PocketBase server started.
echo.

rem 2. Start the frontend (Vite dev server)
echo Starting AIDA frontend in a new window...
cd aida
start "AIDA Frontend" /B npm run start > ..\aida.log 2>&1
cd ..
echo AIDA frontend started.
echo.

rem --- User Instructions ---
echo --- AIDA is Running ---
echo.
echo Your AIDA application should now be running.
echo If this is your first time, you will be guided through the setup process.
echo.
echo   - AIDA App URL:      http://localhost:5174
echo   - PocketBase Admin:  http://127.0.0.1:8090/_/
echo.
echo Please open your web browser and navigate to the AIDA App URL to begin.
echo.
echo ---
echo IMPORTANT: Two new terminal windows have been opened for the backend and
echo frontend services. You must keep them open.
echo To stop AIDA, please close those two new windows.
echo ---
echo.
pause
