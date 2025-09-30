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

// Serve static files from the drawings folder
app.use('/drawings', express.static(path.join(__dirname, '../drawings')));
const port = process.env.PORT || 5000;

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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
