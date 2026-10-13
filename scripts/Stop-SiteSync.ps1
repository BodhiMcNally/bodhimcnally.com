$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$commonDirectory = (& git -C $projectRoot rev-parse --git-common-dir).Trim()
if (-not [IO.Path]::IsPathRooted($commonDirectory)) { $commonDirectory = Join-Path $projectRoot $commonDirectory }
$lockPath = Join-Path $commonDirectory 'site-editor-sync.json'
if (Test-Path -LiteralPath $lockPath) {
  $lock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
  $processInfo = Get-CimInstance Win32_Process -Filter ("ProcessId = " + $lock.pid)
  if ($processInfo -and $processInfo.CommandLine -like '*sync-site.mjs*' -and $processInfo.CommandLine -like '*--watch*') { Stop-Process -Id $lock.pid }
  Remove-Item -LiteralPath $lockPath -ErrorAction SilentlyContinue
}
$shortcut = Join-Path ([Environment]::GetFolderPath('Startup')) 'Bodhi Website Sync.lnk'
if (Test-Path -LiteralPath $shortcut) { Remove-Item -LiteralPath $shortcut }
Write-Host 'Website sync stopped and removed from Windows startup.'
