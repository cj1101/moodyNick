# MoodyNick Workflow Clarification

## Store ID Configuration

✅ **Store ID: 16924354** (from your settings URL)

This has been added to `.env.example`. You need to:
1. Copy `.env.example` to `backend/.env`
2. Add your actual Printful API key
3. The store ID is already set to 16924354

## Printful Integration Workflow

### **Current Implementation: ON-DEMAND PRINTING (Correct Approach)**

Your current setup is **correct** for on-demand printing. Here's how it works:

```
User Journey:
1. Browse Products → Fetches Printful catalog (t-shirts, hoodies, etc.)
2. Select Product → Opens design page with that product
3. Design Canvas → User adds drawings from your local folder + customizes
4. Add to Cart → Saves design data locally
5. Checkout → User enters shipping info and pays
6. Order Submission → Creates order directly with Printful
7. Printful Fulfills → Prints and ships to customer
```

### **Key Point: You DON'T Need to Pre-Create Products**

❌ **NOT NEEDED:** Creating products in your Printful store beforehand
✅ **CORRECT:** Directly submitting orders with variant IDs and design files

## Current Workflow Issues & Solutions

### Issue 1: Product Catalog Endpoint
**Problem:** Your code fetches from `/store/products` which requires pre-created products.

**Solution:** Use the Catalog API instead to browse available blank products:
- Endpoint: `GET /products` (Catalog API)
- Returns: All available Printful products (t-shirts, hoodies, etc.)
- No authentication needed for basic catalog browsing

### Issue 2: Local Drawings Not Accessible
**Problem:** Drawings are stored locally but need to be:
1. Served to the frontend for display
2. Uploaded to a public URL for Printful to access

**Solution Implemented:**
- ✅ Backend now serves drawings at `http://localhost:5000/drawings/backgroundTransparent/`
- ✅ Artwork endpoint now lists all local drawings
- ⚠️ **Still Needed:** Upload mechanism to make files publicly accessible to Printful

### Issue 3: File Upload for Printful Orders
**Problem:** Printful needs publicly accessible URLs to download design files.

**Options:**
1. **Cloudinary** (Recommended for MVP)
   - Free tier: 25GB storage, 25GB bandwidth/month
   - Easy image upload API
   - Automatic CDN delivery
   
2. **AWS S3**
   - More complex setup
   - Pay-as-you-go pricing
   
3. **Printful File Library API**
   - Upload files directly to Printful
   - Endpoint: `POST /files`
   - Files stored in your Printful account

## Complete Order Flow

### Step 1: User Designs Product
```javascript
// Frontend: design/[productId]/page.tsx
// User drags drawings onto canvas
// Canvas state: { images: [...], texts: [...] }
```

### Step 2: Generate Mockup (Optional Preview)
```javascript
// Backend: POST /api/mockups/generate
// Requires: variant_ids, files with public URLs
// Returns: Mockup images for preview
```

### Step 3: Upload Design Files
```javascript
// NEW ENDPOINT NEEDED: POST /api/files/upload
// Takes: Canvas image data (base64 or file)
// Returns: Public URL for Printful to access
```

### Step 4: Create Order
```javascript
// Backend: POST /api/orders/create-order
// Sends to Printful: variant_id, design file URLs, shipping address
// Printful: Prints and ships product
// Database: Saves order record
```

## What Needs to Be Built

### 1. File Upload Service (CRITICAL)
Create a new route to handle design file uploads:

```javascript
// backend/routes/files.js
// Options:
// A) Upload to Cloudinary
// B) Upload to Printful File Library
// C) Upload to AWS S3
```

### 2. Update Catalog Route
Change from `/store/products` to `/products` (Catalog API):

```javascript
// backend/routes/catalog.js
// Current: fetch('https://api.printful.com/store/products')
// Change to: fetch('https://api.printful.com/products')
```

### 3. Canvas Export Function
Add ability to export canvas as image:

```javascript
// frontend: design/[productId]/page.tsx
// Use Konva's toDataURL() to export canvas
// Send to backend for upload
```

### 4. Update Order Creation
Ensure order includes proper file URLs:

```javascript
// backend/routes/orders.js
// items[].files should contain:
// [{ url: "https://public-url-to-design.png" }]
```

## Recommended Next Steps

1. **Choose File Upload Solution**
   - Recommend: Cloudinary (easiest for MVP)
   - Sign up: https://cloudinary.com
   - Get API credentials

2. **Update .env with Cloudinary Credentials**
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Install Cloudinary SDK**
   ```bash
   cd backend
   npm install cloudinary
   ```

4. **Create File Upload Route**
   - Accept canvas image data
   - Upload to Cloudinary
   - Return public URL

5. **Update Order Flow**
   - Export canvas as image
   - Upload to get public URL
   - Submit order with URL

## Testing the Workflow

### Test 1: Local Drawings Display
```bash
# Start backend
cd backend && npm start

# Visit in browser
http://localhost:5000/drawings/backgroundTransparent/IMG_0004.PNG

# Should display the image
```

### Test 2: Artwork API
```bash
# Visit in browser
http://localhost:5000/api/catalog/artwork

# Should return JSON array of all drawings
```

### Test 3: Product Catalog
```bash
# Visit in browser
http://localhost:5000/api/catalog/products

# Should return Printful products
# NOTE: Currently may fail if no products in store
# Will fix by switching to Catalog API
```

## Questions Answered

### Q: Do we need to create products in Printful store?
**A:** No! You're doing on-demand printing. Just submit orders directly with variant IDs.

### Q: Where should drawings be stored?
**A:** 
- ✅ Local folder for source files (done)
- ✅ Backend serves them to frontend (done)
- ⚠️ Need to upload to cloud for Printful access (next step)

### Q: What happens when user completes order?
**A:**
1. User designs product on canvas
2. Canvas exported as image
3. Image uploaded to cloud (Cloudinary/S3)
4. Order sent to Printful with:
   - variant_id (which product)
   - file URL (the design)
   - shipping address
5. Printful prints and ships
6. Order saved to your database (optional, for history)

### Q: Do we save products after creation?
**A:** You can, but it's optional. The order is what matters. Saving to your database just gives users order history.

## Current Status

✅ **Completed:**
- Store ID added to config
- Local drawings served by backend
- Artwork API lists all drawings
- Order creation route exists
- Mockup generation route exists

⚠️ **Needs Work:**
- File upload to cloud storage
- Canvas export functionality
- Product catalog endpoint (switch to Catalog API)
- Integration of upload flow into order process

🔴 **Blockers:**
- Printful can't access local files
- Need public URLs for design files
- Must implement file upload service

## Next Session Priorities

1. Set up Cloudinary account
2. Create file upload route
3. Add canvas export to design page
4. Test complete order flow
5. Update product catalog to use Catalog API

---

**Last Updated:** 2025-09-29
