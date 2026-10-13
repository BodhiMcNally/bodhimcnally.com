$ErrorActionPreference = 'Stop'
$startup = [Environment]::GetFolderPath('Startup')
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $startup 'Bodhi Website Sync.lnk'))
$shortcut.TargetPath = (Get-Command powershell.exe -ErrorAction Stop).Source
$shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $PSScriptRoot 'Start-SiteSync.ps1') + '"'
$shortcut.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$shortcut.WindowStyle = 7
$shortcut.Save()
& (Join-Path $PSScriptRoot 'Start-SiteSync.ps1')
Write-Host 'Website sync is running and will start at your next Windows login.'
Write-Host 'It updates a clean main branch and pauses while local changes or divergent commits need attention.'
