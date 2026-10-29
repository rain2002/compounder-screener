@echo off
cd /d "D:\compounder-screener\frontend"
set CI=true
"C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173
