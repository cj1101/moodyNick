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

// @route   POST api/catalog/products/:productId/mockup
// @desc    Generate a product mockup with custom design
// @access  Public
router.post('/products/:productId/mockup', async (req, res) => {
    const { productId } = req.params;
    const { variantId, placement, designDataUrl } = req.body;

    console.log(`[Mockup Request] Product: ${productId}, Variant: ${variantId}, Placement: ${placement}`);
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

    try {
        let imageUrl = designDataUrl;
        
        // If designDataUrl is a data URL, upload it to Printful's file library
        if (designDataUrl && designDataUrl.startsWith('data:')) {
            console.log(`[Mockup Request] Uploading data URL to Printful file library...`);
            
            try {
                // Extract base64 data
                const matches = designDataUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (!matches) {
                    console.error(`[Mockup Request] Invalid data URL format`);
                    return res.status(400).json({ message: 'Invalid image data format' });
                }
                
                const mimeType = matches[1];
                const base64Data = matches[2];
                
                // Upload to Printful file library using base64 data
                const uploadPayload = {
                    type: 'default',
                    filename: 'design.png',
                    data: base64Data
                };
                
                console.log(`[Mockup Request] Uploading ${base64Data.length} bytes...`);
                
                const uploadResponse = await fetch('https://api.printful.com/files', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                    },
                    body: JSON.stringify(uploadPayload)
                });
                
                const uploadData = await uploadResponse.json();
                
                console.log(`[Mockup Request] Upload response status: ${uploadResponse.status}`);
                console.log(`[Mockup Request] Upload response:`, JSON.stringify(uploadData, null, 2));
                
                if (uploadResponse.ok && uploadData.result) {
                    const result = uploadData.result;
                    const fileId = result.id;
                    
                    console.log(`[Mockup Request] File uploaded with ID: ${fileId}, status: ${result.status}`);
                    
                    // If file is still processing (status: 'waiting'), poll until ready
                    if (result.status === 'waiting') {
                        console.log(`[Mockup Request] File is processing, polling for completion...`);
                        
                        let fileReady = false;
                        let attempts = 0;
                        const maxAttempts = 10;
                        
                        while (!fileReady && attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                            attempts++;
                            
                            // Get file info to check status
                            const fileInfoResponse = await fetch(`https://api.printful.com/files/${fileId}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                                }
                            });
                            
                            const fileInfo = await fileInfoResponse.json();
                            
                            if (fileInfoResponse.ok && fileInfo.result) {
                                console.log(`[Mockup Request] Poll ${attempts}/${maxAttempts}: status=${fileInfo.result.status}, url=${fileInfo.result.url ? 'available' : 'null'}`);
                                
                                if (fileInfo.result.status === 'ok' || fileInfo.result.url) {
                                    imageUrl = fileInfo.result.url || fileInfo.result.preview_url || fileInfo.result.thumbnail_url;
                                    if (imageUrl) {
                                        fileReady = true;
                                        console.log(`[Mockup Request] ✓ File ready: ${imageUrl}`);
                                    }
                                } else if (fileInfo.result.status === 'failed') {
                                    console.error(`[Mockup Request] File processing failed:`, fileInfo.result);
                                    return res.status(500).json({ 
                                        message: 'File processing failed. This usually means the uploaded image is invalid or corrupted. Please try adding some artwork to your design.',
                                        error: fileInfo.result,
                                        details: 'The image file could not be processed by Printful. Make sure you have added at least one image or text element to your design.'
                                    });
                                }
                            }
                        }
                        
                        if (!fileReady || !imageUrl) {
                            console.error(`[Mockup Request] File processing timeout after ${attempts} attempts`);
                            return res.status(408).json({ 
                                message: 'File processing timed out. Please try again.'
                            });
                        }
                    } else if (result.status === 'ok') {
                        // File is already ready
                        imageUrl = result.url || result.preview_url || result.thumbnail_url;
                        if (!imageUrl) {
                            console.error(`[Mockup Request] File status is 'ok' but no URL available:`, result);
                            return res.status(500).json({ 
                                message: 'File processed but no URL available',
                                error: result
                            });
                        }
                        console.log(`[Mockup Request] ✓ File immediately ready: ${imageUrl}`);
                    } else {
                        console.error(`[Mockup Request] Unexpected file status: ${result.status}`, result);
                        return res.status(500).json({ 
                            message: `Unexpected file status: ${result.status}`,
                            error: result
                        });
                    }
                } else {
                    console.error(`[Mockup Request] Failed to upload image:`, uploadData);
                    return res.status(uploadResponse.status).json({ 
                        message: 'Failed to upload image to Printful',
                        error: uploadData
                    });
                }
            } catch (error) {
                console.error(`[Mockup Request] Error uploading image:`, error);
                return res.status(500).json({ 
                    message: 'Failed to upload image',
                    error: error.message
                });
            }
        } else {
            console.log(`[Mockup Request] Using provided URL: ${imageUrl}`);
        }
        
        // Get actual print area dimensions for proper aspect ratio preservation
        let printAreaWidth = 1800; // Default fallback
        let printAreaHeight = 2400; // Default fallback
        
        try {
            console.log(`[Mockup Request] Fetching print area info for variant ${variantId}...`);
            const printAreaResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
                headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
            });
            
            if (printAreaResponse.ok) {
                const printAreaData = await printAreaResponse.json();
                const printfiles = printAreaData.result?.printfiles || [];
                const frontPrintfile = printfiles.find(pf => pf.placement === (placement || 'front')) || printfiles[0];
                
                if (frontPrintfile?.print_area) {
                    printAreaWidth = frontPrintfile.print_area.area_width || 1800;
                    printAreaHeight = frontPrintfile.print_area.area_height || 2400;
                    console.log(`[Mockup Request] Using print area dimensions: ${printAreaWidth}x${printAreaHeight}`);
                } else {
                    console.log(`[Mockup Request] No print area found, using defaults: ${printAreaWidth}x${printAreaHeight}`);
                }
            } else {
                console.log(`[Mockup Request] Failed to fetch print area, using defaults: ${printAreaWidth}x${printAreaHeight}`);
            }
        } catch (error) {
            console.log(`[Mockup Request] Error fetching print area, using defaults: ${printAreaWidth}x${printAreaHeight}`, error.message);
        }

        // Get actual artwork dimensions from the uploaded file
        let actualArtworkWidth = 100; // Default fallback
        let actualArtworkHeight = 100; // Default fallback
        
        try {
            // Try to get dimensions from the uploaded file info
            if (imageUrl && imageUrl.includes('files.cdn.printful.com')) {
                // Extract file ID from URL to get file info
                const fileIdMatch = imageUrl.match(/files\/([^\/]+)\//);
                if (fileIdMatch) {
                    const fileId = fileIdMatch[1];
                    const fileInfoResponse = await fetch(`https://api.printful.com/files/${fileId}`, {
                        headers: { 'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}` }
                    });
                    
                    if (fileInfoResponse.ok) {
                        const fileInfo = await fileInfoResponse.json();
                        if (fileInfo.result) {
                            actualArtworkWidth = fileInfo.result.width || 100;
                            actualArtworkHeight = fileInfo.result.height || 100;
                            console.log(`[Mockup Request] Detected artwork dimensions: ${actualArtworkWidth}x${actualArtworkHeight}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`[Mockup Request] Could not detect artwork dimensions, using defaults: ${actualArtworkWidth}x${actualArtworkHeight}`);
        }

        // Scale artwork to fit within print area while maintaining aspect ratio
        const maxWidth = Math.min(printAreaWidth * 0.8, 1200); // Max 80% of print area width
        const maxHeight = Math.min(printAreaHeight * 0.8, 1600); // Max 80% of print area height
        
        const scaleX = maxWidth / actualArtworkWidth;
        const scaleY = maxHeight / actualArtworkHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
        
        const artworkWidth = Math.round(actualArtworkWidth * scale);
        const artworkHeight = Math.round(actualArtworkHeight * scale);
        
        // Center the artwork within the print area
        const leftOffset = Math.max(0, (printAreaWidth - artworkWidth) / 2);
        const topOffset = Math.max(0, (printAreaHeight - artworkHeight) / 2);

        console.log(`[Mockup Request] Artwork positioning: ${artworkWidth}x${artworkHeight} at (${Math.round(leftOffset)}, ${Math.round(topOffset)})`);

        // Prepare the files array for Printful with proper aspect ratio preservation
        const files = [
            {
                placement: placement || 'front',
                image_url: imageUrl,
                position: {
                    area_width: printAreaWidth,
                    area_height: printAreaHeight,
                    width: artworkWidth,
                    height: artworkHeight,
                    top: Math.round(topOffset),
                    left: Math.round(leftOffset)
                }
            }
        ];

        // Build the mockup request data
        const mockupData = {
            variant_ids: [variantId],
            format: 'jpg',
            files: files
        };

        // Always generate 2D flat mockup (no style options needed)

        // Step 1: Create mockup generation task
        console.log(`[Mockup Request] Creating task for product ${productId}...`);
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
                message: 'Failed to create 2D mockup task',
                error: createTaskData 
            });
        }

        const taskKey = createTaskData.result.task_key;
        console.log(`[Mockup Request] Task created with key: ${taskKey}`);

        // Step 2: Poll for mockup generation result
        let mockupResult = null;
        let attempts = 0;
        const maxAttempts = 30; // Increase for 3D mockups which take longer

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
                console.log(`[Mockup Success] Generated ${mockupResult.mockups?.length || 0} 2D mockup(s)`);
                break;
            } else if (resultData.result.status === 'failed') {
                console.error('[Mockup Error] Generation failed:', resultData.result);
                return res.status(500).json({ 
                    message: '2D mockup generation failed',
                    error: resultData.result 
                });
            }
            
            attempts++;
        }

        if (!mockupResult) {
            console.error('[Mockup Error] Timeout after 30 attempts');
            return res.status(408).json({ message: '2D mockup generation timed out. Please try again.' });
        }

        res.json({ 
            success: true,
            mockups: mockupResult.mockups,
            source: '2d_generated'
        });
    } catch (error) {
        console.error('[Mockup Error] Server error:', error);
        return res.status(500).json({ message: 'Server error during 2D mockup generation', error: error.message });
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
            console.log('[Placements] No variants found for product');
            return res.json({ placements: ['front'], placementLabels: { front: 'Front' } });
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
            return res.json({ placements: ['front'], placementLabels: { front: 'Front' } });
        }
        
        // Extract placements from printfiles
        const printfiles = variantData.result?.product?.files || [];
        const placementSet = new Set();
        
        printfiles.forEach(file => {
            if (file.type === 'default' && file.title) {
                // Extract placement from title (e.g., "Front print" -> "front")
                const title = file.title.toLowerCase();
                if (title.includes('front')) placementSet.add('front');
                if (title.includes('back')) placementSet.add('back');
                if (title.includes('left') && title.includes('sleeve')) placementSet.add('sleeve_left');
                if (title.includes('right') && title.includes('sleeve')) placementSet.add('sleeve_right');
                if (title.includes('left')) placementSet.add('left');
                if (title.includes('right')) placementSet.add('right');
            }
        });
        
        // If no placements found, default to front
        const placements = placementSet.size > 0 ? Array.from(placementSet) : ['front'];
        
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
// @desc    Get print area dimensions for product variants
// @access  Public
router.get('/products/:productId/printfiles', async (req, res) => {
    const { productId } = req.params;
    const { variantId } = req.query;
    
    try {
        console.log(`[Printfiles] Fetching printfiles for product ${productId}, variant ${variantId}`);
        
        if (!variantId) {
            return res.status(400).json({ message: 'variantId query parameter is required' });
        }
        
        // Fetch variant details from Printful
        const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            }
        });
        
        const variantData = await variantResponse.json();
        
        if (!variantResponse.ok) {
            console.error('[Printfiles] Failed to fetch variant:', variantData);
            return res.status(variantResponse.status).json({ 
                message: 'Failed to fetch variant details',
                error: variantData 
            });
        }
        
        // Extract printfile information
        const printfiles = variantData.result?.product?.files || [];
        const variant_printfiles = [];
        
        printfiles.forEach(file => {
            if (file.type === 'default' && file.title) {
                // Determine placement from title
                const title = file.title.toLowerCase();
                let placement = 'front';
                
                if (title.includes('back')) placement = 'back';
                else if (title.includes('left') && title.includes('sleeve')) placement = 'sleeve_left';
                else if (title.includes('right') && title.includes('sleeve')) placement = 'sleeve_right';
                else if (title.includes('left')) placement = 'left';
                else if (title.includes('right')) placement = 'right';
                
                // Extract print area dimensions
                const printfile = {
                    placement: placement,
                    display_name: file.title,
                    print_area: {
                        area_width: file.width || 1800,
                        area_height: file.height || 2400,
                        width: file.width || 1800,
                        height: file.height || 2400,
                        print_area_width: file.width || 1800,
                        print_area_height: file.height || 2400
                    }
                };
                
                variant_printfiles.push(printfile);
            }
        });
        
        // If no printfiles found, return defaults
        if (variant_printfiles.length === 0) {
            console.log('[Printfiles] No printfiles found, returning defaults');
            variant_printfiles.push({
                placement: 'front',
                display_name: 'Front Print',
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

module.exports = router;
