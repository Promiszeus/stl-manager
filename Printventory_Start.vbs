' Print Manager - Startet Backend & Frontend portable und unsichtbar im Hintergrund
Dim fso, WshShell, baseDir
Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

' Dynamischer Pfad des Ordners, in dem dieses VBS-Skript liegt
baseDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Starte portable Launcher batch versteckt
Dim startCmd
startCmd = "cmd /c ""cd /d """ & baseDir & """ && run_portable.bat >> """ & baseDir & "\logs\backend.log"" 2>&1"""

' 0 = Fenster unsichtbar ausfuehren
WshShell.Run startCmd, 0, False

Set WshShell = Nothing
Set fso = Nothing
