@echo off
echo ===================================================
echo   Iniciando Servidor Local - Barão de Mauá
echo ===================================================
echo.

:: Tenta port 8000 primeiro com python
echo Tentando iniciar na porta 8000...
python -m http.server 8000
if %errorlevel% equ 0 goto :success

:: Se falhar, tenta comando 'py' (launcher do windows)
echo.
echo Comando 'python' falhou. Tentando 'py'...
py -m http.server 8000
if %errorlevel% equ 0 goto :success

:: Tenta outra porta (8080) se 8000 estiver ocupada
echo.
echo Porta 8000 pode estar ocupada. Tentando porta 8080...
python -m http.server 8080
if %errorlevel% equ 0 goto :success

:: Tenta 'py' na 8080
py -m http.server 8080
if %errorlevel% equ 0 goto :success

:error
echo.
echo ❌ ERRO: Não foi possível iniciar o Python.
echo Verifique se o Python está instalado.
echo.
echo Alternativa:
echo 1. Instale a extensão "Live Server" no VS Code.
echo 2. Clique com botão direito no index.html e "Open with Live Server".
pause
exit /b

:success
echo.
echo Servidor encerrado.
pause
