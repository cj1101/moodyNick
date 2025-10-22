# Blank Mockup Test Script - Summary

## What Was Created

A test script (`test-mockup-generation.js`) that fetches blank product images for any variant of product 71 (Bella + Canvas 3001 T-Shirt) from the Printful API.

## Important Discovery

**The Printful Mockup Generator API does NOT support generating truly blank mockups.**

The mockup generator is specifically designed to create product mockups WITH custom artwork overlays. It requires either:
- A `files` array with artwork image URLs, OR
- A `product_template_id` (which also expects artwork)

## Solution Implemented

Instead of using the mockup generator, the script fetches **product catalog images** using the Printful Products API endpoint:
- `GET /products/variant/{variant_id}`

These catalog images show the blank product without any artwork, which effectively serves as a "blank mockup."

## Limitations

1. **Shared Images**: Product catalog images are often shared across color variants of the same product. The same image URL may be returned for White, Black, Red, etc. variants.

2. **Limited Views**: Catalog images typically provide only 1-2 views (usually a main product photo), not the multiple angles (front, back, sleeves) that the mockup generator provides.

3. **Not Customizable**: You cannot specify mockup style, angle, or background options.

## For True Variant-Specific Blank Mockups

If you need mockups that show the exact color of each variant, you would need to:

1. Create a small transparent PNG (e.g., 1x1 pixel)
2. Host it on a publicly accessible URL
3. Use the mockup generator API with this transparent image
4. The result would show the actual product color with an invisible artwork area

Example:
```javascript
const mockupData = {
    variant_ids: [4016],  // Black t-shirt
    format: 'jpg',
    files: [{
        placement: 'front',
        image_url: 'https://yourserver.com/transparent.png',
        position: {
            area_width: 1800,
            area_height: 2400,
            width: 1,
            height: 1,
            top: 900,
            left: 900
        }
    }]
};
```

## Files Created

1. **`backend/test-mockup-generation.js`** - Main test script
2. **`backend/TEST_MOCKUP_README.md`** - Usage documentation
3. **`backend/.gitignore`** - Excludes test-mockups directory
4. **`backend/test-mockups/`** - Output directory for downloaded images

## Testing Results

Successfully tested with:
- Variant 4012 (White / M) ✓
- Variant 4011 (White / S) ✓  
- Variant 4016 (Black / S) ✓

All images were successfully downloaded and saved to `backend/test-mockups/`.

## Usage

```bash
# List all variants
node test-mockup-generation.js

# Fetch image for specific variant
node test-mockup-generation.js 4012

# Fetch images for all variants (takes several minutes)
node test-mockup-generation.js all
```

## npm Scripts

Added convenience scripts to `package.json`:
```bash
npm run test-mockup           # List variants
npm run test-mockup 4012      # Fetch specific variant  
npm run test-mockup-all       # Fetch all variants
```

