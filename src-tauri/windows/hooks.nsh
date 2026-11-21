; Do verzije 1.2.x aplikacija se zvala "Izborni indeksi". Windows je tada vodi kao poseban program,
; pa ga pri instalaciji pod novim imenom tiho uklanjamo (bez /DELETEAPPDATA, pa podaci ostaju sačuvani).
!macro NSIS_HOOK_PREINSTALL
  ReadRegStr $R9 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Izborni indeksi" "UninstallString"
  StrCmp $R9 "" +2 0
    ExecWait '$R9 /S'
  ReadRegStr $R9 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Izborni indeksi" "UninstallString"
  StrCmp $R9 "" +2 0
    ExecWait '$R9 /S'
!macroend
