@echo off
REM ====================================
REM CS2 OFFSETS MANAGER - INICIAR
REM ====================================

echo.
echo ====================================
echo  CS2 OFFSETS MANAGER
echo  Equipe OpenCode
echo ====================================
echo.
echo Iniciando sistema...
echo.

REM Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Verificando Node.js...
node --version
echo.

REM Navegar para o diretorio do backend
echo [2/3] Entrando no diretorio do backend...
cd /d "%~dp0backend"

REM Verificar se as dependencias estao instaladas
if not exist "node_modules" (
    echo [3/3] Instalando dependencias...
    call npm install
) else (
    echo [3/3] Dependencias ja instaladas!
)

echo.
echo ====================================
echo  SISTEMA PRONTO!
echo ====================================
echo.
echo Para iniciar o servidor:
echo   npm start
echo.
echo Para acessar o site:
echo   http://192.168.1.107:8080
echo.
echo ====================================
echo.

REM Perguntar se deseja iniciar agora
set /p iniciar="Deseja iniciar o servidor agora? (S/N): "
if /i "%iniciar%"=="S" (
    echo.
    echo Iniciando servidor...
    call npm start
) else (
    echo.
    echo Para iniciar manualmente, execute:
    cd backend
    npm start
)

pause
