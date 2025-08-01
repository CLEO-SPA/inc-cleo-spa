@echo off
echo CLEO SPA Setup Builder
echo =====================
echo This will build the CLEO SPA Setup executable.
echo.

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in your PATH.
    echo Please install Python 3.6 or higher and try again.
    pause
    exit /b 1
)

REM Change to the setup directory
cd /d "%~dp0"

REM Run the build script
echo Running build script...
echo.
python build.py

REM Check if build was successful
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo The executable is located in the dist directory.
echo.
echo Press any key to exit...
pause >nul
