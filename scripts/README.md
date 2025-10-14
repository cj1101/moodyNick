# Product Outline Generation Scripts

This directory contains tools for generating product outline images.

## 🚀 Automated Generation (Recommended)

### generate-outlines-gemini.js

**Automatically generates all 14 product outlines using Google Gemini (Imagen 3)**

**Setup:**
```bash
# 1. Get API key from Google AI Studio
# Visit: https://aistudio.google.com/app/apikey

# 2. Set environment variable
# Windows:
set GEMINI_API_KEY=your_api_key_here

# Mac/Linux:
export GEMINI_API_KEY=your_api_key_here

# 3. Run the script
node scripts/generate-outlines-gemini.js
```

**Features:**
- ✅ Generates all 14 products automatically
- ✅ High-quality, transparent backgrounds
- ✅ Properly sized (1024x1024)
- ✅ Saves directly to `frontend/public/product-outlines/`
- ✅ Progress tracking and error handling

**Cost:** ~$0.56 USD for all 14 products (as of October 2025)  
**Time:** ~3 minutes  
**Quality:** ⭐⭐⭐⭐⭐

**Output:**
```
frontend/public/product-outlines/
├── unisex-staple-tshirt.png
├── heavy-cotton-tee.png
├── garment-dyed-tshirt.png
├── heavy-blend-hoodie.png
├── heavy-blend-crewneck.png
├── sports-jersey.png
├── tote-bag.png
├── large-organic-tote.png
├── iphone-case.png
├── samsung-case.png
├── white-glossy-mug.png
├── black-glossy-mug.png
├── poster.png
└── framed-poster.png
```

---

## 🎨 Manual Generation (Alternative)

### create-placeholder-outlines.html

**Browser-based tool for creating basic placeholder outlines**

**Usage:**
1. Open `create-placeholder-outlines.html` in your web browser
2. Click "Download All Placeholders as ZIP"
3. Extract the ZIP file
4. Move PNG files to `frontend/public/product-outlines/`

**Features:**
- ✅ No setup required
- ✅ Works offline
- ✅ Instant generation
- ✅ Free

**Cost:** Free  
**Time:** 5 minutes  
**Quality:** ⭐⭐⭐ (basic shapes, good for testing)

**Note:** These are simplified placeholders. For production, use Gemini script or manual AI generation.

---

## 📊 Comparison

| Method | Cost | Time | Quality | Setup |
|--------|------|------|---------|-------|
| **Gemini Script** | ~$0.56 | 3 min | ⭐⭐⭐⭐⭐ | API key |
| **Placeholder HTML** | Free | 5 min | ⭐⭐⭐ | None |
| **Google AI Studio (Manual)** | Free | 30 min | ⭐⭐⭐⭐⭐ | None |
| **DALL-E** | ~$1.40 | 10 min | ⭐⭐⭐⭐⭐ | API key |
| **Midjourney** | $10/mo | 15 min | ⭐⭐⭐⭐⭐ | Subscription |

**Recommendation:** Use Gemini script for best balance of cost, quality, and speed.

---

## 🔧 Troubleshooting

### Gemini Script Issues

**Error: "GEMINI_API_KEY environment variable not set"**
- Solution: Set the environment variable before running
- Windows: `set GEMINI_API_KEY=your_key`
- Mac/Linux: `export GEMINI_API_KEY=your_key`

**Error: "API Error: 401"**
- Solution: Invalid API key
- Get new key from: https://aistudio.google.com/app/apikey

**Error: "API Error: 429"**
- Solution: Rate limit exceeded
- Wait a few minutes and try again
- Script includes 2-second delays to avoid this

**Error: "No image data in response"**
- Solution: API response format changed
- Check Gemini API documentation for updates
- Try manual generation as fallback

**Images have white background instead of transparent**
- Solution: This shouldn't happen with Gemini
- If it does, use remove.bg to remove background
- Or regenerate with emphasis on "transparent background"

### Placeholder HTML Issues

**Download doesn't work**
- Solution: Check browser compatibility
- Use Chrome, Firefox, or Edge
- Ensure JavaScript is enabled

**Images look pixelated**
- Solution: This is expected for placeholders
- Use Gemini script for production quality

---

## 🎯 Next Steps

After generating outlines:

1. **Verify Images**
   ```bash
   # Check that files exist
   ls frontend/public/product-outlines/
   ```

2. **Test on Design Page**
   ```bash
   cd frontend
   npm run dev
   # Navigate to: http://localhost:3000/design/71
   ```

3. **Check Console**
   - Should see: "✓ Using local product outline"
   - No errors or warnings

4. **Adjust if Needed**
   - Edit `frontend/src/config/productOutlines.ts`
   - Modify `scaleFactor`, `offsetX`, `offsetY`
   - Refresh page to see changes

---

## 📚 Documentation

- **Complete Guide:** `../PRODUCT_OUTLINES_GUIDE.md`
- **Quick Start:** `../QUICK_START_OUTLINES.md`
- **AI Prompts:** `../AI_PROMPTS_FOR_OUTLINES.md`
- **Testing:** `../TEST_OUTLINES_SYSTEM.md`

---

## 🆘 Support

If you encounter issues:

1. Check this README
2. Review error messages in console
3. Verify API key is correct
4. Try placeholder generator as fallback
5. See main documentation files

---

## 🔮 Future Enhancements

Potential script improvements:

- [ ] Support for custom product lists
- [ ] Batch processing with progress bar
- [ ] Automatic image optimization
- [ ] Background removal post-processing
- [ ] Multiple AI provider support (DALL-E, Midjourney)
- [ ] Quality validation checks
- [ ] Automatic upload to CDN
