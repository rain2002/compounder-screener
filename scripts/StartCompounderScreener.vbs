' Compounder Screener - Single Unified Silent Auto-Start Trigger
Set WshShell = CreateObject("WScript.Shell")

' 1. Trigger Backend silently (0 = hide window, False = return immediately)
WshShell.Run "cmd.exe /c ""cd /d D:\compounder-screener\backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000""", 0, False

' 2. Trigger Frontend silently at the exact same time
WshShell.Run "cmd.exe /c ""cd /d D:\compounder-screener\frontend && npm run dev -- --host 127.0.0.1 --port 5173""", 0, False
