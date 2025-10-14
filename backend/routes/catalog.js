const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const auth = require('../middleware/auth');

// Utility to create URL-safe slugs from product names
function toSlug(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET all products from Printful API (normalized)
router.get('/products', async (req, res) => {
  try {
    const response = await fetch('https://api.printful.com/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();

    if (!response.ok) {
      console.error('Printful products list error:', data);
      return res.status(response.status).json({
        message: 'Failed to fetch products',
        error: data
      });
    }

    const products = Array.isArray(data.result) ? data.result : [];

    const normalized = products.map(p => {
      const name = p.name || `${p.brand || ''} ${p.model || ''}`.trim();
      const id = p.id;
      return {
        ...p,
        // Common aliases to avoid frontend mismatches
        id,
        product_id: id,
        name,
        slug: toSlug(name)
      };
    });

    return res.json({ result: normalized, paging: data.paging || null });
  } catch (error) {
    console.error('Error fetching products from Printful:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Lookup product by slug (derived from product name)
router.get('/product-by-slug/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ message: 'Missing slug' });
  try {
    const response = await fetch('https://api.printful.com/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Printful products list error (slug lookup):', data);
      return res.status(response.status).json({ message: 'Failed to fetch products', error: data });
    }
    const products = Array.isArray(data.result) ? data.result : [];
    const match = products
      .map(p => ({ ...p, product_id: p.id, slug: toSlug(p.name || `${p.brand || ''} ${p.model || ''}`.trim()) }))
      .find(p => p.slug === slug);

    if (!match) return res.status(404).json({ message: 'Product not found' });
    return res.json(match);
  } catch (error) {
    console.error('Error during product-by-slug lookup:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET single product details from Printful API
router.get('/products/:productId', async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ message: 'Missing productId' });
  }

  try {
    // Allow either numeric ID or slug
    let resolvedId = productId;
    const isNumericId = /^\d+$/.test(productId);
    if (!isNumericId) {
      const listResponse = await fetch('https://api.printful.com/products', {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
      });
      const listData = await listResponse.json();
      if (!listResponse.ok) {
        console.error('Printful products list error (details resolve):', listData);
        return res.status(listResponse.status).json({
          message: 'Failed to fetch products',
          error: listData
        });
      }
      const products = Array.isArray(listData.result) ? listData.result : [];
      const match = products
        .map(p => ({ id: p.id, slug: toSlug(p.name || `${p.brand || ''} ${p.model || ''}`.trim()) }))
        .find(p => p.slug === productId);
      if (!match) {
        return res.status(404).json({ message: 'Product not found' });
      }
      resolvedId = String(match.id);
    }

    const response = await fetch(`https://api.printful.com/products/${encodeURIComponent(resolvedId)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Printful product details error:', data);
      return res.status(response.status).json({
        message: 'Failed to fetch product details',
        error: data
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error fetching product details from Printful:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Resolve product by numeric id or slug and return details
router.get('/product/:identifier', async (req, res) => {
  const { identifier } = req.params;
  if (!identifier) return res.status(400).json({ message: 'Missing identifier' });

  const isNumericId = /^\d+$/.test(identifier);

  try {
    let productId = identifier;
    if (!isNumericId) {
      // Resolve slug to product id
      const listResponse = await fetch('https://api.printful.com/products', {
        headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
      });
      const listData = await listResponse.json();
      if (!listResponse.ok) {
        console.error('Printful products list error (resolve):', listData);
        return res.status(listResponse.status).json({ message: 'Failed to fetch products', error: listData });
      }
      const products = Array.isArray(listData.result) ? listData.result : [];
      const match = products
        .map(p => ({ id: p.id, slug: toSlug(p.name || `${p.brand || ''} ${p.model || ''}`.trim()) }))
        .find(p => p.slug === identifier);
      if (!match) return res.status(404).json({ message: 'Product not found' });
      productId = String(match.id);
    }

    const detailsResponse = await fetch(`https://api.printful.com/products/${encodeURIComponent(productId)}`, {
      headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
    });
    const detailsData = await detailsResponse.json();
    if (!detailsResponse.ok) {
      console.error('Printful product details error (resolve):', detailsData);
      return res.status(detailsResponse.status).json({ message: 'Failed to fetch product details', error: detailsData });
    }
    return res.json(detailsData);
  } catch (error) {
    console.error('Error resolving product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET normalized size/color options for a product
router.get('/products/:productId/options', async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ message: 'Missing productId' });
  }

  try {
    // Allow either numeric ID or slug
    let resolvedId = productId;
    const isNumericId = /^\d+$/.test(productId);
    if (!isNumericId) {
      const listResponse = await fetch('https://api.printful.com/products', {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
      });
      const listData = await listResponse.json();
      if (!listResponse.ok) {
        console.error('Printful products list error (options resolve):', listData);
        return res.status(listResponse.status).json({
          message: 'Failed to fetch products',
          error: listData
        });
      }
      const products = Array.isArray(listData.result) ? listData.result : [];
      const match = products
        .map(p => ({ id: p.id, slug: toSlug(p.name || `${p.brand || ''} ${p.model || ''}`.trim()) }))
        .find(p => p.slug === productId);
      if (!match) {
        return res.status(404).json({ message: 'Product not found' });
      }
      resolvedId = String(match.id);
    }

    const response = await fetch(`https://api.printful.com/products/${encodeURIComponent(resolvedId)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Printful product details error:', data);
      return res.status(response.status).json({
        message: 'Failed to fetch product details',
        error: data
      });
    }

    const product = data.result || {};
    const variants = Array.isArray(product.variants) ? product.variants : [];

    const sizes = new Set();
    const colors = new Set();

    variants.forEach(v => {
      if (v.size) sizes.add(String(v.size));
      if (v.color) colors.add(String(v.color));
      // Fallback: attempt to parse from variant.name like "Dark Heather / S"
      if ((!v.size || !v.color) && typeof v.name === 'string') {
        const parts = v.name.split('/').map(p => p.trim());
        if (parts.length === 2) {
          if (!v.color) colors.add(parts[0]);
          if (!v.size) sizes.add(parts[1]);
        }
      }
    });

    return res.json({
      productId: resolvedId,
      sizes: Array.from(sizes),
      colors: Array.from(colors),
      variants
    });
  } catch (error) {
    console.error('Error normalizing product options from Printful:', error);
    return res.status(500).json({ message: 'Server error' });
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
