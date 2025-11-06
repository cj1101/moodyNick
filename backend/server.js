require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

const app = express();

// Trust proxy for secure cookies and correct IPs behind proxies
app.set('trust proxy', 1);

// CORS: production host only; allow localhost in non-production for convenience
// CORS must be configured BEFORE helmet to ensure headers are set correctly
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://moodyart.shop',
      'https://www.moodyart.shop',
      'https://moodynick-frontend.vercel.app',
      // Allow all Vercel preview deployments
      /^https:\/\/.*\.vercel\.app$/
    ]
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      // Return the origin value (not just true) when using credentials
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers and gzip compression
// Configure Helmet to allow cross-origin requests
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Increase body size limit to handle large canvas data URLs (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const port = process.env.PORT || 5000;

// Validate critical environment variables at startup (fail fast in prod)
if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'PRINTFUL_API_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    // eslint-disable-next-line no-throw-literal
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Serve static files for preselected shop pages
app.use(express.static(path.join(__dirname, 'public')));

// Serve artwork directory for design tool
app.use('/art', express.static(path.join(__dirname, '..', 'art')));

mongoose.connect(process.env.DATABASE_URL)
  .then(() => logger.warn('MongoDB connected'))
  .catch(err => logger.error(err));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/designs', require('./routes/designs'));
app.use('/api/mockups', require('./routes/mockups'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/outlines', require('./routes/outlines'));
app.use('/api/pricing', require('./routes/pricing'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Serve preselected products shop pages
app.get('/shop/preselected', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop', 'preselected', 'index.html'));
});

app.get('/shop/preselected/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop', 'preselected', 'product.html'));
});

// Global error handler (must be after routes)
app.use(errorHandler);

app.listen(port, () => {
  logger.warn(`Server listening on ${port} (${process.env.NODE_ENV || 'development'})`);
});

