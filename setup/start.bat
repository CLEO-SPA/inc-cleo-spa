@echo off

REM CLEO SPA Setup Starter
REM =====================
REM This will start the CLEO SPA Setup main.py using the virtual environment.

REM Change to the setup directory
cd /d "%~dp0"

REM Check if virtual environment exists, create if not
if not exist "..\.venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating one...
    echo.
    cd ..
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment.
        echo Please ensure Python is installed and accessible.
        pause
        exit /b 1
    )
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
    echo Continuing...
)

REM Start the main.py script
echo Starting CLEO SPA Setup...
echo.
python main.py

REM Check if script ran successfully
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo CLEO SPA Setup failed to start. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo CLEO SPA Setup exited.
echo.
echo Press any key to exit...
pause >nul
