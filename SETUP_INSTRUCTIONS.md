# MoodyNick Setup Instructions

## ✅ What I've Completed

### 1. Store ID Configuration
- Added `PRINTFUL_STORE_ID=16924354` to `.env.example`
- Confirmed this is your correct store ID from the settings URL

### 2. Local Drawings Integration
- Backend now serves drawings from `drawings/backgroundTransparent/` folder
- Accessible at: `http://localhost:5000/drawings/backgroundTransparent/[filename]`
- Artwork API endpoint updated to list all local drawings automatically

### 3. Product Catalog Fix
- Changed from Store API (`/store/products`) to Catalog API (`/products`)
- Now fetches all available Printful products without needing pre-created store products
- Updated frontend shop page to display catalog products correctly

### 4. Workflow Clarification
- Confirmed: You're using **on-demand printing** (correct approach)
- No need to pre-create products in Printful store
- Orders are submitted directly with variant IDs and design files

## 🔧 Required Setup Steps

### Step 1: Create Backend .env File

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Copy the example file:
   ```bash
   copy .env.example .env
   ```

3. Edit `backend/.env` and add your actual values:
   ```env
   # Printful API
   PRINTFUL_API_KEY=your_actual_printful_api_key_here
   PRINTFUL_STORE_ID=16924354

   # Stripe API Keys (get from https://dashboard.stripe.com/test/apikeys)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

   # Database
   DATABASE_URL=mongodb://localhost:27017/moodynick

   # JWT Secret (generate a long random string)
   JWT_SECRET=your_long_random_jwt_secret_here

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

### Step 2: Get Your Printful API Key

1. Go to: https://www.printful.com/dashboard/store
2. Select your store (ID: 16924354)
3. Click on "Settings" → "API"
4. Generate or copy your API key
5. Paste it into `backend/.env` as `PRINTFUL_API_KEY`

### Step 3: Test the Setup

1. Start the backend:
   ```bash
   cd backend
   npm start
   ```

2. Test the drawings endpoint in your browser:
   ```
   http://localhost:5000/api/catalog/artwork
   ```
   Should return JSON array of all your drawings

3. Test a specific drawing:
   ```
   http://localhost:5000/drawings/backgroundTransparent/IMG_0004.PNG
   ```
   Should display the image

4. Test the product catalog:
   ```
   http://localhost:5000/api/catalog/products
   ```
   Should return Printful's product catalog

5. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. Visit: http://localhost:3000/shop
   Should show Printful products

## 🎯 Current Workflow (How It Works Now)

### User Journey:
1. **Browse Products** → User visits `/shop` and sees Printful catalog
2. **Select Product** → Clicks a product (e.g., T-shirt)
3. **Design Canvas** → Opens design page at `/design/[productId]`
4. **Add Drawings** → Drags drawings from sidebar onto canvas
5. **Customize** → Moves, resizes, rotates drawings; adds text
6. **Add to Cart** → Saves design to localStorage
7. **Checkout** → Enters shipping info and payment
8. **Order Submission** → Backend sends order to Printful

### Current Data Flow:
```
Frontend Design Page
    ↓ (canvas state: images, texts, positions)
Add to Cart
    ↓ (stores in localStorage)
Checkout Page
    ↓ (user enters shipping info)
Backend: POST /api/orders/create-order
    ↓ (sends to Printful)
Printful API: POST /orders
    ↓ (creates order)
Printful Fulfillment
    ↓
Ships to Customer
```

## ⚠️ Critical Missing Piece: File Upload

### The Problem
Printful needs **publicly accessible URLs** to download design files. Currently:
- ❌ Drawings are served from `localhost` (not accessible to Printful)
- ❌ Canvas designs exist only in browser (not uploaded anywhere)

### The Solution
You need to implement file upload to a cloud service. Here are your options:

#### Option 1: Cloudinary (Recommended for MVP)
**Pros:**
- Free tier: 25GB storage, 25GB bandwidth/month
- Easy to implement
- Automatic image optimization
- CDN delivery

**Setup:**
1. Sign up: https://cloudinary.com/users/register/free
2. Get credentials from dashboard
3. Add to `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Install SDK:
   ```bash
   cd backend
   npm install cloudinary
   ```

#### Option 2: Printful File Library
**Pros:**
- Files stored directly in Printful
- No third-party service needed
- Already have Printful API key

**Setup:**
1. Use Printful's File Library API
2. Endpoint: `POST https://api.printful.com/files`
3. Upload design files before creating orders

#### Option 3: AWS S3
**Pros:**
- Industry standard
- Highly scalable

**Cons:**
- More complex setup
- Requires AWS account

## 📋 Next Steps (In Order)

### Immediate (To Test Current Setup):
1. ✅ Create `backend/.env` file with your API keys
2. ✅ Start backend and test endpoints
3. ✅ Start frontend and browse products
4. ✅ Test design page with local drawings

### Short-term (To Enable Orders):
1. **Choose file upload solution** (recommend Cloudinary)
2. **Create file upload route** in backend
3. **Add canvas export** to design page
4. **Update order flow** to upload files before submitting
5. **Test complete order flow** with Printful

### Medium-term (Production Ready):
1. Deploy backend to cloud (Heroku, Railway, etc.)
2. Deploy frontend to Vercel
3. Update file URLs to use production domains
4. Set up proper error handling
5. Add email notifications

## 🐛 Troubleshooting

### "Failed to fetch products"
- Check that backend is running on port 5000
- Verify `PRINTFUL_API_KEY` is set in `backend/.env`
- Check backend console for error messages

### "Artwork not loading"
- Ensure drawings folder exists at `drawings/backgroundTransparent/`
- Check file permissions
- Verify backend is serving static files

### "Product details not loading"
- Product IDs from catalog are numeric (e.g., 71, 19)
- Check browser console for errors
- Verify API endpoint in `frontend/src/config/api.ts`

### "Order creation fails"
- This is expected until file upload is implemented
- Printful needs public URLs for design files
- See "Critical Missing Piece" section above

## 📚 Key Files Reference

### Backend:
- `backend/.env` - Environment variables (YOU NEED TO CREATE THIS)
- `backend/server.js` - Main server, now serves drawings folder
- `backend/routes/catalog.js` - Updated to use Catalog API and serve local drawings
- `backend/routes/orders.js` - Order creation (needs file URLs)

### Frontend:
- `frontend/src/app/shop/page.tsx` - Updated for Catalog API products
- `frontend/src/app/design/[productId]/page.tsx` - Design canvas
- `frontend/src/config/api.ts` - API endpoint configuration

### Documentation:
- `WORKFLOW_CLARIFICATION.md` - Detailed workflow explanation
- `PRINTFUL_API_NOTES.md` - Printful API reference
- `projectPlan.txt` - Original project plan

## 🎨 Design Page Features (Already Working)

- ✅ Drag and drop drawings from sidebar
- ✅ Move, resize, rotate drawings on canvas
- ✅ Add and edit text
- ✅ Save design to database (for logged-in users)
- ✅ Add to cart functionality
- ⚠️ Mockup generation (needs public file URLs)
- ⚠️ Order submission (needs public file URLs)

## 💡 Understanding the Store ID

Your store ID (16924354) is used for:
- Identifying your Printful store in API calls
- Some endpoints require `X-PF-Store-Id` header
- Currently not needed for Catalog API or order creation
- May be needed for store-specific operations later

For on-demand printing, you mainly need:
- `PRINTFUL_API_KEY` - For authentication
- Variant IDs - From catalog (which product/size/color)
- Design file URLs - Public URLs to design images

## 🚀 Quick Start Command

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Browser
# Visit: http://localhost:3000
```

## ❓ Questions Answered

### Q: Is store ID 16924354 correct?
**A:** Yes! Extracted from your settings URL.

### Q: Do we need to create products in Printful store?
**A:** No! You're doing on-demand printing. Just submit orders with variant IDs.

### Q: Can users add drawings from the local folder?
**A:** Yes! Backend now serves them. They appear in the design page sidebar.

### Q: What happens when user finishes designing?
**A:** 
1. Design saved to cart (localStorage)
2. User goes to checkout
3. Enters shipping info
4. Pays via Stripe
5. Backend creates order with Printful
6. Printful prints and ships

### Q: Do we save products after creation?
**A:** Optional. You can save order history to your database for user profiles, but Printful handles the actual product creation and fulfillment.

---

**Status:** Setup complete, file upload needed for orders
**Last Updated:** 2025-09-29
