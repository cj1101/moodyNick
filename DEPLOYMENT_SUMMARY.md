# Hostinger Deployment Summary

## Quick Reference

### Domains
- **Frontend**: `https://moodyart.shop` (Next.js)
- **Backend API**: `https://api.moodyart.shop` (Express)

### Key Configuration Changes

#### Frontend (`frontend/src/config/api.ts`)
- Production API URL automatically uses: `https://api.moodyart.shop`
- Override with: `NEXT_PUBLIC_API_BASE_URL` environment variable

#### Backend (`backend/server.js`)
- CORS configured for: `https://moodyart.shop` and `https://www.moodyart.shop`
- Production environment validation enabled

### Environment Variables

#### Backend Production `.env`
```env
NODE_ENV=production
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your-production-secret
PRINTFUL_API_KEY=your_key
PRINTFUL_WEBHOOK_SECRET=your_secret
PUBLIC_URL=https://api.moodyart.shop
PORT=5000
```

#### Frontend Production
```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.moodyart.shop
```

### Important URLs to Update

1. **Printful Webhook**: `https://api.moodyart.shop/api/orders/printful-webhook`
2. **Printful OAuth Callback** (if using): `https://api.moodyart.shop/api/printful/callback`

### Files Created/Updated

✅ `frontend/src/config/api.ts` - Updated production API URL
✅ `backend/server.js` - Updated CORS for production
✅ `backend/ENV_SETUP.md` - Added production notes
✅ `HOSTINGER_DEPLOYMENT.md` - Complete deployment guide
✅ `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

### Next Steps

1. Review `HOSTINGER_DEPLOYMENT.md` for detailed instructions
2. Follow `DEPLOYMENT_CHECKLIST.md` during deployment
3. Test both domains after deployment
4. Update Printful webhook URLs in Printful dashboard

