@echo off
title WEBCH Server
cd /d "%~dp0backend"
:loop
node server.js >> "%~dp0backend\server.log" 2>&1
echo Reiniciando servidor em 5 segundos...
timeout /t 5 /nobreak >nul
goto loop