# Product Outlines System - Implementation Guide

## Overview
This system replaces Printful's lifestyle product photos (with models) with clean product outlines on the design canvas, allowing users to see exactly where their artwork will be placed.

## Directory Structure
```
frontend/
├── public/
│   └── product-outlines/          # Product outline images (PNG, transparent)
│       ├── unisex-staple-tshirt.png
│       ├── heavy-cotton-tee.png
│       ├── tote-bag.png
│       └── ... (more products)
├── src/
│   ├── config/
│   │   └── productOutlines.ts     # Product ID → outline mapping
│   └── app/
│       └── design/
│           └── [productId]/
│               └── page.tsx        # Design page (updated)
```

## How It Works

### 1. Product Outline Mapping
The `productOutlines.ts` config file maps Printful product IDs to local outline images:

```typescript
export const productOutlineMap: Record<string, ProductOutlineConfig> = {
  '71': {
    imagePath: '/product-outlines/unisex-staple-tshirt.png',
    category: 'apparel',
    supportsColorTint: true,
    scaleFactor: 0.85,
  },
  // ... more products
};
```

### 2. Design Page Integration
The design page checks for local outlines before using Printful's catalog images:

```typescript
// Check if product has a local outline
const outlineConfig = getProductOutline(productId);

if (outlineConfig) {
  // Use local outline
  setProductMockup(outlineConfig.imagePath);
} else {
  // Fallback to Printful's catalog image
  // (existing blank mockup generation logic)
}
```

### 3. Print-Area Overlay
The blue dashed rectangle overlay remains visible over the product outline, showing the exact printable area.

## Creating Product Outlines

### Method 1: AI Image Generation (Recommended for Speed)
Use AI tools to generate simple product outlines:

**DALL-E Prompt Example:**
```
Create a simple, clean outline silhouette of a [product type] on a transparent background. 
Front view, centered, minimalist line art style, black outline, no shading, no details.
PNG format, 2000x2000 pixels.
```

**Products to generate:**
- Unisex t-shirt (front view)
- Hoodie with hood (front view)
- Tote bag (front view)
- Phone case (front view)
- Mug (side view)
- Poster (front view)

### Method 2: Manual Tracing (Recommended for Quality)
1. Download Printful's product image
2. Open in design software (Figma, Illustrator, Photoshop)
3. Trace the product outline using pen tool
4. Remove background and model
5. Export as PNG with transparent background
6. Size: 2000x2000px or larger

### Method 3: Free Mockup Templates
1. Search for "free product mockup templates" or "product outline SVG"
2. Download templates from sites like:
   - Freepik
   - Vecteezy
   - Flaticon
3. Convert to PNG with transparent background
4. Ensure proper sizing (2000x2000px recommended)

### Method 4: Printful's Product Templates
1. Use Printful's blank mockup generator (existing code)
2. Download the blank mockup
3. Use image editing software to:
   - Increase contrast
   - Apply edge detection
   - Remove background
   - Create outline effect
4. Export as PNG

## Image Specifications

### Required Specifications
- **Format:** PNG
- **Background:** Transparent (alpha channel)
- **Size:** 2000x2000 pixels (minimum 1500x1500)
- **Color:** Black or dark gray outline
- **Style:** Simple silhouette or outline
- **View:** Front-facing (primary design view)
- **Alignment:** Centered in canvas

### Quality Checklist
- [ ] Transparent background (no white background)
- [ ] Clean, smooth edges (no jagged pixels)
- [ ] Properly centered in canvas
- [ ] Appropriate size (not too large or small)
- [ ] Front view of product
- [ ] No model or lifestyle elements
- [ ] No shadows or complex shading
- [ ] File size < 500KB (optimize if needed)

## Adding a New Product Outline

### Step 1: Create the Outline Image
1. Use one of the methods above to create the outline
2. Save as PNG with transparent background
3. Name it descriptively (e.g., `unisex-staple-tshirt.png`)
4. Optimize file size if > 500KB

### Step 2: Add to Public Directory
```bash
# Save the image to:
frontend/public/product-outlines/your-product-name.png
```

### Step 3: Update productOutlines.ts
Add a new entry to the `productOutlineMap`:

```typescript
'PRODUCT_ID': {
  imagePath: '/product-outlines/your-product-name.png',
  category: 'apparel', // or 'accessories', 'home-living', 'stationery'
  supportsColorTint: true, // true for apparel, false for hard goods
  scaleFactor: 0.85, // adjust based on product size (0.4-1.0)
  offsetY: 0, // optional: vertical offset in pixels
  offsetX: 0, // optional: horizontal offset in pixels
},
```

### Step 4: Find the Printful Product ID
1. Go to Printful's Catalog API: https://api.printful.com/products
2. Find your product in the list
3. Note the `id` field (e.g., `71` for Unisex Staple T-Shirt)
4. Use this as the key in `productOutlineMap`

### Step 5: Test on Design Page
1. Navigate to `/design/PRODUCT_ID` in your app
2. Verify the outline displays correctly
3. Check that print-area overlay aligns properly
4. Adjust `scaleFactor`, `offsetX`, `offsetY` if needed

## Configuration Options

### scaleFactor
Controls the size of the product outline on canvas.
- **Range:** 0.1 - 1.0
- **Default:** 1.0
- **T-shirts:** 0.8 - 0.9
- **Hoodies:** 0.85 - 0.95
- **Tote bags:** 0.6 - 0.8
- **Phone cases:** 0.3 - 0.5
- **Mugs:** 0.4 - 0.6

### supportsColorTint
Whether the outline can be tinted to match variant color.
- **true:** Apparel items (t-shirts, hoodies, bags)
- **false:** Hard goods (phone cases, mugs, posters)

### offsetX / offsetY
Fine-tune positioning if outline doesn't align with print area.
- **Range:** -200 to +200 pixels
- **Use case:** Adjust if print area overlay is misaligned

## Variant Color Handling (Optional)

For products with `supportsColorTint: true`, you can apply a subtle color tint to match the variant's color:

```typescript
// In design page component
const variantColor = variant?.color_code; // e.g., "#000000"
const tintFilter = outlineConfig.supportsColorTint 
  ? getColorTintFilter(variantColor) 
  : 'none';

// Apply to image
<img 
  src={productMockup} 
  style={{ filter: tintFilter }}
/>
```

## Fallback Behavior

If a product doesn't have a local outline:
1. Console warning is logged
2. System falls back to Printful's blank mockup generation
3. User sees product image (may include model/lifestyle photo)

## Batch Generation Script (Future Enhancement)

Create a script to generate outlines for all products:

```javascript
// scripts/generate-outlines.js
const products = ['71', '19', '380', '163', '146'];

for (const productId of products) {
  // Use DALL-E API or image processing library
  // Generate outline for each product
  // Save to /public/product-outlines/
}
```

## Performance Considerations

### Image Optimization
- Use TinyPNG or similar to compress images
- Target file size: < 200KB per image
- Use WebP format for modern browsers (with PNG fallback)

### Lazy Loading
Product outlines are loaded on-demand when design page is accessed.

### Caching
Images are cached by browser (served from `/public` directory).

## Troubleshooting

### Outline doesn't appear
- Check file path in `productOutlines.ts`
- Verify image exists in `/public/product-outlines/`
- Check browser console for 404 errors

### Outline is too large/small
- Adjust `scaleFactor` in config
- Recommended range: 0.4 - 1.0

### Print area doesn't align
- Adjust `offsetX` and `offsetY` in config
- Test with actual design elements

### Outline has white background
- Re-export with transparent background
- Use PNG format (not JPG)
- Check alpha channel in image editor

## Product Priority List

### High Priority (Core Products)
1. ✅ Unisex Staple T-Shirt (71)
2. ✅ Heavy Cotton Tee (19)
3. ✅ Tote Bag (163)
4. ✅ Heavy Blend Hoodie (146)
5. ✅ Phone Case (45)

### Medium Priority
6. Crewneck Sweatshirt (387)
7. Sports Jersey (679)
8. Large Organic Tote (327)
9. White Glossy Mug (20)
10. Poster (1)

### Low Priority
11. Framed Poster (2)
12. Tank Top
13. Long Sleeve Tee
14. Zip Hoodie
15. Baseball Cap

## Resources

### Free Outline Sources
- **Flaticon:** https://www.flaticon.com/ (search "t-shirt outline")
- **Vecteezy:** https://www.vecteezy.com/ (search "product outline")
- **Freepik:** https://www.freepik.com/ (search "apparel mockup")

### AI Generation Tools
- **DALL-E:** https://openai.com/dall-e-2
- **Midjourney:** https://www.midjourney.com/
- **Stable Diffusion:** https://stability.ai/

### Image Editing Tools
- **Figma:** https://www.figma.com/ (free, web-based)
- **Photopea:** https://www.photopea.com/ (free Photoshop alternative)
- **GIMP:** https://www.gimp.org/ (free, open-source)
- **Adobe Illustrator:** (paid, professional)

## Next Steps

1. **Generate Initial Outlines:** Create outlines for top 5-10 products
2. **Test Integration:** Verify outlines display correctly on design page
3. **Gather Feedback:** Test with users to ensure clarity
4. **Expand Library:** Add more products based on demand
5. **Optimize Performance:** Compress images, implement lazy loading
6. **Add Color Tinting:** Implement variant color matching (optional)

## Support

For questions or issues:
- Check console logs for errors
- Verify file paths and product IDs
- Review this guide's troubleshooting section
- Test with different browsers
