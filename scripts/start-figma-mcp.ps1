# Figma MCP Server Startup Script
# This script helps you start the Figma MCP server for Cursor IDE

param(
    [Parameter(Mandatory=$false)]
    [string]$FigmaApiKey = ""
)

Write-Host "=== Figma MCP Server Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if API key is provided
if ([string]::IsNullOrEmpty($FigmaApiKey)) {
    Write-Host "⚠️  Figma API Key not provided!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your Figma API Key:" -ForegroundColor White
    Write-Host "1. Go to https://www.figma.com/settings" -ForegroundColor Gray
    Write-Host "2. Navigate to 'Personal Access Tokens' section" -ForegroundColor Gray
    Write-Host "3. Generate a new token" -ForegroundColor Gray
    Write-Host "4. Copy the token and run this script again:" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   .\scripts\start-figma-mcp.ps1 -FigmaApiKey YOUR_TOKEN_HERE" -ForegroundColor Green
    Write-Host ""
    
    # Ask if user wants to open Figma settings
    $response = Read-Host "Would you like to open Figma settings now? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Start-Process "https://www.figma.com/settings"
    }
    
    exit 1
}

Write-Host "✅ Starting Figma MCP Server..." -ForegroundColor Green
Write-Host "📍 Server will run on: http://localhost:3333" -ForegroundColor Gray
Write-Host "⚠️  Keep this window open while using Figma MCP in Cursor" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Start the MCP server
try {
    npx @figma/mcp-server --figma-api-key=$FigmaApiKey
} catch {
    Write-Host ""
    Write-Host "❌ Error starting server!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying alternative package: figma-developer-mcp" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        npx figma-developer-mcp --figma-api-key=$FigmaApiKey
    } catch {
        Write-Host "❌ Failed to start server with alternative package" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "1. Node.js is installed (you have v22.14.0 ✅)" -ForegroundColor Gray
        Write-Host "2. Your Figma API key is correct" -ForegroundColor Gray
        Write-Host "3. Port 3333 is not in use by another application" -ForegroundColor Gray
        exit 1
    }
}



