@echo off
echo Installing dependencies...
call npm install
echo.
echo Starting Finance Dashboard...
call npm run dev
pause
