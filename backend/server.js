require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS middleware - allow frontend to communicate with backend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Increase body size limit to handle large canvas data URLs (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const port = process.env.PORT || 5000;

// Serve static files for preselected shop pages
app.use(express.static(path.join(__dirname, 'public')));

// Serve artwork directory for design tool
app.use('/art', express.static(path.join(__dirname, '..', 'art')));

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

console.log('[SERVER] Registering API routes...');
app.use('/api/auth', require('./routes/auth'));
console.log('[SERVER] ✓ Auth routes registered');
app.use('/api/catalog', require('./routes/catalog'));
console.log('[SERVER] ✓ Catalog routes registered');
app.use('/api/designs', require('./routes/designs'));
console.log('[SERVER] ✓ Designs routes registered');
app.use('/api/mockups', require('./routes/mockups'));
console.log('[SERVER] ✓ Mockups routes registered');
app.use('/api/orders', require('./routes/orders'));
console.log('[SERVER] ✓ Orders routes registered');
app.use('/api/outlines', require('./routes/outlines'));
console.log('[SERVER] ✓ Outlines routes registered');

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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

