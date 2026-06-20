Set-Location $PSScriptRoot\..
npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm.cmd run build
exit $LASTEXITCODE
