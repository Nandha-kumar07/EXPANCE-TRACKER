# run-deploy.ps1
# Run from your Windows machine to deploy to EC2 at 54.158.241.8
# Usage: .\run-deploy.ps1

param (
    [string]$EC2_IP = "54.236.247.141"
)
$KEY_FILE  = ".\terraform\expense-tracker-key.pem"
$SSH_USER  = "ubuntu"
$DEPLOY_SH = ".\deploy.sh"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Expense Tracker - Deploying to EC2" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix key file permissions (required by SSH on Windows)
Write-Host "[1/3] Fixing SSH key permissions..." -ForegroundColor Yellow
icacls $KEY_FILE /inheritance:r | Out-Null
icacls $KEY_FILE /grant:r "$($env:USERNAME):(R)" | Out-Null
Write-Host "  OK: Key permissions fixed" -ForegroundColor Green

# Step 2: Copy deploy.sh to the server
Write-Host ""
Write-Host "[2/3] Copying deploy.sh to EC2..." -ForegroundColor Yellow
scp -i $KEY_FILE -o StrictHostKeyChecking=no $DEPLOY_SH "${SSH_USER}@${EC2_IP}:/home/ubuntu/deploy.sh"
Write-Host "  OK: deploy.sh uploaded" -ForegroundColor Green

# Step 3: Run deploy.sh on the server
Write-Host ""
Write-Host "[3/3] Running deployment on EC2..." -ForegroundColor Yellow
Write-Host "  (This will take 3-5 minutes while Docker builds the images)" -ForegroundColor Gray
Write-Host ""
ssh -i $KEY_FILE -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_IP}" 'chmod +x /home/ubuntu/deploy.sh; bash /home/ubuntu/deploy.sh'

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
$url = "http://" + $EC2_IP
Write-Host "  Done! Visit $url to see the app" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
