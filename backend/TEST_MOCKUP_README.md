# Product Image Test Script

This test script fetches blank 2D product images for any variant of product 71 (Bella + Canvas 3001 T-Shirt) from the Printful API.

## Important Note

The Printful Mockup Generator API is designed to create mockups WITH custom artwork, not blank products. This script fetches product catalog images instead, which show the blank product without any artwork overlay.

## Prerequisites

1. Ensure your `.env` file contains `PRINTFUL_API_KEY`
2. Make sure you're in the backend directory
3. Have Node.js installed with dependencies (`npm install`)

## Usage

### List All Available Variants
```bash
node test-mockup-generation.js
```
This will display all available variants with their IDs, colors, sizes, and availability.

### Fetch Product Image for a Specific Variant
```bash
node test-mockup-generation.js <variant_id>
```
Example:
```bash
node test-mockup-generation.js 4012
```

### Fetch Images for All Variants
```bash
node test-mockup-generation.js all
```
⚠️ **Warning:** This will fetch images for ALL variants, which may take several minutes.

## Output

Product images are saved to: `backend/test-mockups/`

Files are named in the format: `variant-<variant_id>-<placement>.<ext>`

Example:
- `variant-4012-main.jpg`
- `variant-4013-view_1.jpg`

## API Details

- **Product ID:** 71 (Bella + Canvas 3001 Unisex Short Sleeve Jersey T-Shirt)
- **API Endpoint:** `https://api.printful.com/products/variant/`
- **Format:** JPG/PNG (varies by product)
- **Type:** Blank product catalog images (no artwork)

## Troubleshooting

### "PRINTFUL_API_KEY not found"
Make sure your `.env` file in the backend directory contains:
```
PRINTFUL_API_KEY=your_api_key_here
```

### "Mockup generation timed out"
The script waits up to 60 seconds (30 attempts × 2 seconds). If this happens:
- Check your internet connection
- Verify the variant ID is valid
- Try again (Printful API may be experiencing delays)

### "Variant not found"
Run the script without arguments to see all available variants:
```bash
node test-mockup-generation.js
```

## Example Output

```
Fetching product 71 information...

Product: Bella + Canvas 3001 Unisex Short Sleeve Jersey T-Shirt with Tear Away Label
Total Variants: 396

Generating blank mockup for variant 4012...
Step 1: Creating mockup task...
Task created with key: gt-8a7b5c9d2e1f3a4b
Step 2: Polling for mockup generation result...
  Attempt 1: Status = pending
  Attempt 2: Status = completed

Saving mockup images to backend/test-mockups...
  ✓ Saved: variant-4012-front.jpg
    URL: https://printful-mockup-generator.s3.amazonaws.com/...
    Placement: front
  ✓ Saved: variant-4012-back.jpg
    URL: https://printful-mockup-generator.s3.amazonaws.com/...
    Placement: back

✓ Mockup generation completed successfully!
```

## Notes

- Blank mockups show the product without any custom artwork
- Each variant typically generates 2 mockup images (front and back)
- The script includes rate limiting delays when generating multiple mockups
- Images are downloaded and saved locally for offline viewing

