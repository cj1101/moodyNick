const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const auth = require('../middleware/auth');

// @route   GET api/catalog/test-api
// @desc    Test Printful API connection
// @access  Public
router.get('/test-api', async (req, res) => {
  try {
    console.log('[API Test] Testing Printful API connection...');
    
    // Check if API key is configured
    if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
      console.error('[API Test] PRINTFUL_API_KEY is not configured');
      return res.status(500).json({ 
        success: false,
        message: 'PRINTFUL_API_KEY is not configured in environment variables',
        configured: false
      });
    }
    
    // Make a simple API call to verify credentials
    const response = await fetch('https://api.printful.com/stores', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API Test] Printful API returned an error:', data);
      return res.status(response.status).json({ 
        success: false,
        message: 'Printful API authentication failed',
        error: data,
        statusCode: response.status,
        configured: true
      });
    }
    
    console.log('[API Test] ✓ Printful API connection successful');
    res.json({ 
      success: true,
      message: 'Printful API connection successful',
      configured: true,
      storeInfo: data.result
    });
  } catch (error) {
    console.error('[API Test] Error testing Printful API:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while testing API',
      error: error.message
    });
  }
});

// GET all products from Printful API (filtered for 3D mockup support)
router.get('/products', async (req, res) => {
  try {
    // Check if Printful API key is configured
    if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
      console.log('[Products] Printful API key not configured, returning mock data');
      
      // Return mock products for development
      const mockProducts = [
        {
          id: 1,
          type: 'T-SHIRT',
          type_name: 'T-Shirt',
          title: 'Unisex Heavy Cotton Tee',
          brand: 'Gildan',
          model: '5000',
          image: 'https://files.cdn.printful.com/o/products/71/product_1584696677.jpg',
          variant_count: 15,
          currency: 'USD',
          description: 'Classic unisex t-shirt made from 100% cotton. Perfect for custom designs.',
          has_3d_mockups: true
        }
      ];
      
      return res.json(mockProducts);
    }
    
    console.log('[Products] Fetching all products from Printful...');
    const response = await fetch('https://api.printful.com/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Products] Printful API error:', data);
      return res.status(response.status).json({ message: 'Failed to fetch products', error: data });
    }
    
    // Extract the products array from the Printful response
    // Printful API returns: { code: 200, result: [...] }
    const allProducts = data.result || [];
    console.log(`[Products] Found ${allProducts.length} total products`);
    
    // Priority product types that commonly have 3D mockups
    const priorityTypes = ['T-SHIRT', 'TANK_TOP', 'HOODIE', 'SWEATSHIRT', 'LONG_SLEEVE', 'MUG', 'POSTER', 'CANVAS'];
    
    // Sort products to check priority types first
    const sortedProducts = [
      ...allProducts.filter(p => priorityTypes.includes(p.type)),
      ...allProducts.filter(p => !priorityTypes.includes(p.type))
    ];
    
    console.log(`[Products] Checking products for mockup generation capability...`);
    
    // Filter products that can generate mockups (have flat files for mockup)
    const productsWithMockups = [];
    
    for (const product of sortedProducts) {
      // Stop if we already have 20 products
      if (productsWithMockups.length >= 20) {
        console.log(`[Products] Reached 20 products with mockup support, stopping search`);
        break;
      }
      
      try {
        // Fetch detailed product info
        const detailResponse = await fetch(`https://api.printful.com/products/${product.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
          }
        });
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const variants = detailData.result?.variants || [];
          
          // Check if product variants can generate mockups
          let canGenerateMockups = false;
          if (variants.length > 0) {
            // Check the first variant for flat or default files (needed for mockups)
            const firstVariantId = variants[0].id;
            const variantResponse = await fetch(`https://api.printful.com/products/variant/${firstVariantId}`, {
              headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
              }
            });
            
            if (variantResponse.ok) {
              const variantData = await variantResponse.json();
              const files = variantData.result?.product?.files || [];
              const variantImage = variantData.result?.variant?.image;
              const productImage = variantData.result?.product?.image;
              
              // Check if product can generate mockups:
              // 1. Must have printfiles (areas where designs can be placed)
              // 2. Must have a variant or product image (for mockup generation)
              const hasPrintfiles = files.some(f => 
                f.type === 'default' || 
                f.type === 'front' || 
                f.type === 'back' ||
                f.type === 'mockup' ||
                f.type === 'flat'
              );
              
              const hasImage = !!(variantImage || productImage);
              
              canGenerateMockups = hasPrintfiles && hasImage;
              
              if (canGenerateMockups) {
                console.log(`[Products] ✓ [${productsWithMockups.length + 1}/20] Product ${product.id} (${product.type_name}: ${product.title}) - Has ${files.length} printfiles and variant image`);
              } else if (!hasPrintfiles) {
                console.log(`[Products] ✗ Product ${product.id} - No printfiles found`);
              } else if (!hasImage) {
                console.log(`[Products] ✗ Product ${product.id} - No variant/product image available`);
              }
            }
          }
          
          if (canGenerateMockups) {
            productsWithMockups.push(product);
          }
        }
        
        // Small delay to avoid rate limiting
        if (productsWithMockups.length < 20 && sortedProducts.indexOf(product) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`[Products] Error checking product ${product.id}:`, error.message);
      }
    }
    
    console.log(`[Products] ✓ Found ${productsWithMockups.length} products with mockup generation capability`);
    
    // Limit to top 20 if there are more
    const finalProducts = productsWithMockups.slice(0, 20);
    if (productsWithMockups.length > 20) {
      console.log(`[Products] Limiting to top 20 products`);
    }
    
    // Transform the products to match our frontend interface
    const transformedProducts = finalProducts.map(product => ({
      id: product.id,
      type: product.type,
      type_name: product.type_name,
      title: product.title,
      brand: product.brand,
      model: product.model,
      image: product.image,
      variant_count: product.variant_count || 0,
      currency: 'USD',
      description: product.description || '',
      can_generate_mockups: true
    }));
    
    console.log(`[Products] Returning ${transformedProducts.length} products to frontend`);
    res.json(transformedProducts);
  } catch (error) {
    console.error('[Products] Error fetching products from Printful:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/catalog/products/:productId
// @desc    Get detailed information for a specific product
// @access  Public
router.get('/products/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    console.log(`[Product Details] Fetching details for product ${productId}...`);
    
    // Check if Printful API key is configured
    if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
      console.error('[Product Details] PRINTFUL_API_KEY is not configured');
      return res.status(500).json({ 
        message: 'PRINTFUL_API_KEY is not configured'
      });
    }
    
    // Fetch detailed product information from Printful
    const response = await fetch(`https://api.printful.com/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[Product Details] Failed to fetch product ${productId}:`, data);
      return res.status(response.status).json({ 
        message: 'Failed to fetch product details',
        error: data 
      });
    }
    
    const productData = data.result?.product;
    const variants = data.result?.variants || [];
    
    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Transform variants to match frontend expectations
    const transformedVariants = variants.map(variant => ({
      id: variant.id,
      variant_id: variant.id,
      product_id: variant.product_id,
      name: variant.name,
      size: variant.size,
      color: variant.color,
      color_code: variant.color_code,
      color_code2: variant.color_code2,
      image: variant.image,
      price: variant.price,
      retail_price: variant.price, // Map price to retail_price for frontend compatibility
      currency: 'USD',
      in_stock: variant.in_stock,
      availability_regions: variant.availability_regions,
      availability_status: variant.availability_status,
      material: variant.material,
      // Add product info for image fallback
      product: {
        variant_id: variant.id,
        product_id: variant.product_id,
        image: variant.image,
        name: variant.name
      }
    }));
    
    // Transform the response to include all necessary data
    const transformedProduct = {
      id: productData.id,
      type: productData.type,
      type_name: productData.type_name,
      title: productData.title,
      brand: productData.brand,
      model: productData.model,
      image: productData.image,
      variant_count: transformedVariants.length,
      currency: 'USD',
      description: productData.description || '',
      // Include transformed variants
      variants: transformedVariants,
      // Include product info for compatibility
      product: {
        id: productData.id,
        type: productData.type,
        type_name: productData.type_name,
        title: productData.title,
        brand: productData.brand,
        model: productData.model,
        image: productData.image,
        variant_count: transformedVariants.length,
        currency: 'USD'
      },
      // Include options (for mockup styles, etc.)
      options: productData.options || [],
      // Include dimensions and other metadata
      dimensions: productData.dimensions,
      is_discontinued: productData.is_discontinued || false,
      can_generate_mockups: true
    };
    
    console.log(`[Product Details] ✓ Returning details for ${transformedProduct.title} with ${transformedProduct.variants.length} variants`);
    res.json(transformedProduct);
  } catch (error) {
    console.error(`[Product Details] Error fetching product ${productId}:`, error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Cache for store products (5 minute TTL)
const storeProductsCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5 minutes
};

// GET preselected products from Printful Store (Sync API)
router.get('/store-products', async (req, res) => {
  try {
    console.log('[Store Products] Fetching pre-made products from Printful store...');
    
    // Check cache first
    const now = Date.now();
    if (storeProductsCache.data && (now - storeProductsCache.timestamp) < storeProductsCache.TTL) {
      console.log('[Store Products] ✓ Returning cached data');
      return res.json(storeProductsCache.data);
    }
    
    // Check if API key is configured
    if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
      console.error('[Store Products] PRINTFUL_API_KEY is not configured');
      return res.status(500).json({ 
        message: 'PRINTFUL_API_KEY is not configured',
        products: []
      });
    }
    
    const response = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Store Products] Printful API error:', data);
      return res.status(response.status).json({ message: 'Failed to fetch store products', error: data });
    }
    
    // Extract and transform products
    const products = data.result || [];
    console.log(`[Store Products] ✓ Found ${products.length} pre-made products`);
    
    // Transform to a consistent format
    const transformedProducts = products.map(product => ({
      id: product.id,
      external_id: product.external_id,
      name: product.name,
      variants: product.variants || 0,
      synced: product.synced,
      thumbnail_url: product.thumbnail_url,
      is_ignored: product.is_ignored,
      type: 'store_product' // Mark as store product for frontend
    }));
    
    const responseData = {
      products: transformedProducts,
      count: transformedProducts.length
    };
    
    // Cache the result
    storeProductsCache.data = responseData;
    storeProductsCache.timestamp = now;
    
    res.json(responseData);
  } catch (error) {
    console.error('[Store Products] Error fetching store products from Printful:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a single preselected product details by sync product id
router.get('/store-products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`[Store Product Details] Fetching details for store product ${id}...`);
    
    // Check if API key is configured
    if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
      console.error('[Store Product Details] PRINTFUL_API_KEY is not configured');
      return res.status(500).json({ 
        message: 'PRINTFUL_API_KEY is not configured',
        result: null
      });
    }
    
    const response = await fetch(`https://api.printful.com/store/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[Store Product Details] Printful API error:`, data);
      return res.status(response.status).json({ 
        message: 'Failed to fetch store product from Printful', 
        error: data,
        result: null
      });
    }
    
    const storeProduct = data.result?.sync_product;
    const variants = data.result?.sync_variants || [];
    
    if (!storeProduct) {
      console.error(`[Store Product Details] No store product found for ID ${id}`);
      return res.status(404).json({ 
        message: 'Store product not found',
        result: null
      });
    }
    
    // Debug logging to see what Printful actually returns
    console.log(`[Store Product Details] Raw sync_variants data:`, JSON.stringify(variants, null, 2));
    
    // Transform variants to match frontend expectations
    // Note: sync_variants don't include pricing, so we'll fetch it from the actual product variant
    const transformedVariants = await Promise.all(variants.map(async (variant) => {
      let price = '0.00';
      let retailPrice = '0.00';
      
      try {
        // Fetch detailed variant information to get pricing
        const variantResponse = await fetch(`https://api.printful.com/products/variant/${variant.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
          }
        });
        
        if (variantResponse.ok) {
          const variantData = await variantResponse.json();
          const variantDetails = variantData.result?.variant;
          if (variantDetails) {
            price = variantDetails.price || '0.00';
            retailPrice = variantDetails.retail_price || variantDetails.price || '0.00';
            console.log(`[Store Product Details] Variant ${variant.id} price: ${price}, retail_price: ${retailPrice}`);
          }
        }
      } catch (error) {
        console.error(`[Store Product Details] Error fetching variant ${variant.id} details:`, error.message);
      }
      
      return {
        id: variant.id,
        variant_id: variant.id,
        product_id: variant.product_id,
        name: variant.name,
        size: variant.size,
        color: variant.color,
        color_code: variant.color_code,
        color_code2: variant.color_code2,
        image: variant.image,
        price: price,
        retail_price: retailPrice,
        currency: 'USD',
        in_stock: variant.availability_status === 'active', // Check availability_status for stock
        availability_regions: variant.availability_regions,
        availability_status: variant.availability_status,
        material: variant.material
      };
    }));
    
    // Transform the response to match frontend expectations
    const transformedProduct = {
      id: storeProduct.id.toString(),
      external_id: storeProduct.external_id,
      name: storeProduct.name,
      thumbnail_url: storeProduct.thumbnail_url,
      variants: transformedVariants,
      type: 'store_product',
      synced: storeProduct.synced,
      is_ignored: storeProduct.is_ignored
    };
    
    console.log(`[Store Product Details] ✓ Returning details for ${transformedProduct.name} with ${transformedProduct.variants.length} variants`);
    
    // Return in the format expected by frontend
    res.json({
      code: 200,
      result: transformedProduct
    });
  } catch (error) {
    console.error(`[Store Product Details] Error fetching store product ${id}:`, error);
    res.status(500).json({ 
      message: 'Server error fetching store product',
      error: error.message,
      result: null
    });
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

// @route   POST api/catalog/products/:productId/mockup
// @desc    Generate a product mockup with custom design (supports multi-placement)
// @access  Public
router.post('/products/:productId/mockup', async (req, res) => {
    const { productId } = req.params;
    const { variantId, placements: originalPlacements } = req.body;

    console.log(`[Mockup Request] Product: ${productId}, Variant: ${variantId}`);
    console.log(`[Mockup Request] Request body:`, JSON.stringify(req.body, null, 2));
    
    // Validate placements - handle both old and new format
    let placements = originalPlacements;
    
    // Backward compatibility: if placements is a single object, wrap it in an array
    if (placements && !Array.isArray(placements) && typeof placements === 'object') {
        console.log('[Mockup Request] Converting single placement object to array for backward compatibility');
        placements = [placements];
    }
    
    if (!placements || !Array.isArray(placements) || placements.length === 0) {
        console.error('[Mockup Request] Invalid or missing placements array');
        return res.status(400).json({ 
            message: 'Invalid request: placements must be a non-empty array',
            received: typeof originalPlacements,
            isArray: Array.isArray(originalPlacements),
            placementsValue: originalPlacements
        });
    }
    
    console.log(`[Mockup Request] Generating mockups for ${placements.length} placements`);
    console.log(`[Mockup Request] Generating 2D flat mockup`);

    // Helper function to get 2D variant image as fallback
    const get2DFallback = async () => {
        try {
            console.log('[Mockup Request] Attempting 2D fallback...');
            const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
                headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
            });
            
            if (variantResponse.ok) {
                const variantData = await variantResponse.json();
                
                // Look for full-size mockup files first (not thumbnails)
                const files = variantData.result?.product?.files || [];
                
                // Try to find a preview-type file with full mockup
                const previewFile = files.find(f => 
                    f.type === 'preview' || 
                    f.type === 'default' || 
                    f.type === 'front' ||
                    f.type === 'mockup'
                );
                
                if (previewFile) {
                    // Prefer preview_url (full size) over thumbnail
                    const mockupUrl = previewFile.preview_url || previewFile.url;
                    if (mockupUrl) {
                        console.log('[Mockup Request] Using 2D variant preview file:', mockupUrl);
                        return { 
                            mockups: [{
                                mockup_url: mockupUrl,
                                placement: placement
                            }],
                            source: '2d_fallback'
                        };
                    }
                }
                
                // Fallback to variant image (may be thumbnail)
                const variantImage = variantData.result?.variant?.image || 
                                     variantData.result?.product?.image;
                
                if (variantImage) {
                    console.log('[Mockup Request] Using 2D variant image (may be thumbnail):', variantImage);
                    return { 
                        mockups: [{
                            mockup_url: variantImage,
                            placement: placement
                        }],
                        source: '2d_fallback'
                    };
                }
            }
        } catch (fallbackError) {
            console.error('[Mockup Request] 2D fallback also failed:', fallbackError);
        }
        return null;
    };

    // Helper function to upload a design data URL to Printful
    const uploadDesignToPrintful = async (designDataUrl, placementName) => {
        if (!designDataUrl || !designDataUrl.startsWith('data:')) {
            return designDataUrl; // Already a URL
        }

        console.log(`[Mockup Request] Uploading ${placementName} design to Printful file library...`);
        
        // Extract base64 data
        const matches = designDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error(`Invalid data URL format for ${placementName}`);
        }
        
        const base64Data = matches[2];
        
        // Upload to Printful file library using base64 data
        const uploadPayload = {
            type: 'default',
            filename: `design-${placementName}.png`,
            data: base64Data
        };
        
        const uploadResponse = await fetch('https://api.printful.com/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            },
            body: JSON.stringify(uploadPayload)
        });
        
        const uploadData = await uploadResponse.json();
        
        if (!uploadResponse.ok || !uploadData.result) {
            throw new Error(`Failed to upload ${placementName} design: ${JSON.stringify(uploadData)}`);
        }

        const result = uploadData.result;
        const fileId = result.id;
        
        console.log(`[Mockup Request] ${placementName} uploaded with ID: ${fileId}, status: ${result.status}`);
        
        // If file is still processing, poll until ready
        if (result.status === 'waiting') {
            let fileReady = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!fileReady && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                
                const fileInfoResponse = await fetch(`https://api.printful.com/files/${fileId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                    }
                });
                
                const fileInfo = await fileInfoResponse.json();
                
                if (fileInfoResponse.ok && fileInfo.result) {
                    if (fileInfo.result.status === 'ok' || fileInfo.result.url) {
                        const imageUrl = fileInfo.result.url || fileInfo.result.preview_url || fileInfo.result.thumbnail_url;
                        if (imageUrl) {
                            console.log(`[Mockup Request] ✓ ${placementName} file ready: ${imageUrl}`);
                            return imageUrl;
                        }
                    } else if (fileInfo.result.status === 'failed') {
                        throw new Error(`File processing failed for ${placementName}`);
                    }
                }
            }
            
            throw new Error(`File processing timeout for ${placementName}`);
        } else if (result.status === 'ok') {
            const imageUrl = result.url || result.preview_url || result.thumbnail_url;
            if (!imageUrl) {
                throw new Error(`File processed but no URL available for ${placementName}`);
            }
            console.log(`[Mockup Request] ✓ ${placementName} file immediately ready: ${imageUrl}`);
            return imageUrl;
        } else {
            throw new Error(`Unexpected file status for ${placementName}: ${result.status}`);
        }
    };

    try {
        // Fetch variant details to get print area info for all placements
        console.log(`[Mockup Request] Fetching variant details for ${variantId}...`);
        const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
        });
        
        if (!variantResponse.ok) {
            return res.status(500).json({ message: 'Failed to fetch variant details' });
        }

        const variantData = await variantResponse.json();
        const printfiles = variantData.result?.printfiles || [];
        
        // Process all placements and upload designs
        const files = [];
        
        for (const placementData of placements) {
            const { placement, designDataUrl, artworkDimensions } = placementData;
            
            console.log(`[Mockup Request] Processing placement: ${placement}`);
            
            // Upload design to Printful
            const imageUrl = await uploadDesignToPrintful(designDataUrl, placement);
            
            // Get print area dimensions for this placement
            const placementPrintfile = printfiles.find(pf => pf.placement === placement) || printfiles[0];
            const printAreaWidth = placementPrintfile?.print_area?.area_width || 1800;
            const printAreaHeight = placementPrintfile?.print_area?.area_height || 2400;
            
            console.log(`[Mockup Request] ${placement} print area: ${printAreaWidth}x${printAreaHeight}`);
            
            // Calculate artwork scaling
            const actualArtworkWidth = artworkDimensions.width;
            const actualArtworkHeight = artworkDimensions.height;
            
            const maxWidth = printAreaWidth * 0.9;
            const maxHeight = printAreaHeight * 0.9;
            
            const scaleX = maxWidth / actualArtworkWidth;
            const scaleY = maxHeight / actualArtworkHeight;
            const scale = Math.min(scaleX, scaleY);
            
            const artworkWidth = Math.round(actualArtworkWidth * scale);
            const artworkHeight = Math.round(actualArtworkHeight * scale);
            
            const leftOffset = Math.max(0, (printAreaWidth - artworkWidth) / 2);
            const topOffset = Math.max(0, (printAreaHeight - artworkHeight) / 2);
            
            console.log(`[Mockup Request] ${placement} artwork: ${artworkWidth}x${artworkHeight} at (${Math.round(leftOffset)}, ${Math.round(topOffset)})`);
            
            files.push({
                placement: placement,
                image_url: imageUrl,
                position: {
                    area_width: printAreaWidth,
                    area_height: printAreaHeight,
                    width: artworkWidth,
                    height: artworkHeight,
                    top: Math.round(topOffset),
                    left: Math.round(leftOffset)
                }
            });
        }

        // Build the mockup request data
        const mockupData = {
            variant_ids: [variantId],
            format: 'jpg',
            files: files
        };

        console.log(`[Mockup Request] Creating task with ${files.length} placements for product ${productId}...`);
        
        // Step 1: Create mockup generation task
        const createTaskResponse = await fetch(`https://api.printful.com/mockup-generator/create-task/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            },
            body: JSON.stringify(mockupData)
        });

        const createTaskData = await createTaskResponse.json();
        
        if (!createTaskResponse.ok) {
            console.error('[Mockup Error] Printful API error:', JSON.stringify(createTaskData, null, 2));
            return res.status(createTaskResponse.status).json({ 
                message: 'Failed to create mockup task',
                error: createTaskData 
            });
        }

        const taskKey = createTaskData.result.task_key;
        console.log(`[Mockup Request] Task created with key: ${taskKey}`);

        // Step 2: Poll for mockup generation result
        let mockupResult = null;
        let attempts = 0;
        const maxAttempts = 40; // Increased for multiple placements

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
            
            const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                }
            });

            const resultData = await resultResponse.json();
            
            console.log(`[Mockup Poll ${attempts + 1}/${maxAttempts}] Status: ${resultData.result?.status || 'unknown'}`);
            
            if (resultData.result.status === 'completed') {
                mockupResult = resultData.result;
                console.log(`[Mockup Success] Generated ${mockupResult.mockups?.length || 0} mockup(s)`);
                break;
            } else if (resultData.result.status === 'failed') {
                console.error('[Mockup Error] Generation failed:', resultData.result);
                return res.status(500).json({ 
                    message: 'Mockup generation failed',
                    error: resultData.result 
                });
            }
            
            attempts++;
        }

        if (!mockupResult) {
            console.error('[Mockup Error] Timeout after attempts');
            return res.status(408).json({ message: 'Mockup generation timed out. Please try again.' });
        }

        // Map mockups to their placements
        const mockupsWithPlacement = mockupResult.mockups.map((mockup, index) => ({
            placement: files[index]?.placement || 'unknown',
            mockup_url: mockup.mockup_url || mockup.url,
            placement_id: mockup.placement,
            variant_id: mockup.variant_id
        }));

        res.json({ 
            success: true,
            mockups: mockupsWithPlacement,
            source: 'multi_placement_generated'
        });
    } catch (error) {
        console.error('[Mockup Error] Server error:', error);
        return res.status(500).json({ message: 'Server error during mockup generation', error: error.message });
    }
});

// @route   GET api/catalog/products/:productId/placements
// @desc    Get available placement areas for a product
// @access  Public
router.get('/products/:productId/placements', async (req, res) => {
    const { productId } = req.params;
    
    try {
        console.log(`[Placements] Fetching placements for product ${productId}`);
        
        // Fetch product details from Printful
        const productResponse = await fetch(`https://api.printful.com/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            }
        });
        
        const productData = await productResponse.json();
        
        if (!productResponse.ok) {
            console.error('[Placements] Failed to fetch product:', productData);
            return res.status(productResponse.status).json({ 
                message: 'Failed to fetch product details',
                error: productData 
            });
        }
        
        // Get the first variant to check available placements
        const variants = productData.result?.variants || [];
        if (variants.length === 0) {
            console.log('[Placements] No variants found for product, using fallback');
            return res.json({ 
                placements: ['front', 'back'], 
                placementLabels: { 
                    front: 'Front', 
                    back: 'Back',
                    left: 'Left',
                    right: 'Right',
                    sleeve_left: 'Left Sleeve',
                    sleeve_right: 'Right Sleeve'
                } 
            });
        }
        
        // Fetch variant details to get printfile placements
        const variantId = variants[0].id;
        const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            }
        });
        
        const variantData = await variantResponse.json();
        
        if (!variantResponse.ok) {
            console.error('[Placements] Failed to fetch variant:', variantData);
            console.log('[Placements] Using fallback placements for apparel');
            return res.json({ 
                placements: ['front', 'back'], 
                placementLabels: { 
                    front: 'Front', 
                    back: 'Back',
                    left: 'Left',
                    right: 'Right',
                    sleeve_left: 'Left Sleeve',
                    sleeve_right: 'Right Sleeve'
                } 
            });
        }
        
        // Extract placements from printfiles
        const printfiles = variantData.result?.product?.files || [];
        const placementSet = new Set();
        
        console.log(`[Placements] Found ${printfiles.length} printfiles:`, printfiles.map(f => ({ type: f.type, title: f.title })));
        
        printfiles.forEach(file => {
            if (file.type === 'default' && file.title) {
                // Extract placement from title (e.g., "Front print" -> "front")
                const title = file.title.toLowerCase();
                console.log(`[Placements] Processing file: "${file.title}" -> "${title}"`);
                if (title.includes('front')) placementSet.add('front');
                if (title.includes('back')) placementSet.add('back');
                if (title.includes('left') && title.includes('sleeve')) placementSet.add('sleeve_left');
                if (title.includes('right') && title.includes('sleeve')) placementSet.add('sleeve_right');
                if (title.includes('left')) placementSet.add('left');
                if (title.includes('right')) placementSet.add('right');
            }
        });
        
        console.log(`[Placements] Detected placements:`, Array.from(placementSet));
        
        // If no placements found, default to front and back for apparel
        let placements;
        if (placementSet.size === 0) {
            console.log('[Placements] No placements detected, using defaults for apparel');
            placements = ['front', 'back'];
        } else if (placementSet.size === 1) {
            console.log('[Placements] Only one placement detected, adding back for apparel');
            placements = Array.from(placementSet);
            if (!placements.includes('back')) {
                placements.push('back');
            }
        } else {
            placements = Array.from(placementSet);
        }
        
        // Create user-friendly labels
        const placementLabels = {
            front: 'Front',
            back: 'Back',
            left: 'Left',
            right: 'Right',
            sleeve_left: 'Left Sleeve',
            sleeve_right: 'Right Sleeve'
        };
        
        console.log(`[Placements] Found ${placements.length} placements:`, placements);
        res.json({ placements, placementLabels });
    } catch (error) {
        console.error('[Placements] Server error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET api/catalog/products/:productId/printfiles
// @desc    Get print area dimensions for product variants using Printful's printfiles API
// @access  Public
router.get('/products/:productId/printfiles', async (req, res) => {
    const { productId } = req.params;
    const { variantId } = req.query;
    
    try {
        console.log(`[Printfiles] Fetching printfiles for product ${productId}, variant ${variantId}`);
        
        if (!variantId) {
            return res.status(400).json({ message: 'variantId query parameter is required' });
        }
        
        // Check if API key is configured
        if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
            console.error('[Printfiles] PRINTFUL_API_KEY is not configured');
            return res.status(500).json({ message: 'PRINTFUL_API_KEY is not configured' });
        }
        
        // Use the correct Printful API endpoint for printfiles
        const printfilesResponse = await fetch(`https://api.printful.com/mockup-generator/printfiles/${productId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            }
        });
        
        const printfilesData = await printfilesResponse.json();
        
        if (!printfilesResponse.ok) {
            console.error('[Printfiles] Failed to fetch printfiles:', printfilesData);
            return res.status(printfilesResponse.status).json({ 
                message: 'Failed to fetch printfiles from Printful',
                error: printfilesData 
            });
        }
        
        // Extract printfiles from the response
        let printfiles = printfilesData.result || [];

        // Handle case where result might be an object instead of array
        if (!Array.isArray(printfiles)) {
            console.log('[Printfiles] Result is not an array, attempting to extract variants');
            // If it's an object with variant_id keys, extract the values
            if (typeof printfiles === 'object' && printfiles !== null) {
                printfiles = Object.values(printfiles);
            } else {
                printfiles = [];
            }
        }

        const variant_printfiles = [];
        
        console.log(`[Printfiles] Found ${printfiles.length} printfiles from Printful API`);
        
        // Map placement IDs to actual dimensions based on Printful's standard dimensions
        // These are the standard dimensions for DTG printing at 300 DPI
        const placementDimensions = {
            'front': { width: 1800, height: 2400, name: 'Front Print' }, // 6" x 8" at 300 DPI
            'front_large': { width: 4500, height: 5400, name: 'Large Front Print' }, // 15" x 18" at 300 DPI
            'back': { width: 1800, height: 2400, name: 'Back Print' }, // 6" x 8" at 300 DPI
            'sleeve_left': { width: 1200, height: 1200, name: 'Left Sleeve' }, // 4" x 4" at 300 DPI
            'sleeve_right': { width: 1200, height: 1200, name: 'Right Sleeve' }, // 4" x 4" at 300 DPI
            'label_inside': { width: 300, height: 300, name: 'Inside Label' }, // 1" x 1" at 300 DPI
            'label_outside': { width: 300, height: 300, name: 'Outside Label' } // 1" x 1" at 300 DPI
        };
        
        // Process each variant's placements
        printfiles.forEach(variant => {
            if (variant.placements) {
                Object.entries(variant.placements).forEach(([placement, placementId]) => {
                    const dimensions = placementDimensions[placement];
                    if (dimensions) {
                        console.log(`[Printfiles] ${placement}: ${dimensions.width}x${dimensions.height} pixels (${dimensions.name})`);
                        
                        const printfile = {
                            placement: placement,
                            display_name: dimensions.name,
                            print_area: {
                                area_width: dimensions.width,
                                area_height: dimensions.height,
                                width: dimensions.width,
                                height: dimensions.height,
                                print_area_width: dimensions.width,
                                print_area_height: dimensions.height
                            }
                        };
                        
                        variant_printfiles.push(printfile);
                    }
                });
            }
        });
        
        // If no printfiles found, return product-specific defaults based on product type
        if (variant_printfiles.length === 0) {
            console.log('[Printfiles] No printfiles found, returning product-specific defaults');
            
            // Get product info to determine appropriate defaults
            try {
                const productResponse = await fetch(`https://api.printful.com/products/${productId}`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                    }
                });
                
                if (productResponse.ok) {
                    const productData = await productResponse.json();
                    const productType = productData.result?.product?.type_name?.toLowerCase() || '';
                    
                    // Set appropriate defaults based on product type
                    let defaultWidth = 1800;  // 6" at 300 DPI (standard t-shirt)
                    let defaultHeight = 2400; // 8" at 300 DPI (standard t-shirt)
                    
                    if (productType.includes('tote') || productType.includes('bag') || productType.includes('tote bag')) {
                        defaultWidth = 2700;  // 9" at 300 DPI
                        defaultHeight = 3600; // 12" at 300 DPI
                    } else if (productType.includes('hoodie') || productType.includes('sweatshirt') || productType.includes('pullover')) {
                        defaultWidth = 2400;  // 8" at 300 DPI
                        defaultHeight = 3000; // 10" at 300 DPI
                    } else if (productType.includes('mug') || productType.includes('drinkware') || productType.includes('coffee mug')) {
                        defaultWidth = 1800;  // 6" at 300 DPI
                        defaultHeight = 1800; // 6" at 300 DPI (square)
                    } else if (productType.includes('poster') || productType.includes('print')) {
                        defaultWidth = 3600;  // 12" at 300 DPI
                        defaultHeight = 4800; // 16" at 300 DPI
                    } else if (productType.includes('sticker') || productType.includes('label')) {
                        defaultWidth = 600;   // 2" at 300 DPI
                        defaultHeight = 600;  // 2" at 300 DPI (square)
                    } else if (productType.includes('phone case') || productType.includes('case')) {
                        defaultWidth = 1200;  // 4" at 300 DPI
                        defaultHeight = 2100; // 7" at 300 DPI
                    }
                    
                    console.log(`[Printfiles] Using ${productType} defaults: ${defaultWidth}x${defaultHeight}`);
                    
                    variant_printfiles.push({
                        placement: 'front',
                        display_name: 'Front Print Area',
                        print_area: {
                            area_width: defaultWidth,
                            area_height: defaultHeight,
                            width: defaultWidth,
                            height: defaultHeight,
                            print_area_width: defaultWidth,
                            print_area_height: defaultHeight
                        }
                    });
                }
            } catch (error) {
                console.error('[Printfiles] Error fetching product info for defaults:', error);
            }
            
            // Fallback to standard t-shirt dimensions if all else fails
            if (variant_printfiles.length === 0) {
                variant_printfiles.push({
                    placement: 'front',
                    display_name: 'Front Print Area',
                    print_area: {
                        area_width: 1800,
                        area_height: 2400,
                        width: 1800,
                        height: 2400,
                        print_area_width: 1800,
                        print_area_height: 2400
                    }
                });
            }
        }
        
        console.log(`[Printfiles] Returning ${variant_printfiles.length} printfiles`);
        res.json({ variant_printfiles });
    } catch (error) {
        console.error('[Printfiles] Server error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST api/catalog/products/:productId/blank-mockup
// @desc    Generate a blank mockup (no design) for a product variant
// @access  Public
router.post('/products/:productId/blank-mockup', async (req, res) => {
    const { productId } = req.params;
    const { variantId, placement } = req.body;
    
    // Helper function to get variant image as fallback
    const get2DFallback = async () => {
        try {
            console.log('[Blank Mockup] Fetching variant image...');
            const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
                headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
            });
            
            if (variantResponse.ok) {
                const variantData = await variantResponse.json();
                
                // Get actual product images (not printfile definitions)
                const variantImage = variantData.result?.variant?.image;
                const productImage = variantData.result?.product?.image;
                const productThumbnail = variantData.result?.product?.thumbnail_url;
                
                // Use variant image first (most specific), then product image, then thumbnail
                const mockupUrl = variantImage || productImage || productThumbnail;
                
                if (mockupUrl) {
                    console.log('[Blank Mockup] ✓ Using variant/product image:', mockupUrl);
                    return { 
                        mockup_url: mockupUrl,
                        source: '2d_fallback'
                    };
                }
            }
        } catch (fallbackError) {
            console.error('[Blank Mockup] Fallback failed:', fallbackError);
        }
        return null;
    };
    
    try {
        console.log(`[Blank Mockup] Request for product ${productId}, variant ${variantId}, placement ${placement}`);
        
        if (!variantId) {
            return res.status(400).json({ message: 'variantId is required in request body' });
        }
        
        // Check if API key is configured
        if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
            console.error('[Blank Mockup] PRINTFUL_API_KEY is not configured');
            return res.status(500).json({ message: 'PRINTFUL_API_KEY is not configured' });
        }
        
        // Try to use 2D fallback directly (faster and more reliable)
        console.log(`[Blank Mockup] Using 2D variant image fallback for faster loading`);
        const fallback = await get2DFallback();
        if (fallback) {
            console.log(`[Blank Mockup] ✓ Returning 2D variant image`);
            return res.json(fallback);
        }
        
        // If no fallback available, try to generate mockup
        console.log(`[Blank Mockup] No 2D fallback found, attempting mockup generation via Printful API`);
        
        // Create a simple transparent pixel for mockup generation
        const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==';
        
        let imageUrl;
        
        // STEP 1: Save transparent pixel to server (Printful doesn't accept data URLs)
        try {
            console.log('[Blank Mockup] Converting transparent pixel to public URL...');
            
            const fs = require('fs');
            const path = require('path');
            
            // Extract base64 data
            const matches = transparentPixel.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                return res.status(500).json({ message: 'Invalid transparent pixel format' });
            }
            
            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            
            const filename = 'transparent-pixel.png';
            
            // Save to public/temp-designs directory
            const tempDir = path.join(__dirname, '..', 'public', 'temp-designs');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const filepath = path.join(tempDir, filename);
            fs.writeFileSync(filepath, buffer);
            
            // Create public URL
            const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';
            imageUrl = `${baseUrl}/temp-designs/${filename}`;
            
            console.log('[Blank Mockup] ✓ Saved transparent pixel:', imageUrl);
        } catch (error) {
            console.error('[Blank Mockup] Error saving transparent pixel:', error);
            return res.status(500).json({ message: 'Failed to save transparent pixel', error: error.message });
        }
        
        // STEP 2: Create 2D mockup task
        const mockupData = {
            variant_ids: [variantId],
            format: 'jpg',
            files: [{
                placement: placement || 'front',
                image_url: imageUrl,
                position: {
                    area_width: 1800,
                    area_height: 2400,
                    width: 1800,
                    height: 2400,
                    top: 0,
                    left: 0
                }
            }]
            // Generate 2D flat mockup (no options needed)
        };
        
        const createTaskResponse = await fetch(`https://api.printful.com/mockup-generator/create-task/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            },
            body: JSON.stringify(mockupData)
        });
        
        const createTaskData = await createTaskResponse.json();
        
        if (!createTaskResponse.ok) {
            console.error('[Blank Mockup] Failed to create task:', createTaskData);
            return res.status(createTaskResponse.status).json({ 
                message: 'Failed to create 2D blank mockup task',
                error: createTaskData 
            });
        }
        
        const taskKey = createTaskData.result.task_key;
        console.log(`[Blank Mockup] Task created: ${taskKey}`);
        
        // STEP 3: Poll for completion
        let mockupResult = null;
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                }
            });
            
            const resultData = await resultResponse.json();
            
            console.log(`[Blank Mockup Poll ${attempts + 1}/${maxAttempts}] Status: ${resultData.result?.status}`);
            
            if (resultData.result.status === 'completed') {
                mockupResult = resultData.result;
                break;
            } else if (resultData.result.status === 'failed') {
                console.error('[Blank Mockup] Generation failed:', resultData.result);
                return res.status(500).json({ 
                    message: '2D blank mockup generation failed',
                    error: resultData.result 
                });
            }
            
            attempts++;
        }
        
        if (!mockupResult) {
            console.error('[Blank Mockup] Timeout after 30 attempts');
            return res.status(408).json({ message: '2D blank mockup generation timed out' });
        }
        
        const mockupUrl = mockupResult.mockups?.[0]?.mockup_url || mockupResult.mockups?.[0]?.url;
        
        if (mockupUrl) {
            console.log(`[Blank Mockup] ✓ Generated 2D mockup successfully: ${mockupUrl}`);
            res.json({ 
                mockup_url: mockupUrl,
                source: '2d_generated'
            });
        } else {
            return res.status(500).json({ message: 'No 2D mockup URL in result' });
        }
    } catch (error) {
        console.error('[Blank Mockup] Server error:', error);
        return res.status(500).json({ message: 'Server error during 2D blank mockup generation', error: error.message });
    }
});

// @route   GET api/catalog/products/:productId/flat-image
// @desc    Get flat product image for a specific placement
// @access  Public
router.get('/products/:productId/flat-image', async (req, res) => {
    const { productId } = req.params;
    const { variantId, placement } = req.query;
    
    console.log(`[Flat Image] Fetching flat image for product ${productId}, variant ${variantId}, placement ${placement}`);
    
    if (!variantId) {
        return res.status(400).json({ message: 'variantId is required' });
    }
    
    try {
        // Fetch variant details from Printful
        const response = await fetch(
            `https://api.printful.com/products/variant/${variantId}`,
            { headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }}
        );
        
        if (!response.ok) {
            console.error('[Flat Image] Failed to fetch variant from Printful:', response.status);
            return res.status(response.status).json({ message: 'Failed to fetch variant from Printful' });
        }
        
        const data = await response.json();
        
        // Get the actual variant/product images (not printfile definitions)
        const variantImage = data.result?.variant?.image;
        const productImage = data.result?.product?.image;
        const productThumbnail = data.result?.product?.thumbnail_url;
        
        console.log(`[Flat Image] Variant image:`, variantImage);
        console.log(`[Flat Image] Product image:`, productImage);
        
        // Use variant image first (most specific), then product image, then thumbnail
        let flatImageUrl = variantImage || productImage || productThumbnail;
        
        if (flatImageUrl) {
            console.log(`[Flat Image] ✓ Found flat image:`, flatImageUrl);
            return res.json({ 
                flatImageUrl: flatImageUrl,
                placement: placement || 'front',
                type: 'variant_image'
            });
        }
        
        // No image found
        console.warn(`[Flat Image] No image found for variant ${variantId}`);
        return res.status(404).json({ message: 'No image available for this variant' });
        
    } catch (error) {
        console.error('[Flat Image] Server error:', error);
        res.status(500).json({ message: 'Error fetching flat image', error: error.message });
    }
});

// Pricing cache to store pricing data with 24-hour refresh
const pricingCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// @route   GET api/catalog/products/:productId/pricing
// @desc    Get pricing information for a product variant including base price and additional placement costs
// @access  Public
router.get('/products/:productId/pricing', async (req, res) => {
    const { productId } = req.params;
    const { variantId } = req.query;
    
    try {
        console.log(`[Pricing] Fetching pricing for product ${productId}, variant ${variantId}`);
        
        if (!variantId) {
            return res.status(400).json({ message: 'variantId query parameter is required' });
        }
        
        // Check if API key is configured
        if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
            console.error('[Pricing] PRINTFUL_API_KEY is not configured');
            return res.status(500).json({ message: 'PRINTFUL_API_KEY is not configured' });
        }
        
        // Check cache first
        const cacheKey = `${productId}-${variantId}`;
        const cachedData = pricingCache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            console.log(`[Pricing] ✓ Using cached pricing data for ${cacheKey}`);
            return res.json(cachedData.pricing);
        }
        
        // Fetch variant details from Printful to get pricing
        const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            }
        });
        
        const variantData = await variantResponse.json();
        
        if (!variantResponse.ok) {
            console.error('[Pricing] Failed to fetch variant:', variantData);
            return res.status(variantResponse.status).json({ 
                message: 'Failed to fetch variant pricing',
                error: variantData 
            });
        }
        
        // Extract base price from variant
        const variant = variantData.result?.variant;
        const product = variantData.result?.product;
        
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        // Get base price (includes one print area - typically front)
        const basePrice = parseFloat(variant.price) || 0;
        const currency = variant.currency || 'USD';
        
        // Get product type to determine available placements and their costs
        const productType = product?.type || '';
        const productTypeName = product?.type_name || '';
        
        console.log(`[Pricing] Product type: ${productType} (${productTypeName}), Base price: ${basePrice} ${currency}`);
        
        // Define additional placement costs based on product type
        // These are standard Printful costs - may vary by product and region
        const additionalPlacements = {};
        
        // Most apparel products support these placements
        if (productType.includes('SHIRT') || productType.includes('HOODIE') || 
            productType.includes('SWEATSHIRT') || productType.includes('TANK')) {
            
            additionalPlacements['back'] = 5.95; // Back print
            additionalPlacements['sleeve_left'] = 2.49; // Left sleeve
            additionalPlacements['sleeve_right'] = 2.49; // Right sleeve
            additionalPlacements['inside_label'] = 0.99; // Inside label
            additionalPlacements['outside_label'] = 2.49; // Outside label
            
            console.log(`[Pricing] Apparel product - added standard placement costs`);
        }
        // Mugs and drinkware typically only have one print area (included in base)
        else if (productType.includes('MUG') || productType.includes('CUP')) {
            // Base price includes the print, no additional placements typically
            console.log(`[Pricing] Drinkware product - single print area included`);
        }
        // Posters, prints, canvas - single print area included
        else if (productType.includes('POSTER') || productType.includes('CANVAS') || 
                 productType.includes('PRINT')) {
            console.log(`[Pricing] Print product - single print area included`);
        }
        // Accessories, bags, etc. - may have front and back
        else if (productType.includes('BAG') || productType.includes('TOTE')) {
            additionalPlacements['back'] = 5.95; // Back print
            console.log(`[Pricing] Bag product - added back placement cost`);
        }
        // Default: assume at least back placement is available
        else {
            additionalPlacements['back'] = 5.95;
            console.log(`[Pricing] Default product - added back placement cost`);
        }
        
        // Build pricing response
        const pricingData = {
            basePrice,
            currency,
            productType,
            productTypeName,
            additionalPlacements,
            note: 'Base price includes one print area (typically front). Additional placements incur extra costs. Shipping and taxes not included.'
        };
        
        // Cache the pricing data
        pricingCache.set(cacheKey, {
            pricing: pricingData,
            timestamp: Date.now()
        });
        
        console.log(`[Pricing] ✓ Cached pricing data for ${cacheKey}`);
        console.log(`[Pricing] Returning: Base ${basePrice} ${currency}, ${Object.keys(additionalPlacements).length} additional placements`);
        
        res.json(pricingData);
    } catch (error) {
        console.error('[Pricing] Server error:', error);
        res.status(500).json({ 
            message: 'Server error fetching pricing',
            error: error.message 
        });
    }
});

module.exports = router;
