require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS middleware - allow frontend to communicate with backend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
const port = process.env.PORT || 5000;

// Serve static files for preselected shop pages
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/designs', require('./routes/designs'));
app.use('/api/mockups', require('./routes/mockups'));
app.use('/api/orders', require('./routes/orders'));

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
