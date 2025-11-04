# Deployment Checklist

Use this checklist when deploying to Hostinger.

## Pre-Deployment

- [ ] All code committed and pushed to repository
- [ ] Tested locally with production environment variables
- [ ] Database backup created (if updating existing deployment)
- [ ] MongoDB Atlas IP whitelist includes Hostinger server IP
- [ ] SSL certificates ready for both domains

## Backend Deployment (api.moodyart.shop)

- [ ] Created `api` subdomain in Hostinger control panel
- [ ] Backend files uploaded to server
- [ ] `.env` file created with production values:
  - [ ] `DATABASE_URL` (MongoDB connection string)
  - [ ] `JWT_SECRET` (strong random secret)
  - [ ] `PRINTFUL_API_KEY`
  - [ ] `PRINTFUL_WEBHOOK_SECRET` (if using webhooks)
  - [ ] `NODE_ENV=production`
  - [ ] `PUBLIC_URL=https://api.moodyart.shop`
  - [ ] `PORT` (configured according to Hostinger)
- [ ] Dependencies installed (`npm install --production`)
- [ ] Process manager configured (PM2 or Hostinger's solution)
- [ ] Server starts successfully
- [ ] Health check endpoint responds: `https://api.moodyart.shop/`
- [ ] SSL certificate active for `api.moodyart.shop`

## Frontend Deployment (moodyart.shop)

- [ ] Frontend built for production (`npm run build`)
- [ ] `.env.production` or environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_API_BASE_URL=https://api.moodyart.shop`
- [ ] Production build files uploaded
- [ ] Next.js server configured and running
- [ ] Frontend accessible: `https://moodyart.shop/`
- [ ] SSL certificate active for `moodyart.shop`

## Configuration Updates

- [ ] CORS configured to allow `https://moodyart.shop`
- [ ] Printful webhook URL updated to: `https://api.moodyart.shop/api/orders/printful-webhook`
- [ ] Printful OAuth callback URL (if applicable): `https://api.moodyart.shop/api/printful/callback`

## Testing

- [ ] Backend API responds at `https://api.moodyart.shop/`
- [ ] Frontend loads at `https://moodyart.shop/`
- [ ] Frontend can connect to backend API
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes require authentication
- [ ] Design creation works
- [ ] Mockup generation works
- [ ] Order creation works
- [ ] Static assets load correctly
- [ ] Images load from `/art` directory
- [ ] No CORS errors in browser console
- [ ] No console errors

## Post-Deployment

- [ ] Monitoring/logging configured
- [ ] Error tracking set up (if applicable)
- [ ] Performance monitoring active
- [ ] Documentation updated with production URLs
- [ ] Team notified of deployment

## Rollback Plan

If issues occur:
1. Keep previous version files accessible
2. Revert environment variables if needed
3. Restore from database backup if data corrupted
4. Check PM2 logs: `pm2 logs`
5. Check server error logs

