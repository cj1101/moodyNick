# Test Mockup Endpoint Script
Write-Host "🧪 Testing Mockup Endpoint" -ForegroundColor Cyan
Write-Host ""

$testData = @{
    variantId = "4022"
    designDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="
    placement = "front"
} | ConvertTo-Json

Write-Host "📤 Sending POST request to: http://localhost:5000/api/catalog/products/71/mockup" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/catalog/products/71/mockup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing
    
    Write-Host "✅ Success! Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error! Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Error Response:" -ForegroundColor Yellow
    $_.ErrorDetails.Message
}

Write-Host ""
Write-Host "💡 Tip: Check the backend console for detailed [MOCKUP] logs" -ForegroundColor Gray
