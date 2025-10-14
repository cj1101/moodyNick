const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getOutlineDefinition } = require('../config/productOutlines');

const GENERATED_OUTLINES_DIR = path.join(__dirname, '../generated-outlines');
const STATIC_OUTLINES_DIR = path.join(__dirname, '../../frontend/public/product-outlines');

// In-memory storage for temporary design images
const tempImages = new Map();
// In-memory cache for blank mockups to reduce Printful API calls
const blankMockupCache = new Map();
const BLANK_MOCKUP_TTL_MS = 60 * 60 * 1000; // 1 hour

const ALLOWED_PRODUCT_IDS = [
  '71',  // Unisex Staple T-Shirt
  '19',  // Unisex Heavy Cotton Tee
  '380', // Unisex Garment-Dyed T-shirt
  '387', // Unisex Heavy Blend™ Crewneck Sweatshirt
  '146', // Unisex Heavy Blend™ Hooded Sweatshirt
  '163', // Tote Bag
  '327', // Large Organic Tote Bag
  '20',  // White Glossy Mug
  '1',   // Poster
  '2',   // Framed Poster
];

const ALLOWED_PRODUCT_SET = new Set(ALLOWED_PRODUCT_IDS);

function isProductAllowed(productTypeId) {
  const normalized = String(productTypeId);
  const allowed = ALLOWED_PRODUCT_SET.has(normalized);
  if (!allowed) {
    console.warn(`Product ${normalized} is not in the allowed catalog whitelist.`);
  }
  return allowed;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function getProductOutlineFallbackUrl(productId, req) {
  const definition = getOutlineDefinition(String(productId));

  if (!definition) {
    return null;
  }

  const generatedPath = path.join(GENERATED_OUTLINES_DIR, definition.filename);
  if (await fileExists(generatedPath)) {
    return `${req.protocol}://${req.get('host')}/generated-outlines/${definition.filename}`;
  }

  const staticPath = path.join(STATIC_OUTLINES_DIR, definition.filename);
  if (await fileExists(staticPath)) {
    return `${req.protocol}://${req.get('host')}/product-outlines/${definition.filename}`;
  }

  return null;
}

async function getVariantMockupFallbackUrl(variantId) {
  try {
    const headers = {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
    };

    if (process.env.PRINTFUL_STORE_ID) {
      headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
    }

    const response = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
      headers
    });

    const data = await response.json();

    if (!response.ok || data.code !== 200) {
      console.error(`[VARIANT FALLBACK] Failed to fetch variant ${variantId}:`, data);
      return null;
    }

    const files = data?.result?.variant?.files || data?.result?.files || [];
    const productFiles = data?.result?.product?.files || [];
    const combinedFiles = [...files, ...productFiles].filter(Boolean);

    const preferredTypes = ['flat', 'default', 'preview', 'front', 'mockup'];
    const previewFile = combinedFiles.find(file => preferredTypes.includes((file?.type || '').toLowerCase())) || combinedFiles[0];

    if (previewFile) {
      return previewFile.preview_url || previewFile.thumbnail_url || previewFile.url || null;
    }

    return null;
  } catch (error) {
    console.error(`[VARIANT FALLBACK] Error fetching variant ${variantId}:`, error);
    return null;
  }
}

// Helper function to get available placements for a product type
function getProductPlacements(productTypeId) {
  // Map product types to their available placements
  const placementMap = {
    // T-shirts and apparel
    '71': ['front', 'back', 'left', 'right'], // Unisex Staple T-Shirt
    '19': ['front', 'back', 'left', 'right'], // Unisex Heavy Cotton Tee
    '380': ['front', 'back', 'left', 'right'], // Unisex Garment-Dyed T-shirt
    '387': ['front', 'back', 'left', 'right'], // Unisex Heavy Blend™ Crewneck Sweatshirt
    '146': ['front', 'back'], // Unisex Heavy Blend™ Hooded Sweatshirt

    // Tote bags
    '163': ['front', 'back'], // Tote Bag
    '327': ['front', 'back'], // Large Organic Tote Bag

    // Mugs
    '20': ['default'], // White Glossy Mug

    // Posters and prints
    '1': ['default'], // Poster
    '2': ['default'], // Framed Poster

    // Default for unknown products
    'default': ['front', 'back']
  };

  const key = placementMap[productTypeId] ? productTypeId : 'default';
  const placements = placementMap[key];
  console.log(`Getting placements for product ${productTypeId}:`, placements);
  return placements;
}

// Helper function to check if a product supports mockup generation
// Whitelist of products known to have reliable mockup support
function productSupportsMockups(productTypeId) {
  return ALLOWED_PRODUCT_SET.has(String(productTypeId));
}

// GET print files (print areas) for a product from Printful Mockup Generator API
router.get('/products/:productId/printfiles', async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, variantIds } = req.query;

    if (!isProductAllowed(productId)) {
      return res.status(404).json({ message: 'Product not available in catalog' });
    }

    const searchParams = new URLSearchParams();
    if (variantIds) {
      searchParams.set('variant_ids', String(variantIds));
    } else if (variantId) {
      searchParams.set('variant_ids', String(variantId));
    }

    const url = `https://api.printful.com/mockup-generator/printfiles/${productId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    console.log(`[PRINTFILES] Fetching print files for product ${productId} from ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || ''
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[PRINTFILES] Unexpected Printful API response:', data);
      return res.status(response.status).json({
        message: 'Failed to fetch print files from Printful',
        error: data
      });
    }

    res.json(data.result || data);
  } catch (error) {
    console.error('[PRINTFILES] Error fetching print files:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
      // Filter products to allowed catalog only and maintain configured order
      const filtered = ALLOWED_PRODUCT_IDS
        .map(id => data.result.find(product => String(product.id) === id))
        .filter(Boolean);
      res.json(filtered);
    } else {
      console.error('Unexpected Printful API response:', data);
      res.status(500).json({ message: 'Failed to fetch products from Printful' });
    }
  } catch (error) {
    console.error('Error fetching products from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET available placements for a product (MUST come before /products/:id)
router.get('/products/:productId/placements', async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!isProductAllowed(productId)) {
      return res.status(404).json({ message: 'Product not available in catalog' });
    }
    const placements = getProductPlacements(productId);
    const mockupSupported = productSupportsMockups(productId);
    
    res.json({ 
      productId,
      placements,
      placementLabels: {
        'front': 'Front',
        'back': 'Back',
        'left': 'Left Sleeve',
        'right': 'Right Sleeve',
        'default': 'Design'
      },
      mockupSupported
    });
  } catch (error) {
    console.error('Error fetching placements:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET check if variant supports mockup generation
router.get('/products/:variantId/mockup-available', async (req, res) => {
  try {
    const variantId = req.params.variantId;
    
    // Check if variant exists and supports mockups
    const variantCheckResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    
    const variantCheckData = await variantCheckResponse.json();
    
    if (variantCheckData.code === 200) {
      // Variant exists, mockup generation is likely available
      res.json({ 
        available: true,
        variantId,
        variantName: variantCheckData.result?.variant?.name
      });
    } else {
      // Variant doesn't exist or not accessible
      res.json({ 
        available: false,
        variantId,
        reason: 'Variant not found in catalog'
      });
    }
  } catch (error) {
    console.error('Error checking mockup availability:', error);
    res.json({ available: false, reason: 'Error checking availability' });
  }
});

// GET a specific product by ID from Printful Catalog API
router.get('/products/:id', async (req, res) => {
  try {
    if (!isProductAllowed(req.params.id)) {
      return res.status(404).json({ message: 'Product not available in catalog' });
    }

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

// GET a specific variant by ID directly from Printful Catalog API
router.get('/variants/:variantId', async (req, res) => {
  try {
    console.log(`Fetching variant ${req.params.variantId} from Catalog API`);
    const response = await fetch(`https://api.printful.com/products/variant/${req.params.variantId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    if (data.code === 200 && data.result) {
      res.json(data.result);
    } else {
      console.error('Unexpected Printful API response:', data);
      res.status(404).json({ message: 'Variant not found', error: data.error || data.result });
    }
  } catch (error) {
    console.error('Error fetching variant from Printful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a specific variant by product ID and variant ID from Printful Catalog API
router.get('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    if (!isProductAllowed(req.params.productId)) {
      return res.status(404).json({ message: 'Product not available in catalog' });
    }

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

// POST Generate mockup with design
// This creates a real-time mockup preview with the user's design
// Note: designDataUrl should be a base64 data URL of the canvas
router.post('/products/:productId/mockup', async (req, res) => {
  console.log('\n========== MOCKUP GENERATION REQUEST ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request params:', req.params);
  console.log('Request body keys:', Object.keys(req.body));
  
  try {
    const productId = req.params.productId;
    const { designDataUrl, placement = 'front', placements, variantId } = req.body;
    
    console.log(`[MOCKUP] Product ID: ${productId}`);
    console.log(`[MOCKUP] Variant ID: ${variantId}`);
    console.log(`[MOCKUP] Placement: ${placement}`);
    console.log(`[MOCKUP] Has designDataUrl: ${!!designDataUrl}`);
    console.log(`[MOCKUP] Has placements: ${!!placements}`);
    if (designDataUrl) {
      console.log(`[MOCKUP] Design data URL length: ${designDataUrl.length} chars`);
      console.log(`[MOCKUP] Design data URL preview: ${designDataUrl.substring(0, 50)}...`);
    }
    
    // Validate required parameters
    if (!variantId) {
      console.error('[MOCKUP ERROR] Missing variantId in request body');
      return res.status(400).json({ 
        message: 'variantId is required in request body' 
      });
    }
    
    // If no design provided, return error
    if (!designDataUrl && !placements) {
      console.error('[MOCKUP ERROR] No design data provided');
      return res.status(400).json({ 
        message: 'No design provided. Please provide designDataUrl or placements object.' 
      });
    }
    
    // First, verify the variant exists in Printful catalog
    console.log(`[MOCKUP] Step 1: Verifying variant ${variantId} in Printful catalog...`);
    const variantCheckResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    
    const variantCheckData = await variantCheckResponse.json();
    console.log(`[MOCKUP] Variant check response code: ${variantCheckData.code}`);
    
    if (variantCheckData.code !== 200) {
      console.error('[MOCKUP ERROR] Variant not found:', variantCheckData);
      return res.status(404).json({ 
        message: 'Variant not found in Printful catalog',
        error: variantCheckData 
      });
    }
    
    // Extract the actual product ID from the variant data
    const actualProductId = variantCheckData.result.variant.product_id;
    console.log(`[MOCKUP] ✓ Variant verified: ${variantCheckData.result.variant.name}`);
    console.log(`[MOCKUP] Actual product ID from variant: ${actualProductId}`);
    
    // Verify the product ID matches (warn if mismatch but use actual product ID)
    if (actualProductId != productId) {
      console.warn(`[MOCKUP WARNING] Product ID mismatch: URL has ${productId}, but variant belongs to ${actualProductId}. Using actual product ID.`);
    }
    
    // Build files array for mockup generation
    console.log(`[MOCKUP] Step 2: Building files array for mockup generation...`);
    let files = [];
    
    if (placements) {
      // Multiple placements provided
      for (const [placementKey, dataUrl] of Object.entries(placements)) {
        if (dataUrl && dataUrl.startsWith('data:image')) {
          // Try using publicly accessible URL if BACKEND_URL is set, otherwise use data URL directly
          let imageUrl = dataUrl;
          
          if (process.env.BACKEND_URL) {
            // Generate unique ID for this image
            const imageId = crypto.randomBytes(16).toString('hex');
            
            // Store the data URL temporarily (expires in 5 minutes)
            tempImages.set(imageId, {
              dataUrl,
              timestamp: Date.now()
            });
            
            // Create public URL for this image
            imageUrl = `${process.env.BACKEND_URL}/api/catalog/temp-image/${imageId}`;
            console.log(`[MOCKUP] Created public URL for placement ${placementKey}: ${imageUrl}`);
          } else {
            console.log(`[MOCKUP] Using data URL directly for placement ${placementKey} (length: ${dataUrl.length})`);
          }
          
          files.push({
            placement: placementKey,
            image_url: imageUrl,
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 2400,
              top: 0,
              left: 0
            }
          });
        }
      }
    } else if (designDataUrl) {
      // Single placement
      // Try using publicly accessible URL if BACKEND_URL is set, otherwise use data URL directly
      let imageUrl = designDataUrl;
      
      if (process.env.BACKEND_URL) {
        // Generate unique ID for this image
        const imageId = crypto.randomBytes(16).toString('hex');
        
        // Store the data URL temporarily (expires in 5 minutes)
        tempImages.set(imageId, {
          dataUrl: designDataUrl,
          timestamp: Date.now()
        });
        
        // Create public URL for this image
        imageUrl = `${process.env.BACKEND_URL}/api/catalog/temp-image/${imageId}`;
        console.log(`[MOCKUP] Created public URL for placement ${placement}: ${imageUrl}`);
      } else {
        console.log(`[MOCKUP] Using data URL directly for placement ${placement} (length: ${designDataUrl.length})`);
      }
      
      files.push({
        placement: placement,
        image_url: imageUrl,
        position: {
          area_width: 1800,
          area_height: 2400,
          width: 1800,
          height: 2400,
          top: 0,
          left: 0
        }
      });
    }
    
    if (files.length === 0) {
      console.error('[MOCKUP ERROR] No valid files to generate mockup');
      return res.status(400).json({ 
        message: 'No valid design data provided' 
      });
    }
    
    console.log(`[MOCKUP] ✓ Built ${files.length} file(s) for mockup generation`);
    files.forEach((file, idx) => {
      console.log(`[MOCKUP]   File ${idx + 1}: placement=${file.placement}, url_type=${file.image_url.startsWith('data:') ? 'data URL' : 'HTTP URL'}`);
    });
    
    // Create mockup generation task
    const mockupData = {
      variant_ids: [parseInt(variantId)],
      format: 'jpg',
      files: files
    };

    console.log(`[MOCKUP] Step 3: Creating mockup task...`);
    console.log(`[MOCKUP] Variant IDs: [${variantId}]`);
    console.log(`[MOCKUP] Format: jpg`);
    console.log(`[MOCKUP] Number of files: ${files.length}`);
    console.log(`[MOCKUP] Printful API endpoint: https://api.printful.com/mockup-generator/create-task/${actualProductId}`);

    const createTaskResponse = await fetch(`https://api.printful.com/mockup-generator/create-task/${actualProductId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID
      },
      body: JSON.stringify(mockupData)
    });

    const createTaskData = await createTaskResponse.json();
    
    console.log(`[MOCKUP] Printful response status: ${createTaskResponse.status}`);
    console.log(`[MOCKUP] Printful response code: ${createTaskData.code}`);
    console.log('[MOCKUP] Full Printful response:', JSON.stringify(createTaskData, null, 2));
    
    if (!createTaskResponse.ok || createTaskData.code !== 200) {
      console.error('[MOCKUP ERROR] ✗ Failed to create mockup task');
      console.error('[MOCKUP ERROR] Status:', createTaskResponse.status);
      console.error('[MOCKUP ERROR] Response:', createTaskData);
      return res.status(createTaskResponse.status).json({ 
        message: 'Failed to create mockup task',
        error: createTaskData,
        debug: {
          productId: actualProductId,
          variantId: variantId,
          filesCount: files.length
        }
      });
    }

    const taskKey = createTaskData.result.task_key;
    console.log(`[MOCKUP] ✓ Task created successfully with key: ${taskKey}`);

    // Poll for mockup generation result
    console.log(`[MOCKUP] Step 4: Polling for mockup generation result...`);
    let mockupResult = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
          'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID
        }
      });

      const resultData = await resultResponse.json();
      
      console.log(`[MOCKUP] Poll attempt ${attempts + 1}/${maxAttempts}: status=${resultData.result?.status}`);
      
      if (resultData.code === 200 && resultData.result.status === 'completed') {
        mockupResult = resultData.result;
        console.log(`[MOCKUP] ✓ Mockup generation completed!`);
        console.log(`[MOCKUP] Generated ${mockupResult.mockups?.length || 0} mockup(s)`);
        break;
      } else if (resultData.result.status === 'failed') {
        console.error('[MOCKUP ERROR] ✗ Mockup generation failed');
        console.error('[MOCKUP ERROR] Failure details:', resultData.result);
        return res.status(500).json({ 
          message: 'Mockup generation failed',
          error: resultData.result 
        });
      }
      
      attempts++;
    }

    if (!mockupResult) {
      console.error('[MOCKUP ERROR] ✗ Mockup generation timed out after', maxAttempts, 'attempts');
      return res.status(408).json({ message: 'Mockup generation timed out' });
    }

    console.log('[MOCKUP] ✓✓✓ SUCCESS! Mockup generation completed');
    console.log('[MOCKUP] Returning', mockupResult.mockups?.length || 0, 'mockup(s) to client');
    console.log('========== END MOCKUP GENERATION ==========\n');
    
    res.json({ 
      success: true,
      mockups: mockupResult.mockups 
    });
  } catch (error) {
    console.error('[MOCKUP ERROR] ✗✗✗ EXCEPTION in mockup generation:', error);
    console.error('[MOCKUP ERROR] Stack trace:', error.stack);
    console.log('========== END MOCKUP GENERATION (ERROR) ==========\n');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cleanup function to remove expired temporary images
setInterval(() => {
  const now = Date.now();
  const expirationTime = 5 * 60 * 1000; // 5 minutes
  
  for (const [imageId, data] of tempImages.entries()) {
    if (now - data.timestamp > expirationTime) {
      tempImages.delete(imageId);
      console.log(`Cleaned up expired temp image: ${imageId}`);
    }
  }

  for (const [cacheKey, entry] of blankMockupCache.entries()) {
    if (now - entry.timestamp > BLANK_MOCKUP_TTL_MS) {
      blankMockupCache.delete(cacheKey);
      console.log(`Cleaned up expired blank mockup cache entry: ${cacheKey}`);
    }
  }
}, 60 * 1000); // Run cleanup every minute

// GET temporary image endpoint
router.get('/temp-image/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    const imageData = tempImages.get(imageId);
    
    if (!imageData) {
      return res.status(404).json({ message: 'Image not found or expired' });
    }
    
    // Parse the data URL
    const matches = imageData.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid image data' });
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Set appropriate headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    res.send(buffer);
  } catch (error) {
    console.error('Error serving temp image:', error);
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

// @route   POST api/catalog/products/:productId/blank-mockup
// @desc    Generate a blank product mockup (no design)
// @access  Public
router.post('/products/:productId/blank-mockup', async (req, res) => {
  console.log('\n========== BLANK MOCKUP REQUEST ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request productId:', req.params.productId);
  console.log('Request body:', req.body);
  
  try {
    const { productId } = req.params;
    const { variantId, placement = 'front' } = req.body;

    const numericVariantId = parseInt(variantId, 10);

    if (Number.isNaN(numericVariantId)) {
      console.error('[BLANK MOCKUP ERROR] Invalid variant id:', variantId);
      return res.status(400).json({ message: 'Invalid variant id' });
    }

    // Always fetch the actual product ID from the variant to avoid mismatches
    console.log(`[BLANK MOCKUP] Step 1: Fetching variant ${numericVariantId} to get actual product ID...`);
    let actualProductId = null;
    let variantData = null;
    
    try {
      const variantLookup = await fetch(`https://api.printful.com/products/variant/${numericVariantId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
      });

      if (variantLookup.ok) {
        variantData = await variantLookup.json();
        const derivedProductId = variantData?.result?.variant?.product_id;
        if (derivedProductId) {
          actualProductId = parseInt(derivedProductId, 10);
          console.log(`[BLANK MOCKUP] ✓ Found actual product ID ${actualProductId} from variant ${numericVariantId}`);
        } else {
          console.error('[BLANK MOCKUP ERROR] Variant lookup did not return a product_id');
          throw new Error('Could not determine product ID from variant');
        }
      } else {
        const variantError = await variantLookup.text();
        console.error(`[BLANK MOCKUP ERROR] Failed to fetch variant ${numericVariantId}:`, variantLookup.status, variantError);
        throw new Error(`Variant not found: ${variantLookup.status}`);
      }
    } catch (variantLookupError) {
      console.error('[BLANK MOCKUP ERROR] Exception while fetching variant:', variantLookupError);
      // Return fallback immediately
      const fallbackUrl = await getVariantMockupFallbackUrl(numericVariantId);
      if (fallbackUrl) {
        console.log('[BLANK MOCKUP] Using variant fallback due to variant lookup error');
        return res.json({ mockup_url: fallbackUrl, source: 'variant-fallback' });
      }
      return res.status(500).json({ message: 'Failed to fetch variant information' });
    }

    if (!isProductAllowed(actualProductId)) {
      console.warn(`[BLANK MOCKUP WARNING] Product ${actualProductId} is not in the allowed catalog. Attempting anyway.`);
      // Don't return error - try to generate mockup anyway
    }

    const cacheKey = `${numericVariantId}:${placement}`;
    const cachedMockup = blankMockupCache.get(cacheKey);
    if (cachedMockup && Date.now() - cachedMockup.timestamp < BLANK_MOCKUP_TTL_MS) {
      console.log(`[BLANK MOCKUP] ✓ Serving cached blank mockup for variant ${numericVariantId}, placement ${placement}`);
      console.log('========== END BLANK MOCKUP (CACHED) ==========\n');
      return res.json({ mockup_url: cachedMockup.url, source: 'cache' });
    }

    console.log(`[BLANK MOCKUP] Step 2: Generating blank mockup for product ${actualProductId}, variant ${numericVariantId}, placement ${placement}`);

    // Create a 1x1 transparent PNG as a blank design
    const blankDesign = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const mockupRequest = {
      variant_ids: [numericVariantId],
      format: 'png',
      files: [
        {
          placement: placement,
          image_url: blankDesign,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1,
            height: 1,
            top: 0,
            left: 0
          }
        }
      ]
    };

    console.log('[BLANK MOCKUP] Mockup request payload:', JSON.stringify(mockupRequest, null, 2));

    const headers = {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json'
    };

    if (process.env.PRINTFUL_STORE_ID) {
      headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
    }

    const createTaskUrl = `https://api.printful.com/mockup-generator/create-task/${actualProductId}`;
    console.log(`[BLANK MOCKUP] Step 3: Creating task at ${createTaskUrl}`);
    
    const printfulResponse = await fetch(createTaskUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(mockupRequest)
    });
    
    const responseStatus = printfulResponse.status;
    console.log(`[BLANK MOCKUP] Printful response status: ${responseStatus}`);
    
    if (!printfulResponse.ok) {
      let errorText = '';
      let errorData = null;
      
      try {
        errorText = await printfulResponse.text();
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, keep as text
        }
      } catch (e) {
        errorText = 'Could not read error response';
      }
      
      console.error(`[BLANK MOCKUP ERROR] Printful API error (${responseStatus}):`, errorText);
      console.error('[BLANK MOCKUP ERROR] Error data:', errorData);
      
      // Try fallbacks
      const outlineUrl = await getProductOutlineFallbackUrl(String(actualProductId), req);
      if (outlineUrl) {
        console.warn(`[BLANK MOCKUP] Using outline fallback due to Printful error ${responseStatus}`);
        console.log('========== END BLANK MOCKUP (OUTLINE FALLBACK) ==========\n');
        return res.json({ mockup_url: outlineUrl, source: 'outline' });
      }

      const variantFallbackUrl = await getVariantMockupFallbackUrl(numericVariantId);
      if (variantFallbackUrl) {
        console.warn(`[BLANK MOCKUP] Using variant asset fallback due to Printful error ${responseStatus}`);
        console.log('========== END BLANK MOCKUP (VARIANT FALLBACK) ==========\n');
        return res.json({ mockup_url: variantFallbackUrl, source: 'variant-file' });
      }

      console.error('[BLANK MOCKUP ERROR] No fallback available');
      console.log('========== END BLANK MOCKUP (ERROR) ==========\n');
      return res.status(responseStatus).json({ 
        message: 'Failed to generate mockup and no fallback available',
        error: errorData || errorText,
        productId: actualProductId,
        variantId: numericVariantId
      });
    }
    
    const taskData = await printfulResponse.json();
    console.log('[BLANK MOCKUP] ✓ Task created successfully');
    console.log('[BLANK MOCKUP] Task data:', JSON.stringify(taskData, null, 2));
    
    // Poll for the result
    const taskId = taskData.result.task_key;
    console.log(`[BLANK MOCKUP] Step 4: Polling for task ${taskId}...`);
    
    let mockupUrl = null;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!mockupUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultHeaders = {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      };

      if (process.env.PRINTFUL_STORE_ID) {
        resultHeaders['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
      }

      const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskId}`, {
        headers: resultHeaders
      });
      
      attempts++;
      
      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        const status = resultData.result?.status;
        console.log(`[BLANK MOCKUP] Poll attempt ${attempts}/${maxAttempts}: status=${status}`);
        
        if (status === 'completed') {
          mockupUrl = resultData.result.mockups?.[0]?.mockup_url;
          if (mockupUrl) {
            console.log('[BLANK MOCKUP] ✓ Mockup generated successfully:', mockupUrl);
            break;
          }
        } else if (status === 'failed') {
          console.error('[BLANK MOCKUP ERROR] Task failed:', resultData.result);
          break;
        }
      } else {
        console.error(`[BLANK MOCKUP ERROR] Poll request failed: ${resultResponse.status}`);
      }
    }
    
    if (mockupUrl) {
      blankMockupCache.set(cacheKey, { url: mockupUrl, timestamp: Date.now() });
      console.log('[BLANK MOCKUP] ✓✓✓ SUCCESS! Mockup URL cached and returned');
      console.log('========== END BLANK MOCKUP (SUCCESS) ==========\n');
      res.json({ mockup_url: mockupUrl, source: 'printful' });
    } else {
      console.warn('[BLANK MOCKUP] Mockup generation timed out or failed. Trying fallbacks...');
      
      const outlineUrl = await getProductOutlineFallbackUrl(String(actualProductId), req).catch(() => null);
      if (outlineUrl) {
        console.log('[BLANK MOCKUP] Using outline fallback due to timeout');
        console.log('========== END BLANK MOCKUP (OUTLINE FALLBACK) ==========\n');
        return res.json({ mockup_url: outlineUrl, source: 'outline' });
      }

      const variantFallbackUrl = await getVariantMockupFallbackUrl(numericVariantId);
      if (variantFallbackUrl) {
        console.log('[BLANK MOCKUP] Using variant asset fallback due to timeout');
        console.log('========== END BLANK MOCKUP (VARIANT FALLBACK) ==========\n');
        return res.json({ mockup_url: variantFallbackUrl, source: 'variant-file' });
      }

      console.error('[BLANK MOCKUP ERROR] Mockup generation timed out and no fallback available');
      console.log('========== END BLANK MOCKUP (TIMEOUT) ==========\n');
      res.status(408).json({ message: 'Mockup generation timed out' });
    }

  } catch (error) {
    console.error('[BLANK MOCKUP ERROR] ✗✗✗ EXCEPTION:', error);
    console.error('[BLANK MOCKUP ERROR] Stack trace:', error.stack);
    
    try {
      const outlineUrl = await getProductOutlineFallbackUrl(req.params.productId, req).catch(() => null);
      if (outlineUrl) {
        console.log('[BLANK MOCKUP] Using outline fallback due to exception');
        console.log('========== END BLANK MOCKUP (EXCEPTION FALLBACK) ==========\n');
        return res.json({ mockup_url: outlineUrl, source: 'outline' });
      }
    } catch (fallbackError) {
      console.error('[BLANK MOCKUP ERROR] Fallback also failed:', fallbackError);
    }

    console.log('========== END BLANK MOCKUP (EXCEPTION) ==========\n');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST api/catalog/artwork/upload
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
