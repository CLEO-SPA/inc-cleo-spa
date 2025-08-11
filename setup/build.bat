@echo off
echo CLEO SPA Setup Builder
echo =====================
echo This will build the CLEO SPA Setup executable using GitHub Actions build script.
echo.

REM Change to the setup directory
cd /d "%~dp0"

REM Check if virtual environment exists, create if not
if not exist "..\.venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating one...
    echo.
    
    REM Go to parent directory to create venv
    cd ..
    
    REM Create virtual environment
    echo Creating virtual environment...
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment.
        echo Please ensure Python is installed and accessible.
        pause
        exit /b 1
    )
    
    REM Return to setup directory
    cd setup
    
    echo Virtual environment created successfully!
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call "..\.venv\Scripts\activate.bat"

REM Check if Python is available in venv
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not available in the virtual environment.
    echo Please check your virtual environment setup.
    pause
    exit /b 1
)

REM Install requirements if they don't exist or are outdated
echo Checking and installing requirements...
pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Some packages might not have installed correctly.
    echo Continuing with build...
)

REM Run the build script for Windows platform
echo Running build script for Windows...
echo.
python build_github_actions.py --platform windows

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
