# Hostinger Deployment Guide

This guide covers deploying the moodyNick application to Hostinger using a subdomain approach.

## Architecture

- **Backend API**: `api.moodyart.shop` (Express server)
- **Frontend Website**: `moodyart.shop` (Next.js app)

## Prerequisites

1. Hostinger account with domain `moodyart.shop`
2. Node.js installed on Hostinger hosting
3. MongoDB Atlas database (or MongoDB instance)
4. All API keys configured (Printful, etc.)

## Subdomain Setup

### 1. Create API Subdomain

In your Hostinger control panel:

1. Go to **Domains** → **Subdomains**
2. Create a new subdomain: `api`
3. Point it to a separate directory or document root (recommended: separate directory for API)

### 2. DNS Configuration

Ensure both domains point to your Hostinger hosting:
- `moodyart.shop` → Main hosting
- `api.moodyart.shop` → API subdomain (can point to same server, different port/directory)

## Backend Deployment (api.moodyart.shop)

### 1. Upload Backend Files

Upload the entire `backend/` directory to your Hostinger server, typically to:
- `/public_html/api/` or
- `/public_html/api.moodyart.shop/` or
- A separate directory configured for the API subdomain

### 2. Install Dependencies

SSH into your server and navigate to the backend directory:

```bash
cd /path/to/backend
npm install --production
```

### 3. Environment Variables

Create a `.env` file in the backend directory with production values:

```env
# MongoDB Database Connection
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/moodynick?retryWrites=true&w=majority

# JWT Secret (use a strong, random secret)
JWT_SECRET=your-production-jwt-secret-here

# Printful API Key
PRINTFUL_API_KEY=your_printful_api_key_here

# Printful Webhook Secret (for webhook verification)
PRINTFUL_WEBHOOK_SECRET=your_webhook_secret_here

# Google Gemini API Key (if applicants for AI outline generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Price Multiplier (defaults to 2.4 if not set)
PRICE_MULTIPLIER=2.4

# Environment
NODE_ENV=production

# Port (check Hostinger documentation for available ports)
PORT=5000

# Public URL (for generating absolute URLs)
PUBLIC_URL=https://api.moodyart.shop
```

### 4. Configure Process Manager

Hostinger typically uses PM2 or similar. Install and configure:

```bash
# Install PM2 globally
npm install -g pm2

# Start your application
pm2 start server.js --name moodynick-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

### 5. Configure Reverse Proxy (if using Node.js directly)

If Hostinger requires a reverse proxy setup, configure it to forward requests from the subdomain to your Node.js server.

## Frontend Deployment (moodyart.shop)

### 1. Build the Next.js Application

Locally or on the server:

```bash
cd frontend
npm install
npm run build
```

This creates an optimized production build in `.next/` directory.

### 2. Upload Frontend Files

Upload the following to your main domain root (`public_html/`):
- `.next/` directory (production build)
- `public/` directory
- `node_modules/` (production dependencies)
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- Any other required Next.js files

### 3. Environment Variables

For Next.js, create a `.env.production` file or set environment variables in Hostinger:

```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.moodyart.shop
```

**Note**: Next.js requires `NEXT_PUBLIC_` prefix for client-side accessible variables.

### 4. Start Next.js Production Server

```bash
cd /path/to/frontend
npm install --production
pm2 start npm --name moodynick-frontend -- start
pm2 save
```

Or if Hostinger provides a specific way to run Node.js apps, follow their documentation.

## Alternative: Static Export (if supported)

If Hostinger supports static hosting and you want to use static export:

1. Update `next.config.ts` to enable static export
2. Build with `npm run build`
3. Upload the `out/` directory to `public_html/`

**Note**: Static export has limitations - API routes won't work, and some Next.js features may not be available.

## SSL Certificates

Ensure both domains have SSL certificates:
- `moodyart.shop`
- `api.moodyart.shop`

Hostinger typically provides free SSL via Let's Encrypt. Enable it for both domains in the control panel.

## Webhook Configuration

### Printful Webhook

Update your Printful webhook URL to:
```
https://api.moodyart.shop/api/orders/printful-webhook
```

Configure this in your Printful dashboard under Settings → Webhooks.

## Testing

After deployment, test:

1. **Backend Health Check**: Visit `https://api.moodyart.shop/` - should show "Hello World!"
2. **Frontend**: Visit `https://moodyart.shop/` - should load the Next.js app
3. **API Connection**: Test API calls from frontend to backend
4. **CORS**: Verify CORS is working correctly
5. **Authentication**: Test login/register flows
6. **API Endpoints**: Test critical endpoints

## Monitoring

Set up monitoring for both applications:

```bash
# View logs
pm2 logs moodynick-api
pm2 logs moodynick-frontend

# Monitor process status
pm2 status

# Restart applications
pm2 restart moodynick-api
pm2 restart moodynick-frontend
```

## Troubleshooting

### CORS Errors
- Verify CORS configuration in `backend/server.js`
- Ensure frontend domain is in allowed origins
- Check that both domains are using HTTPS

### API Not Connecting
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Check backend server is running and accessible
- Verify firewall/port configuration

### Static Files Not Loading
- Check file paths are correct
- Verify static file serving configuration
- Check file permissions

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes Hostinger server IP
- Check DATABASE_URL is correct
- Verify network connectivity

## Additional Notes

- Keep `.env` files secure and never commit them to version control
- Regularly update dependencies for security patches
- Set up automated backups for your database
- Consider using a CDN for static assets if available
- Monitor server resources and scale as needed

