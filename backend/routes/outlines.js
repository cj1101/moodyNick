const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { 
    generateProductOutline, 
    saveOutlineToDisk, 
    outlineExists 
} = require('../utils/geminiOutline');

// Debug logging
console.log('[OUTLINES ROUTE] Loading outlines.js...');
console.log('[OUTLINES ROUTE] Gemini API Key configured:', !!process.env.GEMINI_API_KEY);
console.log('[OUTLINES ROUTE] Printful API Key configured:', !!process.env.PRINTFUL_API_KEY);

const OUTLINES_DIR = path.join(__dirname, '..', 'public', 'product-outlines');

// Ensure outlines directory exists
async function ensureOutlinesDir() {
    try {
        await fs.mkdir(OUTLINES_DIR, { recursive: true });
    } catch (error) {
        console.error('[Outlines] Error creating directory:', error);
    }
}

ensureOutlinesDir();

/**
 * @route   GET /api/outlines/status
 * @desc    Get status of available product outlines
 * @access  Public
 */
router.get('/status', async (req, res) => {
    try {
        console.log('[OUTLINES STATUS] ===== ENTRY POINT =====');
        console.log('[OUTLINES STATUS] Request received:', req.method, req.url);
        console.log('[OUTLINES STATUS] Headers:', req.headers);
        console.log('[OUTLINES STATUS] Checking available outlines...');
        
        // Read all files in outlines directory
        let files = [];
        try {
            files = await fs.readdir(OUTLINES_DIR);
        } catch (error) {
            console.log('[Outlines Status] Directory does not exist yet, returning empty status');
            files = [];
        }
        
        // Filter for PNG files and extract product IDs
        const outlineFiles = files.filter(f => f.endsWith('.png') && f.startsWith('product-'));
        const productIds = outlineFiles.map(f => {
            const match = f.match(/product-(\d+)\.png/);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        console.log(`[Outlines Status] Found ${productIds.length} product outlines`);
        
        // Build response with details for each product
        const products = productIds.map(productId => ({
            productId,
            source: 'dynamic',
            status: 'generated',
            filename: `product-${productId}.png`,
            prompt: `Product ${productId} outline`,
            relativePath: `/product-outlines/product-${productId}.png`,
            absoluteUrl: `${req.protocol}://${req.get('host')}/product-outlines/product-${productId}.png`,
            generated: {
                exists: true,
                path: `/product-outlines/product-${productId}.png`
            },
            static: {
                exists: false,
                path: null
            }
        }));
        
        // Summary
        const summary = {
            totalProducts: productIds.length,
            generatedCount: productIds.length,
            staticCount: 0,
            missingCount: 0
        };
        
        res.json({
            summary,
            products,
            generatedProductIds: productIds,
            staticProductIds: [],
            missingProductIds: []
        });
    } catch (error) {
        console.error('[Outlines Status] Error:', error);
        res.status(500).json({ 
            message: 'Failed to get outline status',
            error: error.message 
        });
    }
});

/**
 * @route   GET /api/outlines/:productId
 * @desc    Serve product outline image
 * @access  Public
 */
router.get('/:productId', async (req, res) => {
    const { productId } = req.params;
    
    try {
        console.log('[OUTLINES SERVE] ===== ENTRY POINT =====');
        console.log(`[OUTLINES SERVE] Serving outline for product ${productId}`);
        console.log('[OUTLINES SERVE] Request params:', req.params);
        console.log('[OUTLINES SERVE] Request query:', req.query);
        
        const filename = `product-${productId}.png`;
        const filepath = path.join(OUTLINES_DIR, filename);
        
        // Check if outline exists
        try {
            await fs.access(filepath);
            // Serve the file
            res.sendFile(filepath);
        } catch {
            console.log(`[Outlines Serve] Outline not found for product ${productId}`);
            res.status(404).json({ 
                message: 'Outline not found',
                productId,
                hint: `Use POST /api/outlines/generate/${productId} to create it`
            });
        }
    } catch (error) {
        console.error('[Outlines Serve] Error:', error);
        res.status(500).json({ 
            message: 'Failed to serve outline',
            error: error.message 
        });
    }
});

/**
 * @route   POST /api/outlines/generate/:productId
 * @desc    Generate product outline using Gemini AI
 * @access  Public
 */
router.post('/generate/:productId', async (req, res) => {
    const { productId } = req.params;
    const { variantId, force } = req.body;
    
    try {
        console.log('[OUTLINES GENERATE] ===== ENTRY POINT =====');
        console.log(`[OUTLINES GENERATE] Generating outline for product ${productId}`);
        console.log('[OUTLINES GENERATE] Request params:', req.params);
        console.log('[OUTLINES GENERATE] Request body:', req.body);
        console.log('[OUTLINES GENERATE] Headers:', req.headers);
        
        // Check if outline already exists (unless force regeneration)
        if (!force && await outlineExists(productId, OUTLINES_DIR)) {
            console.log(`[Outlines Generate] Outline already exists for product ${productId}`);
            return res.json({
                success: true,
                message: 'Outline already exists',
                productId,
                path: `/product-outlines/product-${productId}.png`,
                url: `${req.protocol}://${req.get('host')}/product-outlines/product-${productId}.png`,
                cached: true
            });
        }
        
        // Fetch product info from Printful to get image URL
        console.log(`[Outlines Generate] Fetching product info from Printful...`);
        const printfulResponse = await fetch(`https://api.printful.com/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            }
        });
        
        if (!printfulResponse.ok) {
            throw new Error(`Failed to fetch product from Printful: ${printfulResponse.status}`);
        }
        
        const printfulData = await printfulResponse.json();
        const product = printfulData.result?.product;
        
        if (!product || !product.image) {
            throw new Error('Product image not found in Printful data');
        }
        
        console.log(`[Outlines Generate] Product image URL: ${product.image}`);
        
        // Determine product type from title/type
        let productType = 'tshirt'; // default
        const title = (product.title || product.type_name || '').toLowerCase();
        if (title.includes('hoodie')) productType = 'hoodie';
        else if (title.includes('mug') || title.includes('cup')) productType = 'mug';
        else if (title.includes('bag') || title.includes('tote')) productType = 'bag';
        
        // Generate outline
        console.log(`[Outlines Generate] Generating outline for product type: ${productType}`);
        const outlineBuffer = await generateProductOutline(product.image, productId, productType);
        
        // Save to disk
        const filepath = await saveOutlineToDisk(outlineBuffer, productId, OUTLINES_DIR);
        
        res.json({
            success: true,
            message: 'Outline generated successfully',
            productId,
            productType,
            path: `/product-outlines/product-${productId}.png`,
            url: `${req.protocol}://${req.get('host')}/product-outlines/product-${productId}.png`,
            cached: false,
            aiAnalysis: process.env.GEMINI_API_KEY ? 'Used Gemini AI for analysis' : 'Generated without AI'
        });
        
    } catch (error) {
        console.error('[Outlines Generate] Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate outline',
            productId,
            error: error.message 
        });
    }
});

/**
 * @route   POST /api/outlines/batch-generate
 * @desc    Generate outlines for multiple products
 * @access  Public
 */
router.post('/batch-generate', async (req, res) => {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
        return res.status(400).json({ message: 'productIds array is required' });
    }
    
    console.log(`[Outlines Batch] Generating outlines for ${productIds.length} products`);
    
    const results = [];
    
    for (const productId of productIds) {
        try {
            // Check if already exists
            if (await outlineExists(productId, OUTLINES_DIR)) {
                results.push({
                    productId,
                    success: true,
                    cached: true,
                    message: 'Already exists'
                });
                continue;
            }
            
            // Generate outline
            const printfulResponse = await fetch(`https://api.printful.com/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                }
            });
            
            if (!printfulResponse.ok) {
                results.push({
                    productId,
                    success: false,
                    error: 'Failed to fetch from Printful'
                });
                continue;
            }
            
            const printfulData = await printfulResponse.json();
            const product = printfulData.result?.product;
            
            if (!product?.image) {
                results.push({
                    productId,
                    success: false,
                    error: 'No product image found'
                });
                continue;
            }
            
            // Determine product type
            let productType = 'tshirt';
            const title = (product.title || '').toLowerCase();
            if (title.includes('hoodie')) productType = 'hoodie';
            else if (title.includes('mug')) productType = 'mug';
            else if (title.includes('bag')) productType = 'bag';
            
            const outlineBuffer = await generateProductOutline(product.image, productId, productType);
            await saveOutlineToDisk(outlineBuffer, productId, OUTLINES_DIR);
            
            results.push({
                productId,
                success: true,
                cached: false,
                productType
            });
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            results.push({
                productId,
                success: false,
                error: error.message
            });
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
        success: true,
        message: `Generated ${successCount}/${productIds.length} outlines`,
        results
    });
});

module.exports = router;

