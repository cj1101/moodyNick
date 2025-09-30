# MoodyNick Deployment Guide

## 🚀 Local Development

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Printful API key
- Stripe API keys

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   PRINTFUL_API_KEY=your_printful_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   DATABASE_URL=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret_string
   PORT=5000
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```
   
   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file (optional for local dev):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
   
   Note: If not set, it defaults to `http://localhost:5000`

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Frontend will run on `http://localhost:3000`

### Testing Locally

1. Open browser to `http://localhost:3000`
2. You should see the MoodyNick landing page
3. Navigate to Shop to see products
4. Register/Login to access design features

---

## 🌐 Production Deployment

### Backend Deployment (Node.js/Express)

#### Option 1: Heroku

1. **Install Heroku CLI and login:**
   ```bash
   heroku login
   ```

2. **Create new Heroku app:**
   ```bash
   cd backend
   heroku create moodynick-api
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set PRINTFUL_API_KEY=your_key
   heroku config:set STRIPE_SECRET_KEY=your_key
   heroku config:set STRIPE_PUBLISHABLE_KEY=your_key
   heroku config:set DATABASE_URL=your_mongodb_url
   heroku config:set JWT_SECRET=your_secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

5. **Note your API URL:** `https://moodynick-api.herokuapp.com`

#### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Select the `backend` directory
4. Add environment variables in Railway dashboard
5. Deploy automatically on push

#### Option 3: DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Create new app from GitHub
3. Configure build settings:
   - Build Command: `npm install`
   - Run Command: `npm start`
   - Source Directory: `backend`
4. Add environment variables
5. Deploy

### Frontend Deployment (Next.js)

#### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend and deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Set environment variable in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`

4. **Redeploy to apply environment variables:**
   ```bash
   vercel --prod
   ```

#### Option 2: Netlify

1. Connect your GitHub repo to Netlify
2. Configure build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`
4. Deploy

#### Option 3: Self-Hosted

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Use a process manager like PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "moodynick-frontend" -- start
   ```

4. **Configure Nginx as reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🔐 Environment Variables Reference

### Backend (.env)
```env
# Printful API
PRINTFUL_API_KEY=your_printful_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...

# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/moodynick

# Authentication
JWT_SECRET=your_very_long_random_secret_string_here

# Server
PORT=5000
NODE_ENV=production
```

### Frontend (.env.local or deployment platform)
```env
# API URL - points to your deployed backend
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 🔧 CORS Configuration

When deploying to production, update the backend CORS settings in `backend/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',           // Local development
    'https://yourdomain.com',          // Production frontend
    'https://www.yourdomain.com'       // Production frontend with www
  ],
  credentials: true
}));
```

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] All environment variables set
- [ ] MongoDB connection string updated for production
- [ ] CORS configured with production frontend URL
- [ ] Printful API key is valid
- [ ] Stripe keys are production keys (not test keys)
- [ ] JWT_SECRET is secure and random

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` points to production backend
- [ ] All API calls use the config file
- [ ] Build completes without errors (`npm run build`)
- [ ] No console errors in production build

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Products load from Printful
- [ ] Design tool functions correctly
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] Orders are created in Printful
- [ ] Profile page shows designs and orders

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running and accessible
- Check CORS settings in backend
- Inspect browser console for errors

### Products not loading
- Verify Printful API key is valid
- Check backend logs for API errors
- Ensure backend `/api/catalog/products` endpoint works

### Authentication issues
- Check JWT_SECRET is set in backend
- Verify token is being stored in localStorage
- Check token expiration settings

### Deployment fails
- Check build logs for errors
- Verify all dependencies are in package.json
- Ensure Node.js version compatibility
- Check environment variables are set

---

## 📊 Monitoring & Maintenance

### Recommended Tools
- **Backend Monitoring:** Sentry, LogRocket, or Datadog
- **Frontend Monitoring:** Vercel Analytics, Google Analytics
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry

### Regular Maintenance
- Monitor Printful API usage and limits
- Check Stripe transaction logs
- Review MongoDB database size
- Update dependencies regularly
- Backup database regularly

---

## 🔒 Security Best Practices

1. **Never commit `.env` files to Git**
2. **Use HTTPS in production** (SSL/TLS certificates)
3. **Rotate JWT secrets periodically**
4. **Use Stripe production keys only in production**
5. **Implement rate limiting** on API endpoints
6. **Sanitize user inputs** to prevent XSS/SQL injection
7. **Keep dependencies updated** for security patches
8. **Use environment-specific configurations**

---

## 📞 Support

For issues or questions:
- Check the `IMPLEMENTATION_SUMMARY.md` for feature documentation
- Review `projectPlan.txt` for development roadmap
- Consult API documentation for Printful and Stripe

---

**Last Updated:** 2025-09-29
