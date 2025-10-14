# Testing the Product Outlines System

## Pre-Test Checklist

Before testing, ensure:

- [ ] `frontend/src/config/productOutlines.ts` exists
- [ ] `frontend/public/product-outlines/` directory exists
- [ ] Design page updated with outline logic
- [ ] Development server is running

## Test Scenarios

### Test 1: System with NO Outlines (Fallback Behavior)

**Purpose:** Verify fallback to Printful's blank mockup works

**Steps:**
1. Ensure `frontend/public/product-outlines/` is empty
2. Start dev server: `npm run dev`
3. Navigate to: `http://localhost:3000/design/71`
4. Open browser console

**Expected Results:**
- ⚠️ Console warning: "No local product outline found for product ID: 71"
- ⚠️ Console warning: "Falling back to Printful blank mockup generation"
- ⚠️ Console warning: "To add an outline: See PRODUCT_OUTLINES_GUIDE.md"
- Product image appears (from Printful)
- Blue dashed print-area overlay visible
- No errors or crashes

**Pass Criteria:**
- System gracefully falls back to Printful
- Helpful warnings guide user
- Design page still functional

---

### Test 2: System with Placeholder Outlines

**Purpose:** Verify local outlines load correctly

**Steps:**
1. Generate placeholders:
   - Open `frontend/scripts/create-placeholder-outlines.html`
   - Download all placeholders
   - Extract to `frontend/public/product-outlines/`

2. Restart dev server (if running)

3. Navigate to: `http://localhost:3000/design/71`

4. Check browser console

**Expected Results:**
- ✓ Console log: "Using local product outline: /product-outlines/unisex-staple-tshirt.png"
- ✓ Console log: "Category: apparel"
- ✓ Console log: "Supports color tint: true"
- ✓ Console log: "Scale factor: 0.85"
- Product outline appears (no model)
- Blue dashed print-area overlay visible
- Outline is properly sized and centered

**Pass Criteria:**
- Local outline loads successfully
- No Printful API calls for mockup
- Print area aligns with outline
- No console errors

---

### Test 3: Multiple Products

**Purpose:** Verify different product types work

**Test Products:**

| Product ID | Product Name | Expected Outline |
|------------|--------------|------------------|
| 71 | Unisex Staple T-Shirt | `unisex-staple-tshirt.png` |
| 146 | Heavy Blend Hoodie | `heavy-blend-hoodie.png` |
| 163 | Tote Bag | `tote-bag.png` |
| 45 | iPhone Case | `iphone-case.png` |
| 20 | White Glossy Mug | `white-glossy-mug.png` |

**Steps:**
For each product:
1. Navigate to `/design/[PRODUCT_ID]`
2. Verify outline appears
3. Check console logs
4. Test drag-and-drop artwork

**Expected Results:**
- Each product shows correct outline
- Different scale factors apply correctly
- Print area overlay aligns properly
- All products functional

**Pass Criteria:**
- All 5 products load outlines
- No errors in console
- Artwork can be placed on all products

---

### Test 4: Missing Outline File

**Purpose:** Verify error handling for misconfigured products

**Steps:**
1. Edit `productOutlines.ts`, add fake product:
   ```typescript
   '999': {
     imagePath: '/product-outlines/nonexistent.png',
     category: 'apparel',
     scaleFactor: 0.85,
   },
   ```

2. Navigate to: `http://localhost:3000/design/999`

3. Check browser console and network tab

**Expected Results:**
- Console warning about missing outline
- 404 error in network tab for `nonexistent.png`
- System falls back to Printful (or shows error)
- Page doesn't crash

**Pass Criteria:**
- Graceful error handling
- Clear error messages
- No app crashes

---

### Test 5: Artwork Placement on Outline

**Purpose:** Verify design functionality works with outlines

**Steps:**
1. Navigate to `/design/71`
2. Drag artwork from sidebar onto canvas
3. Resize and rotate artwork
4. Add text element
5. Position elements within print area

**Expected Results:**
- Artwork drags onto canvas
- Transform handles work
- Elements stay on top of outline
- Print area overlay remains visible
- All design tools functional

**Pass Criteria:**
- Full design functionality
- Outline doesn't interfere with interaction
- Print area clearly visible
- Can save design

---

### Test 6: Scale Factor Adjustment

**Purpose:** Verify scale factor configuration works

**Steps:**
1. Navigate to `/design/71` (T-shirt, scale: 0.85)
2. Note outline size
3. Edit `productOutlines.ts`, change scale to 0.5
4. Refresh page
5. Note new outline size

**Expected Results:**
- Outline size changes
- Smaller scale = smaller outline
- Print area overlay unaffected
- No layout breaks

**Pass Criteria:**
- Scale factor applies correctly
- Outline resizes proportionally
- No visual glitches

---

### Test 7: Browser Compatibility

**Purpose:** Verify cross-browser support

**Browsers to Test:**
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

**Steps:**
For each browser:
1. Navigate to `/design/71`
2. Verify outline loads
3. Test transparency rendering
4. Test drag-and-drop

**Expected Results:**
- Outlines load in all browsers
- Transparency renders correctly
- No browser-specific errors

**Pass Criteria:**
- Works in all tested browsers
- Consistent appearance
- No functionality differences

---

### Test 8: Performance

**Purpose:** Verify system doesn't impact performance

**Steps:**
1. Open DevTools → Network tab
2. Navigate to `/design/71`
3. Check:
   - Outline image load time
   - Total page load time
   - Number of requests

**Expected Results:**
- Outline loads quickly (< 500ms)
- File size reasonable (< 500KB)
- No unnecessary requests
- Page responsive

**Pass Criteria:**
- Fast load times
- Optimized images
- Good performance

---

### Test 9: Console Logging

**Purpose:** Verify helpful logging for developers

**Steps:**
1. Navigate to `/design/71` (with outline)
2. Check console logs
3. Navigate to `/design/999` (without outline)
4. Check console warnings

**Expected Results:**

**With outline:**
```
✓ Using local product outline: /product-outlines/unisex-staple-tshirt.png
  Category: apparel
  Supports color tint: true
  Scale factor: 0.85
```

**Without outline:**
```
⚠️ No local product outline found for product ID: 999
   Falling back to Printful blank mockup generation
   To add an outline: See PRODUCT_OUTLINES_GUIDE.md
```

**Pass Criteria:**
- Clear, helpful messages
- Proper log levels (log vs warn)
- Actionable guidance

---

### Test 10: Production Build

**Purpose:** Verify system works in production

**Steps:**
1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Navigate to `/design/71`

4. Verify outline loads

**Expected Results:**
- Build completes successfully
- Outlines load in production
- No build warnings/errors
- Static files served correctly

**Pass Criteria:**
- Clean build
- Outlines work in production
- No runtime errors

---

## Automated Testing (Optional)

Create a test script:

```javascript
// frontend/tests/productOutlines.test.ts

import { 
  getProductOutline, 
  hasProductOutline,
  getAvailableOutlineProductIds 
} from '@/config/productOutlines';

describe('Product Outlines System', () => {
  test('getProductOutline returns config for valid ID', () => {
    const config = getProductOutline('71');
    expect(config).toBeDefined();
    expect(config?.imagePath).toBe('/product-outlines/unisex-staple-tshirt.png');
    expect(config?.category).toBe('apparel');
  });

  test('getProductOutline returns null for invalid ID', () => {
    const config = getProductOutline('99999');
    expect(config).toBeNull();
  });

  test('hasProductOutline returns true for configured products', () => {
    expect(hasProductOutline('71')).toBe(true);
    expect(hasProductOutline('146')).toBe(true);
  });

  test('hasProductOutline returns false for unconfigured products', () => {
    expect(hasProductOutline('99999')).toBe(false);
  });

  test('getAvailableOutlineProductIds returns array', () => {
    const ids = getAvailableOutlineProductIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain('71');
  });
});
```

Run tests:
```bash
npm test
```

---

## Regression Testing

After making changes, re-run:

1. Test 2: System with Placeholder Outlines
2. Test 3: Multiple Products
3. Test 5: Artwork Placement on Outline

---

## Bug Reporting Template

If you find issues:

```markdown
**Bug:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Node version: [X.X.X]
- Product ID tested: [XX]

**Console Errors:**
[Paste any errors]

**Screenshots:**
[If applicable]
```

---

## Success Criteria

System is ready for production when:

- ✅ All 10 tests pass
- ✅ No console errors
- ✅ Outlines load in < 500ms
- ✅ Works in all major browsers
- ✅ Fallback behavior works correctly
- ✅ Documentation is clear
- ✅ At least 5 products have quality outlines
- ✅ Production build succeeds

---

## Next Steps After Testing

1. **Generate Quality Outlines**
   - Replace placeholders with AI-generated or professionally designed outlines
   - See `AI_PROMPTS_FOR_OUTLINES.md`

2. **Expand Product Coverage**
   - Add more products based on demand
   - See `PRODUCT_OUTLINES_GUIDE.md`

3. **Optimize Performance**
   - Compress images with TinyPNG
   - Implement lazy loading (if needed)

4. **Gather User Feedback**
   - Test with real users
   - Iterate based on feedback

5. **Monitor Analytics**
   - Track which products are most used
   - Prioritize outline creation accordingly
