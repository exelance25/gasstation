# PumpPaymaster — Base Sepolia testnet deploy

# Gereksinim: Foundry (forge) kurulu olmalı

# Kullanım:

#   $env:DEPLOYER_PRIVATE_KEY = "0x..."

#   $env:PRICE_SIGNER_ADDRESS = "0x..."   # oracle imza adresi

#   .\scripts\deploy-testnet.ps1



$ErrorActionPreference = "Stop"



$Rpc = $env:BASE_RPC_PRIVATE_URL

if (-not $Rpc) { $Rpc = "https://sepolia.base.org" }



if (-not $env:DEPLOYER_PRIVATE_KEY) {

  Write-Host "DEPLOYER_PRIVATE_KEY tanimli degil." -ForegroundColor Red

  exit 1

}



if (-not $env:PRICE_SIGNER_ADDRESS) {

  Write-Host "PRICE_SIGNER_ADDRESS bos — deploy script varsayilan placeholder kullanacak." -ForegroundColor Yellow

}



Write-Host "Deploying PumpPaymaster v2 to Base Sepolia..." -ForegroundColor Cyan

Write-Host "RPC: $Rpc"



Push-Location "$PSScriptRoot\..\contracts"



$env:ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"



forge script script/DeployPumpPaymaster.s.sol:DeployPumpPaymaster `

  --rpc-url $Rpc `

  --broadcast `

  --private-key $env:DEPLOYER_PRIVATE_KEY



Pop-Location



Write-Host ""

Write-Host "Deploy tamamlandi. .env.local dosyaniza ekleyin:" -ForegroundColor Green

Write-Host "NEXT_PUBLIC_APP_ENV=testnet"

Write-Host "NEXT_PUBLIC_AUTO_FEE_ENABLED=true"

Write-Host "NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS=0x... (script ciktisindaki adres)"

Write-Host "NEXT_PUBLIC_ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

Write-Host "PRICE_SIGNER_ADDRESS=$($env:PRICE_SIGNER_ADDRESS)"

Write-Host "NEXT_PUBLIC_BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e"

Write-Host "NEXT_PUBLIC_BASE_SEPOLIA_RPC=$Rpc"

