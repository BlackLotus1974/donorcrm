# Quick Migration Script: Local → Remote Supabase
# This script automates the migration to remote Supabase

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " MIGRATE TO REMOTE SUPABASE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_REF = "flqgkpytrqpkqmedmtuf"
$PROJECT_URL = "https://flqgkpytrqpkqmedmtuf.supabase.co"
$DB_PASSWORD = "mrzt65GbiFbVS5Et"

Write-Host "This script will migrate your project from local to remote Supabase." -ForegroundColor Yellow
Write-Host ""
Write-Host "Before proceeding, make sure you have:" -ForegroundColor Yellow
Write-Host "  1. Access to Supabase dashboard" -ForegroundColor White
Write-Host "  2. Your database password (from Settings → Database)" -ForegroundColor White
Write-Host "  3. Your API keys (from Settings → API)" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " STEP 1: STOP LOCAL SUPABASE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "Stopping local Supabase instance..." -ForegroundColor Yellow
try {
    npx supabase stop
    Write-Host " Local Supabase stopped" -ForegroundColor Green
} catch {
    Write-Host " Local Supabase was not running (OK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " STEP 2: LINK TO REMOTE PROJECT" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Linking to project: $PROJECT_REF" -ForegroundColor Yellow
Write-Host ""
Write-Host "Database password: $DB_PASSWORD" -ForegroundColor Gray
Write-Host "Enter this password when prompted." -ForegroundColor Yellow
Write-Host ""

npx supabase link --project-ref $PROJECT_REF

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to link to remote project!" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  - Your database password is correct" -ForegroundColor White
    Write-Host "  - You have internet connection" -ForegroundColor White
    Write-Host "  - You have access to the project" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host " Successfully linked to remote project!" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " STEP 3: PUSH DATABASE SCHEMA" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pushing migrations to remote database..." -ForegroundColor Yellow
Write-Host "This will create all tables, RLS policies, and functions." -ForegroundColor Gray
Write-Host ""

$pushConfirm = Read-Host "Ready to push migrations? (yes/no)"
if ($pushConfirm -ne "yes") {
    Write-Host "Migration cancelled at database push step." -ForegroundColor Red
    exit 0
}

npx supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to push migrations!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host " Migrations pushed successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " STEP 4: UPDATE ENVIRONMENT FILES" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Now you need to update your environment files with remote credentials." -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the following values:" -ForegroundColor Yellow
Write-Host "  1. Project URL: $PROJECT_URL" -ForegroundColor White
Write-Host "  2. anon/public key (starts with eyJ...)" -ForegroundColor White
Write-Host "  3. service_role key (starts with eyJ..., KEEP SECRET)" -ForegroundColor White
Write-Host ""

# Backup current .env.local
if (Test-Path .env.local) {
    Write-Host "Creating backup of .env.local..." -ForegroundColor Yellow
    Copy-Item .env.local .env.local.backup
    Write-Host " Backup created: .env.local.backup" -ForegroundColor Green
}

Write-Host ""
Write-Host "Opening Supabase API settings page..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
start "https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"

Write-Host ""
Write-Host "Please update the following files manually:" -ForegroundColor Yellow
Write-Host "  1. .env.local (for development)" -ForegroundColor White
Write-Host "  2. .env.docker (for Docker production)" -ForegroundColor White
Write-Host ""
Write-Host "Set these variables:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_SUPABASE_URL=$PROJECT_URL" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>" -ForegroundColor White
Write-Host "  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>" -ForegroundColor White
Write-Host ""

$envConfirm = Read-Host "Have you updated the environment files? (yes/no)"
if ($envConfirm -ne "yes") {
    Write-Host ""
    Write-Host "Please update the environment files before proceeding." -ForegroundColor Yellow
    Write-Host "Run this script again when ready." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " STEP 5: VERIFY CONNECTION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verifying database connection..." -ForegroundColor Yellow

# Open database editor
start "https://supabase.com/dashboard/project/$PROJECT_REF/editor"

Write-Host ""
Write-Host "Opened Supabase Table Editor in your browser." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please verify:" -ForegroundColor Yellow
Write-Host "  organizations table exists" -ForegroundColor White
Write-Host "  user_profiles table exists" -ForegroundColor White
Write-Host "  donors table exists" -ForegroundColor White
Write-Host "  RLS policies are enabled (shield icons)" -ForegroundColor White
Write-Host ""

$verifyConfirm = Read-Host "Do the tables exist? (yes/no)"
if ($verifyConfirm -ne "yes") {
    Write-Host ""
    Write-Host "ERROR: Tables not found!" -ForegroundColor Red
    Write-Host "Try running: npx supabase db push" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host " MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test Development Mode:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Open: http://localhost:3004" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test Production Mode:" -ForegroundColor Yellow
Write-Host "   npm run build && npm start" -ForegroundColor White
Write-Host "   Open: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test Docker Mode:" -ForegroundColor Yellow
Write-Host "   .\docker-local-prod.ps1" -ForegroundColor White
Write-Host "   Open: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Verify:" -ForegroundColor Cyan
Write-Host "  Can create account" -ForegroundColor White
Write-Host "  Can log in" -ForegroundColor White
Write-Host "  Can create organization" -ForegroundColor White
Write-Host "  Can create donors" -ForegroundColor White
Write-Host ""
Write-Host "Your app now uses Supabase Cloud!" -ForegroundColor Green
Write-Host "No more local Supabase, no more port conflicts." -ForegroundColor Green
Write-Host ""
Write-Host "Documentation: REMOTE_SUPABASE_MIGRATION_PLAN.md" -ForegroundColor Cyan
Write-Host ""
