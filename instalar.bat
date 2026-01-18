@echo off
title Atritelecom Agent - Instalador
color 0A

echo ========================================
echo    ATRITELECOM AGENT - INSTALADOR
echo ========================================
echo.

:: Verificar se está rodando como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [AVISO] Execute como Administrador para instalar como servico
    echo.
)

:: Pedir Cliente ID
set /p CLIENTE_ID="Digite o Cliente ID: "

if "%CLIENTE_ID%"=="" (
    echo [ERRO] Cliente ID nao pode ser vazio!
    pause
    exit /b 1
)

:: Criar pasta de instalação
set INSTALL_DIR=%PROGRAMFILES%\AtritelecomAgent
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copiar executável
echo.
echo Copiando arquivos...
copy /Y "AtritelecomAgent.exe" "%INSTALL_DIR%\" >nul

:: Criar arquivo de configuração
echo Configurando cliente ID: %CLIENTE_ID%
set CONFIG_DIR=%APPDATA%\AtritelecomAgent
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

echo {"cliente_id": "%CLIENTE_ID%", "server_url": "wss://saas-websocket.onrender.com"} > "%CONFIG_DIR%\config.json"

:: Criar atalho na Startup
echo Configurando inicializacao automatica...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTUP_DIR%\AtritelecomAgent.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\AtritelecomAgent.exe" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript /nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo.
echo ========================================
echo    INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Cliente ID: %CLIENTE_ID%
echo Pasta: %INSTALL_DIR%
echo Config: %CONFIG_DIR%
echo.
echo O agente foi configurado para iniciar automaticamente.
echo.

:: Perguntar se quer iniciar agora
set /p START_NOW="Deseja iniciar o agente agora? (S/N): "
if /i "%START_NOW%"=="S" (
    echo Iniciando agente...
    start "" "%INSTALL_DIR%\AtritelecomAgent.exe"
)

echo.
pause
