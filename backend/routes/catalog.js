const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

// GET all products from Printful Catalog API
router.get('/products', async (req, res) => {
  try {
    const response = await fetch('https://api.printful.com/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    // Printful API returns { code: 200, result: [...] }
    // Each item in result is a catalog product object
    if (data.code === 200 && data.result) {
      // Return the catalog products
      res.json(data.result);
    } else {
      console.error('Unexpected Printful API response:', data);
      res.status(500).json({ message: 'Failed to fetch products from Printful' });
    }
  } catch (error) {
    console.error('Error fetching products from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a specific product by ID from Printful Catalog API
router.get('/products/:id', async (req, res) => {
  try {
    console.log(`Fetching product with ID: ${req.params.id}`);
    const response = await fetch(`https://api.printful.com/products/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    console.log(`Product ${req.params.id} response:`, JSON.stringify(data, null, 2));
    
    if (data.code === 200 && data.result) {
      res.json(data.result);
    } else {
      console.error('Unexpected Printful API response:', data);
      res.status(404).json({ message: 'Product not found', error: data.error || data.result });
    }
  } catch (error) {
    console.error('Error fetching product from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a specific variant by product ID and variant ID from Printful Catalog API
router.get('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    console.log(`Fetching variant ${req.params.variantId} for product ${req.params.productId}`);
    const response = await fetch(`https://api.printful.com/products/${req.params.productId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    if (data.code === 200 && data.result) {
      // Catalog API uses 'variants' not 'sync_variants'
      const variants = data.result.variants || data.result.sync_variants || [];
      const variant = variants.find(v => v.id === parseInt(req.params.variantId));
      if (variant) {
        res.json({
          product: data.result.product || data.result.sync_product,
          variant: variant
        });
      } else {
        res.status(404).json({ message: 'Variant not found' });
      }
    } else {
      console.error('Unexpected Printful API response:', data);
      res.status(404).json({ message: 'Product not found', error: data.error || data.result });
    }
  } catch (error) {
    console.error('Error fetching variant from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all artwork from local drawings folder
router.get('/artwork', async (req, res) => {
  try {
    const drawingsPath = path.join(__dirname, '../../drawings/backgroundTransparent');
    const files = await fs.readdir(drawingsPath);
    
    // Filter for image files and create artwork objects
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    const artworks = files
      .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => ({
        id: file,
        imageUrl: `http://localhost:5000/drawings/backgroundTransparent/${file}`,
        tags: ['drawing', 'moody']
      }));
    
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
