# Quick Start: Product Outlines System

## What You Need to Do

Your product outline system is **ready to use**, but you need to add the actual outline images.

## 3 Steps to Get Started

### Step 1: Generate Product Outlines

**Option A: AI Generation with Gemini (Recommended - Best Quality)**

```bash
# 1. Get free API key: https://aistudio.google.com/app/apikey
# 2. Set environment variable
set GEMINI_API_KEY=your_key_here

# 3. Run automated generator
node scripts/generate-outlines-gemini.js
```

**Cost:** ~$0.56 for all 14 products  
**Time:** ~3 minutes  
**Quality:** ⭐⭐⭐⭐⭐

---

**Option B: Placeholder Generator (Fastest - Basic Quality)**

1. Open this file in your browser:
   ```
   frontend/scripts/create-placeholder-outlines.html
   ```

2. Click **"Download All Placeholders as ZIP"**

3. Extract the ZIP file

4. Move all PNG files to:
   ```
   frontend/public/product-outlines/
   ```

**Cost:** Free  
**Time:** 5 minutes  
**Quality:** ⭐⭐⭐ (basic shapes)

---

**Option C: Google AI Studio (Free - Manual)**

1. Visit: https://aistudio.google.com/
2. Use prompts from `AI_PROMPTS_FOR_OUTLINES.md`
3. Download each image manually
4. Save to `frontend/public/product-outlines/`

**Cost:** Free  
**Time:** ~30 minutes  
**Quality:** ⭐⭐⭐⭐⭐

### Step 2: Test the System

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to a design page:
   ```
   http://localhost:3000/design/71
   ```
   (Product ID 71 = Unisex Staple T-Shirt)

3. You should see:
   - ✅ Product outline (no model)
   - ✅ Blue dashed print-area rectangle
   - ✅ "Artwork Zone" label

### Step 3: Improve Quality (Optional)

The placeholders are basic shapes. For production quality:

**Option A: Use AI (Recommended)**
```
Prompt for DALL-E/Midjourney:
"Simple black outline silhouette of a [product], front view, 
centered, transparent background, minimalist line art, 
no shading, no details, PNG format"
```

**Option B: Hire a Designer**
- Fiverr: $5-20 per outline
- Upwork: $10-50 per outline
- 99designs: Design contest

**Option C: DIY in Figma/Illustrator**
- Trace Printful's product images
- Export as PNG with transparent background

## What's Already Done

✅ **Configuration System** (`productOutlines.ts`)
- Maps product IDs to outline images
- Supports 14 products out of the box
- Easy to add more products

✅ **Design Page Integration**
- Automatically uses local outlines when available
- Falls back to Printful's images if outline missing
- Console warnings guide you

✅ **Documentation**
- `PRODUCT_OUTLINES_GUIDE.md` - Complete guide
- `frontend/public/product-outlines/README.md` - Directory guide
- This quick start guide

## How It Works

```
User visits /design/71
        ↓
System checks: Does product 71 have a local outline?
        ↓
    YES ✓                          NO ✗
        ↓                              ↓
Use local outline          Use Printful's image
(clean, no model)          (may have model)
        ↓                              ↓
Display on canvas          Display on canvas
```

## Adding More Products

1. **Find the Printful Product ID**
   - Visit: https://api.printful.com/products
   - Find your product, note the `id`

2. **Create the outline image**
   - Use placeholder generator, AI, or design software
   - Save as PNG with transparent background
   - Name it descriptively (e.g., `tank-top.png`)

3. **Add to config**
   Edit `frontend/src/config/productOutlines.ts`:
   ```typescript
   'PRODUCT_ID': {
     imagePath: '/product-outlines/your-image.png',
     category: 'apparel',
     supportsColorTint: true,
     scaleFactor: 0.85,
   },
   ```

4. **Test it**
   - Navigate to `/design/PRODUCT_ID`
   - Verify outline appears correctly

## Current Product Coverage

### ✅ Configured (14 products)
- T-Shirts (3 variants)
- Hoodies & Sweatshirts (2 variants)
- Sports Jersey (1)
- Tote Bags (2 variants)
- Phone Cases (2 variants)
- Mugs (2 variants)
- Posters (2 variants)

### 📋 To Add (Popular Products)
- Tank Tops
- Long Sleeve Tees
- Zip Hoodies
- Baseball Caps
- Stickers
- Laptop Cases
- Water Bottles

## Troubleshooting

### "No local product outline found" warning
**Cause:** Image file doesn't exist or path is wrong  
**Fix:** 
1. Check file exists in `frontend/public/product-outlines/`
2. Verify filename matches `productOutlines.ts`
3. Restart dev server

### Outline is too big/small
**Cause:** Scale factor needs adjustment  
**Fix:** Edit `scaleFactor` in `productOutlines.ts`
- Too big? Decrease (e.g., 0.85 → 0.75)
- Too small? Increase (e.g., 0.85 → 0.95)

### Print area doesn't align
**Cause:** Outline position needs adjustment  
**Fix:** Add `offsetX` or `offsetY` in `productOutlines.ts`
```typescript
'71': {
  imagePath: '/product-outlines/unisex-staple-tshirt.png',
  category: 'apparel',
  scaleFactor: 0.85,
  offsetY: -20,  // Move up 20px
  offsetX: 10,   // Move right 10px
},
```

## Performance Tips

### Optimize Images
Use TinyPNG to compress:
```
Before: 800KB → After: 150KB
```

### Lazy Loading
Images only load when design page is accessed (already implemented).

### Caching
Browser caches images automatically (served from `/public`).

## Next Steps

1. ✅ Generate placeholder outlines (Step 1 above)
2. ✅ Test on design page (Step 2 above)
3. 📋 Replace placeholders with quality outlines (Step 3 above)
4. 📋 Add more products as needed
5. 📋 Gather user feedback
6. 📋 Optimize and refine

## Questions Answered

### Q: What's the best way to create outlines at scale?
**A:** Start with the placeholder generator for speed, then replace with AI-generated outlines (DALL-E) for quality.

### Q: Should outlines be variant-specific or product-specific?
**A:** Product-specific (one outline per product type). Use the `supportsColorTint` option to tint for different colors.

### Q: How to handle irregular-shaped products?
**A:** Adjust `scaleFactor`, `offsetX`, and `offsetY` in the config. Test with actual designs.

### Q: Should outlines scale dynamically based on print-area size?
**A:** No, use fixed `scaleFactor` values. The print-area overlay scales independently.

## Resources

- **Full Guide:** `PRODUCT_OUTLINES_GUIDE.md`
- **Config File:** `frontend/src/config/productOutlines.ts`
- **Design Page:** `frontend/src/app/design/[productId]/page.tsx`
- **Placeholder Generator:** `frontend/scripts/create-placeholder-outlines.html`

## Support

Check browser console for helpful warnings and errors. The system will guide you if something's missing.

---

**Ready to start?** Open `frontend/scripts/create-placeholder-outlines.html` in your browser! 🚀
