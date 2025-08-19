@echo off
chcp 65001 >nul
echo Starting static server...
"C:\Program Files\nodejs\node.exe" server.js

:: pause 防止閃退視窗(保留視窗)
pause   
