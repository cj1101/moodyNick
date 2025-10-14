require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const OUTLINES_DIR = path.join(__dirname, 'generated-outlines');

// CORS middleware - allow frontend to communicate with backend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Increase payload limit for base64 images in mockup generation
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use('/drawings', express.static(path.join(__dirname, '../drawings')));
app.use('/generated-outlines', express.static(OUTLINES_DIR));
const port = process.env.PORT || 5000;

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/designs', require('./routes/designs'));
app.use('/api/outlines', require('./routes/outlines'));
app.use('/api/mockups', require('./routes/mockups'));
app.use('/api/orders', require('./routes/orders'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
