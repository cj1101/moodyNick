# MoodyNick - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### 1. Start the Backend
```bash
cd backend
npm start
```
✅ Backend running on `http://localhost:5000`

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend running on `http://localhost:3000`

### 3. Open Your Browser
Navigate to: **http://localhost:3000**

---

## 🎯 What You'll See

### Landing Page (/)
- Professional hero section with MoodyNick branding
- "Start Designing" and "Sign Up Free" buttons
- Feature showcase explaining the 3-step process
- Modern purple/blue gradient design

### Shop Page (/shop)
- Grid of products fetched from Printful API
- Click any product to start designing
- Responsive layout (1-4 columns based on screen size)

### Navigation Bar
- **Home** - Landing page
- **Shop** - Product catalog
- **Profile** - Your designs and orders (when logged in)
- **Cart** - Shopping cart with item count badge
- **Login/Signup** or **Logout** - Authentication buttons

---

## 📱 User Flow

1. **Browse** → Visit the landing page
2. **Shop** → Click "Start Designing" or navigate to Shop
3. **Register** → Create an account (required for saving designs)
4. **Design** → Click a product to open the design tool
   - Drag artwork onto canvas
   - Add and customize text
   - Save your design
5. **Cart** → Add design to cart
6. **Checkout** → Complete purchase
7. **Profile** → View your saved designs and order history

---

## 🔧 Configuration

### API URL Configuration
The frontend automatically uses `http://localhost:5000` for local development.

**For production deployment:**
Set the environment variable:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

All API calls are centralized in `frontend/src/config/api.ts`

---

## 🐛 Troubleshooting

### "Failed to load products"
- ✅ Make sure backend is running on port 5000
- ✅ Check backend console for errors
- ✅ Verify Printful API key is set in backend `.env`

### "Connection Error"
- ✅ Ensure both servers are running
- ✅ Check no other services are using ports 3000 or 5000
- ✅ Verify MongoDB connection in backend

### Products not showing
- ✅ Backend needs valid Printful API key
- ✅ Check backend logs: `GET /api/catalog/products`
- ✅ Verify internet connection (Printful API call)

### Cart count not updating
- ✅ Refresh the page
- ✅ Check browser console for errors
- ✅ Clear localStorage and try again

---

## 📚 Key Files

### Frontend
- `src/app/page.tsx` - Landing page
- `src/app/shop/page.tsx` - Product catalog
- `src/app/design/[productId]/page.tsx` - Design tool
- `src/components/Navbar.tsx` - Navigation bar
- `src/config/api.ts` - API configuration

### Backend
- `server.js` - Main server file
- `routes/catalog.js` - Product and artwork endpoints
- `routes/designs.js` - Design management
- `routes/orders.js` - Order processing
- `models/` - Database schemas

---

## 🎨 Features

### ✅ Implemented
- User registration and authentication
- Product catalog from Printful
- Interactive design tool (drag & drop, text)
- Shopping cart
- Checkout flow
- User profile with designs and orders
- Responsive design
- Modern UI with Tailwind CSS

### 🚧 For Production
- Stripe Elements integration
- File hosting for designs (AWS S3/Cloudinary)
- Email notifications
- Admin panel
- Design templates

---

## 📖 Documentation

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Project Plan:** `projectPlan.txt`

---

## 💡 Tips

1. **Test Account:** Register with any email (no verification required)
2. **Test Card:** Use `4242 4242 4242 4242` for Stripe testing
3. **Design Tool:** Click objects to select, drag to move, use handles to resize/rotate
4. **Save Often:** Designs are saved to your account
5. **Cart Persistence:** Cart items persist in localStorage

---

**Need Help?** Check the troubleshooting section or review the full documentation files.

**Last Updated:** 2025-09-29
