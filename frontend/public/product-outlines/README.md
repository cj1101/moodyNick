# Product Outlines Directory

This directory contains product outline images used on the design canvas.

## Purpose
These outline images replace Printful's lifestyle product photos (which include models) with clean, simple product silhouettes. This allows users to see exactly where their artwork will be placed on the product.

## Image Requirements

### Format
- **File Type:** PNG with transparent background
- **Dimensions:** 2000x2000 pixels (minimum 1500x1500)
- **Color:** Black (#000000) or dark gray (#1f2937) outline
- **Background:** Fully transparent (alpha channel)

### Style
- Simple outline or silhouette
- Front-facing view
- Centered in canvas
- No models, backgrounds, or lifestyle elements
- Clean, smooth edges (no jagged pixels)

## Current Status

⚠️ **This directory is currently empty.** You need to add product outline images.

## Quick Start

### Option 1: Use the Placeholder Generator (Fastest)
1. Open `frontend/scripts/create-placeholder-outlines.html` in your browser
2. Click "Download All Placeholders as ZIP"
3. Extract the ZIP file
4. Move all PNG files to this directory

### Option 2: AI Generation (Best Quality)
Use DALL-E, Midjourney, or Stable Diffusion with prompts like:
```
Simple black outline silhouette of a unisex t-shirt, front view, centered, 
transparent background, minimalist line art, no shading, PNG format
```

### Option 3: Manual Design (Most Control)
1. Download Printful product images
2. Use Figma, Illustrator, or Photoshop to trace outlines
3. Export as PNG with transparent background
4. Save to this directory

### Option 4: Free Templates
Search for free product mockup templates:
- Flaticon: https://www.flaticon.com/
- Vecteezy: https://www.vecteezy.com/
- Freepik: https://www.freepik.com/

## Required Files

Based on `src/config/productOutlines.ts`, you need these files:

### Apparel
- [ ] `unisex-staple-tshirt.png` (Product ID: 71)
- [ ] `heavy-cotton-tee.png` (Product ID: 19)
- [ ] `garment-dyed-tshirt.png` (Product ID: 380)
- [ ] `heavy-blend-hoodie.png` (Product ID: 146)
- [ ] `heavy-blend-crewneck.png` (Product ID: 387)
- [ ] `sports-jersey.png` (Product ID: 679)

### Accessories
- [ ] `tote-bag.png` (Product ID: 163)
- [ ] `large-organic-tote.png` (Product ID: 327)
- [ ] `iphone-case.png` (Product ID: 45)
- [ ] `samsung-case.png` (Product ID: 46)

### Home & Living
- [ ] `white-glossy-mug.png` (Product ID: 20)
- [ ] `black-glossy-mug.png` (Product ID: 21)

### Stationery
- [ ] `poster.png` (Product ID: 1)
- [ ] `framed-poster.png` (Product ID: 2)

## File Naming Convention

Use lowercase with hyphens:
- ✅ `unisex-staple-tshirt.png`
- ✅ `heavy-blend-hoodie.png`
- ❌ `UnisexStapleTShirt.png`
- ❌ `heavy_blend_hoodie.png`

## Testing

After adding images:
1. Start your development server
2. Navigate to `/design/[productId]` (e.g., `/design/71`)
3. Verify the outline displays correctly
4. Check that the print-area overlay aligns properly
5. Adjust `scaleFactor` in `productOutlines.ts` if needed

## Troubleshooting

### Image doesn't appear
- Check file path matches `productOutlines.ts`
- Verify file exists in this directory
- Check browser console for 404 errors
- Ensure filename is exactly as specified (case-sensitive on some systems)

### Image has white background
- Re-export with transparent background
- Use PNG format (not JPG)
- Check alpha channel in image editor

### Image is too large/small
- Adjust `scaleFactor` in `src/config/productOutlines.ts`
- Recommended range: 0.4 - 1.0

### Print area doesn't align
- Adjust `offsetX` and `offsetY` in `productOutlines.ts`
- Test with actual design elements

## Resources

See `PRODUCT_OUTLINES_GUIDE.md` in the project root for:
- Detailed creation methods
- AI generation prompts
- Design software tutorials
- Free resource links
- Troubleshooting guide

## Need Help?

1. Read `PRODUCT_OUTLINES_GUIDE.md`
2. Check browser console for errors
3. Verify file paths in `productOutlines.ts`
4. Test with placeholder generator first
