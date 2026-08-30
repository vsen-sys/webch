Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Administrator\Documents\webch\backend"
WshShell.Run """C:\Users\Administrator\Documents\webch\iniciar_servidor.bat""", 0, False