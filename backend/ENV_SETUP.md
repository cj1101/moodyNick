# Environment Variables Setup

Copy this content into a `.env` file in the `backend/` directory:

```env
# MongoDB Database Connection
# Get this from MongoDB Atlas: https://cloud.mongodb.com
# 1. Click on your cluster (moodyNick)
# 2. Click "Connect"
# 3. Choose "Connect your application"
# 4. Copy the connection string
# 5. Replace <password> with your database user password
# 6. Replace <dbname> with your database name (e.g., "moodynick")
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/moodynick?retryWrites=true&w=majority

# JWT Secret - Generate a random 32+ character string
# You can generate one at: https://randomkeygen.com/ or use: openssl rand -hex 32
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# Printful API Key
# Get from: https://www.printful.com/dashboard/api
PRINTFUL_API_KEY=your_printful_api_key_here

# Optional: Printful Webhook Secret (for webhook verification)
# PRINTFUL_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Google Gemini API Key (for AI outline generation)
# Get from: https://aistudio.google.com/app/apikey
# GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Price Multiplier (defaults to 2.4 if not set)
# PRICE_MULTIPLIER=2.4

# Optional: Public URL (defaults to http://localhost:5000)
# For production: https://api.moodyart.shop
# PUBLIC_URL=http://localhost:5000

# Optional: Port (defaults to 5000)
# Check with Hostinger for available ports in production
# PORT=5000

# Environment (development, production, test)
# For production deployment, set to: production
NODE_ENV=development
```

## Quick Setup Steps

1. **Create `.env` file**: Copy the content above into `backend/.env`
2. **Get MongoDB Connection String**: Follow instructions in `MONGODB_SETUP.md`
3. **Update variables**: Replace placeholders with your actual values
4. **Test**: Run `node backend/server.js` to verify connection

See `MONGODB_SETUP.md` for detailed MongoDB Atlas setup instructions.

