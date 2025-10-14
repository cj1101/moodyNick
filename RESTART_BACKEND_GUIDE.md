# 🔧 Backend Server Restart Guide

## The Problem

The backend server is running with **old code** that doesn't have the mockup generation fixes. You're getting a 404 error because the updated route handler isn't loaded.

## The Solution

**Restart the backend server** to load the new code with:
- ✅ Fixed `image_url` field name
- ✅ Comprehensive debugging logs
- ✅ Temporary image serving endpoint

---

## Option 1: Quick Restart (Recommended)

### Step 1: Open PowerShell in the backend folder
```powershell
cd C:\Users\charl\CodingProjets\moodyNick\backend
```

### Step 2: Run the restart script
```powershell
.\restart-server.ps1
```

This will:
1. Stop all old backend servers
2. Start a fresh server with the updated code
3. Show you the console output with debugging

---

## Option 2: Manual Restart

### Step 1: Stop the old server
```powershell
Get-Process -Name node | Where-Object { $_.Path -like "*moodyNick*" } | Stop-Process -Force
```

### Step 2: Start the new server
```powershell
cd C:\Users\charl\CodingProjets\moodyNick\backend
node server.js
```

---

## Option 3: Test the Endpoint First

Want to verify the endpoint works before restarting?

```powershell
cd C:\Users\charl\CodingProjets\moodyNick\backend
.\test-mockup-endpoint.ps1
```

This will show you if the endpoint is responding correctly.

---

## What to Look For

### ✅ Success Indicators

When you restart and try to generate a mockup, you should see in the **backend console**:

```
========== MOCKUP GENERATION REQUEST ==========
Timestamp: 2025-09-30T21:52:30.312Z
Request params: { productId: '71' }
Request body keys: [ 'designDataUrl', 'placement', 'variantId' ]
[MOCKUP] Product ID: 71
[MOCKUP] Variant ID: 4022
[MOCKUP] Placement: front
[MOCKUP] Has designDataUrl: true
[MOCKUP] Step 1: Verifying variant 4022 in Printful catalog...
[MOCKUP] Variant check response code: 200
[MOCKUP] ✓ Variant verified: Bella + Canvas 3001 (White / S)
[MOCKUP] Actual product ID from variant: 71
[MOCKUP] Step 2: Building files array for mockup generation...
[MOCKUP] Using data URL directly for placement front (length: 39887)
[MOCKUP] ✓ Built 1 file(s) for mockup generation
[MOCKUP]   File 1: placement=front, url_type=data URL
[MOCKUP] Step 3: Creating mockup task...
...
```

### ❌ If You Still See 404

If you still get 404 after restarting:
1. Make sure you're in the correct directory
2. Check if port 5000 is actually running the moodyNick backend
3. Verify the frontend is pointing to `http://localhost:5000`

---

## Frontend Debugging

The frontend now has excellent debugging too! Check the browser console for:

```
🎨 ========== MOCKUP GENERATION START ==========
⏰ Timestamp: 2025-09-30T21:52:30.312Z
📊 Design check: {hasDesigns: true, currentPlacement: 'front', ...}
🔄 Set generating state to true
📸 Step 1: Exporting canvas to data URL...
✅ Canvas exported: {dataUrlLength: 39887, ...}
📦 Step 2: Preparing mockup request...
🌐 API endpoint: http://localhost:5000/api/catalog/products/71/mockup
🚀 Step 3: Sending request to backend...
📥 Response received: {status: 200, statusText: 'OK', ok: true}
✅ Step 4: Parsing successful response...
✅✅✅ SUCCESS! Mockup modal opened
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 Error | Restart backend server |
| No `[MOCKUP]` logs | Backend not receiving request - check URL |
| `EADDRINUSE` error | Port 5000 is busy - kill old process |
| Printful API error | Check `.env` file has valid API keys |

---

## Next Steps

After restarting:
1. ✅ Try generating a mockup again
2. ✅ Watch both frontend and backend consoles
3. ✅ You should see detailed step-by-step logs
4. ✅ The mockup should generate successfully!

---

**Need help?** Check the console logs - they now tell you exactly what's happening at each step!
