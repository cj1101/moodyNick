# Google Gemini Setup Guide - Product Outline Generation

## Why Gemini?

**Cost-Effective:** As of October 2025, Gemini Imagen 3 is the most affordable AI image generation option:

| Provider | Cost per Image | Total (14 products) |
|----------|---------------|---------------------|
| **Gemini Imagen 3** | **~$0.04** | **~$0.56** ✅ |
| DALL-E 3 | ~$0.10 | ~$1.40 |
| Midjourney | $10/month | $10/month |
| Stable Diffusion | Free (self-hosted) | Free (requires setup) |

**Quality:** Comparable to DALL-E 3, better than most free alternatives  
**Speed:** Fast generation (~10 seconds per image)  
**Transparency:** Native support for transparent backgrounds

---

## Quick Start (3 Steps)

### Step 1: Get API Key (2 minutes)

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

**Free Tier:**
- Generous free quota for testing
- No credit card required initially
- Pay-as-you-go after free tier

### Step 2: Set Environment Variable (1 minute)

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```

**Windows (Command Prompt):**
```cmd
set GEMINI_API_KEY=your_api_key_here
```

**Mac/Linux:**
```bash
export GEMINI_API_KEY=your_api_key_here
```

**Permanent Setup (Optional):**

**Windows:**
1. Search "Environment Variables" in Start Menu
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under "User variables", click "New"
5. Variable name: `GEMINI_API_KEY`
6. Variable value: `your_api_key_here`
7. Click OK

**Mac/Linux:**
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export GEMINI_API_KEY="your_api_key_here"
```

### Step 3: Run Generator (3 minutes)

```bash
# Navigate to project root
cd c:\Users\charl\CodingProjets\moodyNick

# Run the generator
node scripts/generate-outlines-gemini.js
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║   Product Outline Generator - Google Gemini (Imagen 3)    ║
╚════════════════════════════════════════════════════════════╝

📊 Products to generate: 14
💰 Estimated cost: ~$0.56 USD
⏱️  Estimated time: ~140 seconds

[1/14] Processing: Unisex Staple T-Shirt
🎨 Generating: Unisex Staple T-Shirt (unisex-staple-tshirt.png)
   ✅ Saved: frontend/public/product-outlines/unisex-staple-tshirt.png
   📦 Size: 145.23 KB
   ⏳ Waiting 2 seconds...

[2/14] Processing: Heavy Cotton Tee
...

╔════════════════════════════════════════════════════════════╗
║                    Generation Summary                      ║
╚════════════════════════════════════════════════════════════╝

✅ Successful: 14/14
❌ Failed: 0/14

✅ Next Steps:
   1. Check generated images in: frontend/public/product-outlines/
   2. Review quality and transparency
   3. Start dev server: cd frontend && npm run dev
   4. Test on design page: http://localhost:3000/design/71
   5. Adjust scaleFactor in productOutlines.ts if needed

🎉 Generation complete!
```

---

## Verification

### Check Generated Files

```bash
# List generated files
dir frontend\public\product-outlines\

# Should see 14 PNG files:
# unisex-staple-tshirt.png
# heavy-cotton-tee.png
# garment-dyed-tshirt.png
# heavy-blend-hoodie.png
# heavy-blend-crewneck.png
# sports-jersey.png
# tote-bag.png
# large-organic-tote.png
# iphone-case.png
# samsung-case.png
# white-glossy-mug.png
# black-glossy-mug.png
# poster.png
# framed-poster.png
```

### Test on Design Page

```bash
cd frontend
npm run dev
```

Navigate to: http://localhost:3000/design/71

**Expected:**
- ✅ Product outline appears (no model)
- ✅ Transparent background
- ✅ Blue dashed print-area overlay visible
- ✅ Console log: "✓ Using local product outline"

---

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable not set"

**Cause:** Environment variable not set or not accessible

**Solution:**
```bash
# Check if variable is set
echo %GEMINI_API_KEY%  # Windows CMD
echo $env:GEMINI_API_KEY  # Windows PowerShell
echo $GEMINI_API_KEY  # Mac/Linux

# If empty, set it again
set GEMINI_API_KEY=your_key_here  # Windows
export GEMINI_API_KEY=your_key_here  # Mac/Linux
```

### Error: "API Error: 401 - Unauthorized"

**Cause:** Invalid or expired API key

**Solution:**
1. Verify API key is correct (no extra spaces)
2. Generate new key: https://aistudio.google.com/app/apikey
3. Update environment variable

### Error: "API Error: 429 - Too Many Requests"

**Cause:** Rate limit exceeded

**Solution:**
- Wait 5-10 minutes
- Script includes 2-second delays to avoid this
- If persists, check quota: https://console.cloud.google.com/

### Error: "API Error: 403 - Forbidden"

**Cause:** API not enabled or billing not set up

**Solution:**
1. Enable Vertex AI API: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
2. Set up billing (if free tier exhausted)
3. Verify API key has correct permissions

### Error: "No image data in response"

**Cause:** API response format changed or generation failed

**Solution:**
1. Check Gemini API status: https://status.cloud.google.com/
2. Try regenerating single product
3. Use placeholder generator as fallback

### Images have white background

**Cause:** Transparency not properly generated

**Solution:**
1. Check prompt includes "transparent background"
2. Use remove.bg: https://remove.bg/
3. Or regenerate specific images

### Images are low quality

**Cause:** Gemini may have interpreted prompt differently

**Solution:**
1. Edit prompts in `generate-outlines-gemini.js`
2. Emphasize "minimalist", "simple", "clean"
3. Regenerate specific products

---

## Cost Management

### Free Tier (October 2025)

Google AI Studio provides generous free tier:
- **Free quota:** ~50 images/month
- **No credit card:** Required only after free tier
- **Resets:** Monthly

### Paid Usage

After free tier:
- **Cost:** ~$0.04 per image (1024x1024)
- **Billing:** Pay-as-you-go
- **Monitoring:** https://console.cloud.google.com/billing

### Cost Optimization

**Generate only what you need:**
```javascript
// Edit generate-outlines-gemini.js
// Comment out products you don't need
const products = [
  // { id: '71', ... },  // Skip this one
  { id: '19', ... },     // Generate this one
  // ...
];
```

**Use placeholder generator for testing:**
- Free, instant
- Good enough for development
- Replace with Gemini for production

---

## Alternative: Free Manual Generation

If you don't want to use API:

### Google AI Studio (Web Interface)

1. Visit: https://aistudio.google.com/
2. Click "Create new" → "Image generation"
3. Enter prompt from `AI_PROMPTS_FOR_OUTLINES.md`
4. Download generated image
5. Save to `frontend/public/product-outlines/`

**Pros:**
- ✅ Free (no API key needed)
- ✅ No coding required
- ✅ Same quality as API

**Cons:**
- ❌ Manual process (one at a time)
- ❌ Time-consuming (~30 minutes for all)

---

## API Reference

### Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
```

### Request Format
```json
{
  "instances": [{
    "prompt": "Simple black outline of a t-shirt..."
  }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "1:1",
    "negativePrompt": "person, human, model, background...",
    "safetyFilterLevel": "block_some",
    "personGeneration": "dont_allow"
  }
}
```

### Response Format
```json
{
  "predictions": [{
    "bytesBase64Encoded": "iVBORw0KGgoAAAANSUhEUgAA..."
  }]
}
```

---

## Advanced Usage

### Custom Products

Edit `scripts/generate-outlines-gemini.js`:

```javascript
const products = [
  // Add your custom product
  {
    id: 'CUSTOM_ID',
    name: 'Custom Product Name',
    filename: 'custom-product.png',
    prompt: 'Simple black outline of a [your product]...'
  },
  // ... existing products
];
```

### Regenerate Single Product

```javascript
// Edit the products array to include only one product
const products = [
  {
    id: '71',
    name: 'Unisex Staple T-Shirt',
    filename: 'unisex-staple-tshirt.png',
    prompt: '...'
  }
];
```

Run: `node scripts/generate-outlines-gemini.js`

### Batch Processing

The script already processes all products sequentially with delays to avoid rate limits.

---

## Security Best Practices

### Protect Your API Key

**❌ Don't:**
- Commit API key to Git
- Share API key publicly
- Hardcode in frontend code

**✅ Do:**
- Use environment variables
- Add to `.gitignore`: `.env`
- Rotate keys periodically

### .gitignore

Ensure your `.gitignore` includes:
```
.env
.env.local
```

---

## Next Steps

After generating outlines:

1. ✅ **Verify Quality**
   - Open images in image viewer
   - Check transparency
   - Verify proper sizing

2. ✅ **Test Integration**
   - Start dev server
   - Navigate to design pages
   - Test all 14 products

3. ✅ **Optimize (Optional)**
   - Compress with TinyPNG
   - Adjust `scaleFactor` in config
   - Fine-tune positioning

4. ✅ **Deploy**
   - Commit images to Git
   - Deploy to production
   - Monitor performance

---

## Resources

- **Google AI Studio:** https://aistudio.google.com/
- **API Documentation:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing
- **Status Page:** https://status.cloud.google.com/
- **Support:** https://support.google.com/

---

## Summary

✅ **Setup Time:** 3 minutes  
✅ **Generation Time:** 3 minutes  
✅ **Total Cost:** ~$0.56 USD  
✅ **Quality:** Professional, production-ready  
✅ **Maintenance:** Zero (images are static)  

**You're all set!** Run the script and you'll have high-quality product outlines in minutes. 🚀
