@echo off
set /p installdir="Enter the installation directory: "
if not exist "%installdir%\Uninstall AIDA Launcher.exe" (
    echo Uninstaller not found in the specified directory.
    pause
    exit /b
)
start "" "%installdir%\Uninstall AIDA Launcher.exe" /S
