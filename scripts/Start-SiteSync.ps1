$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodePath = (Get-Command node -ErrorAction Stop).Source
$syncScript = Join-Path $PSScriptRoot 'sync-site.mjs'
Start-Process -FilePath $nodePath -ArgumentList @('"' + $syncScript + '"', '--watch') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'site-sync.log') -RedirectStandardError (Join-Path $projectRoot 'site-sync-errors.log')
