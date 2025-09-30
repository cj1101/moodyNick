# File Upload Implementation Guide

## Overview
To complete the order flow, you need to upload design files to a publicly accessible location so Printful can download them.

## Option 1: Cloudinary (Recommended)

### Why Cloudinary?
- ✅ Free tier: 25GB storage, 25GB bandwidth/month
- ✅ Simple API
- ✅ Automatic image optimization
- ✅ CDN delivery (fast worldwide)
- ✅ No server storage needed

### Setup Steps

#### 1. Sign Up
```
https://cloudinary.com/users/register/free
```

#### 2. Get Credentials
After signing up, go to Dashboard and copy:
- Cloud Name
- API Key
- API Secret

#### 3. Update .env
```env
# Add to backend/.env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 4. Install Package
```bash
cd backend
npm install cloudinary
```

#### 5. Create Upload Route

Create `backend/routes/files.js`:

```javascript
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   POST api/files/upload
// @desc    Upload a design file to Cloudinary
// @access  Private
router.post('/upload', auth, async (req, res) => {
  try {
    const { imageData } = req.body; // Base64 encoded image
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'moodynick-designs',
      resource_type: 'auto'
    });
    
    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ 
      message: 'Failed to upload file',
      error: error.message 
    });
  }
});

module.exports = router;
```

#### 6. Register Route in server.js

Add to `backend/server.js`:
```javascript
app.use('/api/files', require('./routes/files'));
```

#### 7. Update Design Page - Add Canvas Export

Add to `frontend/src/app/design/[productId]/page.tsx`:

```javascript
// Add this function inside DesignPage component
const exportCanvasAsImage = () => {
  if (!stageRef.current) return null;
  
  // Export canvas as base64 data URL
  const dataURL = stageRef.current.toDataURL({
    mimeType: 'image/png',
    quality: 1,
    pixelRatio: 2 // Higher quality
  });
  
  return dataURL;
};

// Update handleAddToCart function
const handleAddToCart = async () => {
  try {
    // Export canvas as image
    const canvasImage = exportCanvasAsImage();
    
    if (!canvasImage) {
      alert('Failed to export design');
      return;
    }
    
    // Upload to backend
    const token = localStorage.getItem('token');
    const uploadRes = await fetch(`${config.endpoints.base}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ imageData: canvasImage })
    });
    
    if (!uploadRes.ok) {
      throw new Error('Failed to upload design');
    }
    
    const uploadData = await uploadRes.json();
    
    // Save cart data with uploaded file URL
    const cartData = {
      productVariantId: parseInt(productId, 10),
      design: {
        images,
        texts,
        files: [{ url: uploadData.url }] // Public URL for Printful
      },
      designImageUrl: uploadData.url
    };
    
    localStorage.setItem('cart', JSON.stringify(cartData));
    alert('Design added to cart!');
    window.location.href = '/cart';
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Failed to add design to cart');
  }
};
```

#### 8. Test Upload Flow

```bash
# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm run dev

# Test:
# 1. Go to design page
# 2. Add some drawings
# 3. Click "Add to Cart"
# 4. Check backend console for upload confirmation
# 5. Check cart data in localStorage (should have file URL)
```

---

## Option 2: Printful File Library

### Why Printful File Library?
- ✅ Files stored directly in Printful
- ✅ No third-party service
- ✅ Already have API key

### Setup Steps

#### 1. Create Upload Route

Create `backend/routes/files.js`:

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   POST api/files/upload
// @desc    Upload a design file to Printful File Library
// @access  Private
router.post('/upload', auth, async (req, res) => {
  try {
    const { imageData, filename } = req.body; // Base64 encoded image
    
    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create form data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', buffer, {
      filename: filename || `design-${Date.now()}.png`,
      contentType: 'image/png'
    });
    
    // Upload to Printful
    const response = await fetch('https://api.printful.com/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    
    res.json({
      success: true,
      url: data.result.url,
      id: data.result.id
    });
  } catch (error) {
    console.error('Error uploading to Printful:', error);
    res.status(500).json({ 
      message: 'Failed to upload file',
      error: error.message 
    });
  }
});

module.exports = router;
```

#### 2. Install Required Package

```bash
cd backend
npm install form-data
```

#### 3. Register Route

Add to `backend/server.js`:
```javascript
app.use('/api/files', require('./routes/files'));
```

#### 4. Frontend Implementation

Same as Cloudinary option (steps 7-8 above).

---

## Comparison

| Feature | Cloudinary | Printful File Library |
|---------|-----------|----------------------|
| Setup Complexity | Easy | Medium |
| Free Tier | 25GB/month | Unknown |
| Speed | Fast (CDN) | Good |
| Dependencies | 1 npm package | 1 npm package |
| File Management | Dashboard UI | Via API only |
| Image Optimization | Automatic | Manual |
| **Recommendation** | ✅ Best for MVP | Good alternative |

---

## Testing Checklist

After implementing file upload:

- [ ] Backend route `/api/files/upload` exists
- [ ] Environment variables configured
- [ ] Design page exports canvas as image
- [ ] Upload request succeeds
- [ ] Public URL returned
- [ ] Cart data includes file URL
- [ ] Order creation uses file URL
- [ ] Printful can access the URL
- [ ] Order successfully submitted to Printful

---

## Next Steps After File Upload

1. **Update Order Creation**
   - Ensure `backend/routes/orders.js` uses file URLs from cart
   - Test order submission to Printful

2. **Add Mockup Generation**
   - Use uploaded file URL in mockup request
   - Display mockup preview before checkout

3. **Error Handling**
   - Handle upload failures gracefully
   - Show loading states during upload
   - Validate file size/type

4. **Production Deployment**
   - Deploy backend with environment variables
   - Update frontend API URLs
   - Test complete flow in production

---

## Code Snippets

### Check if File URL is Accessible

```javascript
// Test in Node.js
const testUrl = async (url) => {
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    console.log('Accessible:', response.ok);
  } catch (error) {
    console.error('Not accessible:', error.message);
  }
};

testUrl('https://res.cloudinary.com/your-cloud/image/upload/...');
```

### Verify Printful Can Access File

```javascript
// In backend/routes/orders.js, before creating order:
const verifyFileAccess = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('File not accessible:', error);
    return false;
  }
};

// Use it:
const fileUrl = design.files[0].url;
const isAccessible = await verifyFileAccess(fileUrl);
if (!isAccessible) {
  return res.status(400).json({ 
    message: 'Design file is not accessible' 
  });
}
```

---

## Common Issues

### Issue: "Upload fails with 413 Payload Too Large"
**Solution:** Increase body size limit in `server.js`:
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### Issue: "Cloudinary upload fails"
**Solution:** Check credentials in `.env` and verify account is active

### Issue: "Printful can't access file"
**Solution:** 
- Ensure URL is publicly accessible (no authentication required)
- Test URL in incognito browser window
- Check CORS settings if using S3

### Issue: "Canvas export is blank"
**Solution:**
- Ensure images have loaded before exporting
- Check CORS settings for external images
- Use `crossOrigin="anonymous"` in image loading

---

**Recommendation:** Start with Cloudinary for fastest implementation.

**Last Updated:** 2025-09-29
