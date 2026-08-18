' STL Manager - Startet Backend & Frontend portable und unsichtbar im Hintergrund
Dim fso, WshShell, baseDir
Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

' Dynamischer Pfad des Ordners, in dem dieses VBS-Skript liegt
baseDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Sicherstellen, dass der logs-Ordner existiert
If Not fso.FolderExists(baseDir & "\logs") Then
    fso.CreateFolder(baseDir & "\logs")
End If

' Starte portable Launcher batch versteckt und leite alle Ausgaben in die Log-Datei um
Dim startCmd
startCmd = "cmd /c ""cd /d """ & baseDir & """ && set PYTHONUNBUFFERED=1 && set PYTHONIOENCODING=utf-8 && run_portable.bat >> """ & baseDir & "\logs\backend.log"" 2>&1"""

' 0 = Fenster unsichtbar ausfuehren
WshShell.Run startCmd, 0, False

Set WshShell = Nothing
Set fso = Nothing
