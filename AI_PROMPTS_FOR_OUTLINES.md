# AI Prompts for Product Outline Generation

Use these prompts with **Google Gemini (Imagen 3)**, DALL-E, Midjourney, Stable Diffusion, or other AI image generators to create high-quality product outlines.

## 🚀 Automated Generation (Recommended)

**Use the Gemini script for automatic generation:**

```bash
# 1. Get API key from: https://aistudio.google.com/app/apikey
# 2. Set environment variable
set GEMINI_API_KEY=your_key_here

# 3. Run the generator
node scripts/generate-outlines-gemini.js
```

**Cost:** ~$0.56 for all 14 products (as of October 2025)  
**Time:** ~3 minutes  
**Quality:** High-quality, transparent backgrounds

---

## 💡 Manual Generation (Alternative)

If you prefer manual generation or want to customize individual products:

## General Template

```
Create a simple, clean [PRODUCT TYPE] outline silhouette on a transparent background.
Style: Minimalist line art, black outline (#000000), no shading, no gradients, no details.
View: Front-facing, centered in frame.
Format: PNG, 2000x2000 pixels, transparent background.
No models, no backgrounds, no lifestyle elements.
```

---

## 🆓 Free Option: Google AI Studio

**No API key needed for testing:**

1. Visit: https://aistudio.google.com/
2. Click "Create new" → "Image generation"
3. Use prompts below
4. Download generated images
5. Save to `frontend/public/product-outlines/`

**Pros:** Free, no setup  
**Cons:** Manual process, one at a time

---

## Apparel Products

### Unisex Staple T-Shirt (Product ID: 71)

**DALL-E Prompt:**
```
Simple black outline silhouette of a unisex crew neck t-shirt, front view, 
centered, transparent background, minimalist line art style, clean edges, 
no shading, no texture, no details. Short sleeves. PNG format.
```

**Midjourney Prompt:**
```
unisex t-shirt outline, simple black line art, front view, transparent background, 
minimalist, no shading, clean vector style --no person, model, background, texture
```

---

### Heavy Cotton Tee (Product ID: 19)

**DALL-E Prompt:**
```
Simple black outline of a classic cotton t-shirt, front view, centered, 
transparent background, minimalist line drawing, crew neck, short sleeves, 
no shading, no details. PNG format.
```

---

### Garment-Dyed T-Shirt (Product ID: 380)

**DALL-E Prompt:**
```
Clean outline silhouette of a relaxed fit t-shirt, front view, transparent background,
simple black line art, crew neck, short sleeves, minimalist style, no shading. PNG.
```

---

### Heavy Blend Hoodie (Product ID: 146)

**DALL-E Prompt:**
```
Simple black outline of a pullover hoodie with hood, front view, centered,
transparent background, minimalist line art, kangaroo pocket, drawstrings,
no shading, no texture, clean edges. PNG format.
```

**Midjourney Prompt:**
```
hoodie outline, front view, simple black line art, transparent background,
hood with drawstrings, kangaroo pocket, minimalist --no person, model, shading
```

---

### Heavy Blend Crewneck Sweatshirt (Product ID: 387)

**DALL-E Prompt:**
```
Simple outline of a crewneck sweatshirt, front view, transparent background,
black line art, ribbed collar and cuffs, long sleeves, minimalist style,
no shading, no details. PNG format.
```

---

### Sports Jersey (Product ID: 679)

**DALL-E Prompt:**
```
Clean outline of an athletic sports jersey, front view, transparent background,
simple black line art, sleeveless or short sleeves, minimalist style,
no shading, no numbers, no details. PNG format.
```

---

## Accessories

### Tote Bag (Product ID: 163)

**DALL-E Prompt:**
```
Simple black outline of a canvas tote bag, front view, centered,
transparent background, minimalist line art, two handles at top,
rectangular shape, no shading, no texture. PNG format.
```

**Midjourney Prompt:**
```
tote bag outline, front view, simple black line drawing, transparent background,
two handles, minimalist, clean edges --no person, items, background
```

---

### Large Organic Tote Bag (Product ID: 327)

**DALL-E Prompt:**
```
Simple outline of a large tote bag, front view, transparent background,
black line art, two handles, tall rectangular shape, minimalist style,
no shading, no details. PNG format.
```

---

### iPhone Case (Product ID: 45)

**DALL-E Prompt:**
```
Simple black outline of an iPhone case, front view, centered,
transparent background, minimalist line art, rounded corners,
camera cutout at top, clean edges, no shading. PNG format.
```

**Midjourney Prompt:**
```
iPhone case outline, front view, simple black line art, transparent background,
rounded rectangle, camera cutout, minimalist --no phone, screen, details
```

---

### Samsung Case (Product ID: 46)

**DALL-E Prompt:**
```
Simple outline of a Samsung phone case, front view, transparent background,
black line art, rounded corners, camera cutout, minimalist style,
no shading, clean edges. PNG format.
```

---

## Home & Living

### White Glossy Mug (Product ID: 20)

**DALL-E Prompt:**
```
Simple black outline of a coffee mug, side view showing handle, centered,
transparent background, minimalist line art, cylindrical shape with handle,
no shading, no details, clean edges. PNG format.
```

**Midjourney Prompt:**
```
coffee mug outline, side view with handle, simple black line drawing,
transparent background, minimalist, clean --no coffee, liquid, background
```

---

### Black Glossy Mug (Product ID: 21)

**DALL-E Prompt:**
```
Simple outline of a ceramic mug, side view with handle visible, 
transparent background, black line art, cylindrical body, curved handle,
minimalist style, no shading. PNG format.
```

---

## Stationery

### Poster (Product ID: 1)

**DALL-E Prompt:**
```
Simple black outline of a rectangular poster, front view, centered,
transparent background, minimalist line art, portrait orientation,
clean edges, no frame, no shading. PNG format.
```

**Midjourney Prompt:**
```
poster outline, rectangular frame, simple black line art, transparent background,
portrait orientation, minimalist --no content, image, text
```

---

### Framed Poster (Product ID: 2)

**DALL-E Prompt:**
```
Simple outline of a framed poster, front view, transparent background,
black line art, rectangular frame with mat border, portrait orientation,
minimalist style, no shading, clean edges. PNG format.
```

**Midjourney Prompt:**
```
framed poster outline, rectangular frame with mat, simple black line drawing,
transparent background, portrait orientation, minimalist --no content, image
```

---

## Advanced Prompts (Better Quality)

### For DALL-E 3

```
I need a technical illustration: a precise black outline silhouette of a [PRODUCT],
front-facing view, perfectly centered on a transparent background. 
Style: Vector-like line art with uniform 8px stroke width, no fills, no shading,
no gradients, no texture. The outline should be clean and professional, 
suitable for a product design canvas. Format: PNG, 2000x2000px, transparent.
```

### For Midjourney v6

```
[PRODUCT] technical outline drawing, front view, black line art on transparent background,
vector style, uniform stroke weight, no shading, no fills, professional product illustration,
centered composition, clean edges, minimalist --style raw --v 6 --no person, model, 
background, texture, shading, gradient
```

### For Stable Diffusion

```
Prompt: technical line drawing of [PRODUCT], front view, black outline, 
transparent background, vector art style, clean edges, minimalist, professional

Negative Prompt: person, model, human, background, color, shading, gradient, 
texture, details, realistic, photo, 3d
```

---

## Post-Processing Tips

After generating with AI:

1. **Remove Background** (if not transparent)
   - Use remove.bg or Photoshop
   - Ensure alpha channel is present

2. **Clean Up Edges**
   - Use vector tracing in Illustrator
   - Or manually clean in Photoshop

3. **Ensure Proper Size**
   - Resize to 2000x2000px
   - Maintain aspect ratio
   - Center in canvas

4. **Optimize File Size**
   - Use TinyPNG or similar
   - Target: < 200KB per file

5. **Test Transparency**
   - Open in image editor
   - Check for white/gray background
   - Verify alpha channel

---

## Batch Generation Strategy

### Phase 1: Core Products (Priority)
1. Unisex Staple T-Shirt (71)
2. Heavy Cotton Tee (19)
3. Tote Bag (163)
4. Heavy Blend Hoodie (146)
5. iPhone Case (45)

### Phase 2: Popular Products
6. Garment-Dyed T-Shirt (380)
7. Crewneck Sweatshirt (387)
8. Large Organic Tote (327)
9. White Glossy Mug (20)
10. Poster (1)

### Phase 3: Remaining Products
11. Sports Jersey (679)
12. Samsung Case (46)
13. Black Glossy Mug (21)
14. Framed Poster (2)

---

## Alternative: Free Resources

If AI generation isn't available, try these free resources:

### Flaticon
Search: "[product] outline icon"
- https://www.flaticon.com/search?word=t-shirt%20outline
- Download as PNG, 2000px

### Vecteezy
Search: "[product] outline vector"
- https://www.vecteezy.com/free-vector/t-shirt-outline
- Download SVG, convert to PNG

### Freepik
Search: "[product] mockup outline"
- https://www.freepik.com/search?format=search&query=tshirt%20outline
- Free account required

### The Noun Project
Search: "[product] outline"
- https://thenounproject.com/
- Download PNG, resize to 2000px

---

## Quality Checklist

Before using an outline:

- [ ] Transparent background (no white/gray)
- [ ] Black or dark gray outline
- [ ] Clean, smooth edges (no jagged pixels)
- [ ] Proper size (2000x2000px minimum)
- [ ] Centered in canvas
- [ ] Front-facing view
- [ ] No model, background, or lifestyle elements
- [ ] File size < 500KB
- [ ] Correct filename (matches `productOutlines.ts`)
- [ ] Saved in `frontend/public/product-outlines/`

---

## Testing Your Outlines

1. Add image to `frontend/public/product-outlines/`
2. Verify filename matches `productOutlines.ts`
3. Start dev server: `npm run dev`
4. Navigate to `/design/[productId]`
5. Check:
   - ✅ Outline appears
   - ✅ No white background
   - ✅ Print area aligns correctly
   - ✅ Size looks appropriate
6. Adjust `scaleFactor` if needed

---

## Need Help?

- **AI not generating transparent backgrounds?** Use remove.bg after generation
- **Outlines too detailed?** Emphasize "minimalist" and "simple" in prompt
- **Wrong view angle?** Specify "front view" or "front-facing" clearly
- **Including unwanted elements?** Add to negative prompt (Midjourney/SD)

See `PRODUCT_OUTLINES_GUIDE.md` for more troubleshooting.
