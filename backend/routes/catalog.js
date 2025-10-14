const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const auth = require('../middleware/auth');

// GET all products from Printful API
router.get('/products', async (req, res) => {
  try {
    const response = await fetch('https://api.printful.com/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching products from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET preselected products from Printful Store (Sync API)
router.get('/store-products', async (req, res) => {
  try {
    const response = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ message: 'Failed to fetch store products', error: data });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching store products from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a single preselected product details by sync product id
router.get('/store-products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`https://api.printful.com/store/products/${id}` , {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ message: 'Failed to fetch store product', error: data });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching store product from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all artwork from the database
router.get('/artwork', async (req, res) => {
  try {
    const artworks = await Artwork.find();
    res.json(artworks);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/catalog/artwork/upload
// @desc    Upload a new artwork
// @access  Private
router.post('/artwork/upload', auth, async (req, res) => {
    const { imageUrl, tags } = req.body;

    try {
        const newArtwork = new Artwork({
            imageUrl,
            tags
        });

        const artwork = await newArtwork.save();
        res.json(artwork);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
