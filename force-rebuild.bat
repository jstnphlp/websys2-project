@echo off
echo ========================================================
echo   Force Rebuilding Frontend Assets (Vite + React)
echo ========================================================

echo [*] Cleaning old builds and caches...
if exist "public\build" rmdir /s /q "public\build"
if exist "public\hot" del /q "public\hot"

echo [*] Installing any missing dependencies (like axios)...
call npm install

echo [*] Building fresh production assets...
call npm run build

echo.
echo ========================================================
echo   Done! 
echo   Please stop any running server, then start it again.
echo   (Or just run 'php artisan serve' directly)
echo ========================================================
pause
