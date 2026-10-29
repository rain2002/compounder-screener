@echo off
cd /d "D:\compounder-screener\backend"
"C:\Program Files\Python313\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
