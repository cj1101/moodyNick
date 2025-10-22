const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate a product outline using Gemini AI and image processing
 */

// Initialize Gemini AI
let genAI;
console.log('[GEMINI OUTLINE] Initializing Gemini AI...');
console.log('[GEMINI OUTLINE] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('[GEMINI OUTLINE] ✓ Gemini AI initialized');
} else {
    console.log('[GEMINI OUTLINE] ⚠️ No Gemini API key - will use fallback methods');
}

/**
 * Fetch image from URL and return as buffer
 */
async function fetchImageBuffer(imageUrl) {
    console.log(`[Gemini Outline] Fetching image from: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Use Gemini Vision to analyze product image and get description
 */
async function analyzeProductWithGemini(imageBuffer) {
    if (!genAI) {
        console.warn('[Gemini Outline] Gemini API not configured, skipping AI analysis');
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `You are analyzing a product photograph. Describe the product's silhouette and key visual features in a way that would help create a simple outline/silhouette drawing. Focus on:
- Overall shape (t-shirt, hoodie, mug, bag, etc.)
- Key distinguishing features (collar, sleeves, handles, etc.)
- Simple geometric description
Keep it concise and focused on the outline shape only.`;

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        console.log('[Gemini Outline] AI Analysis:', text);
        return text;
    } catch (error) {
        console.error('[Gemini Outline] Gemini AI error:', error.message);
        return null;
    }
}

/**
 * Process image to create outline using edge detection
 */
async function createOutlineFromImage(imageBuffer) {
    console.log('[Gemini Outline] Creating outline using image processing...');
    
    try {
        // Process image to create outline effect
        const processedImage = await sharp(imageBuffer)
            .resize(2000, 2000, { 
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            // Convert to grayscale
            .grayscale()
            // Apply edge detection using modulate and threshold
            .modulate({ brightness: 1.2, saturation: 0 })
            .threshold(200)
            .negate()
            // Apply blur to smooth edges
            .blur(2)
            .toBuffer();

        // Convert to RGBA for transparency
        const outline = await sharp(processedImage)
            .ensureAlpha()
            .toFormat('png')
            .toBuffer();

        return outline;
    } catch (error) {
        console.error('[Gemini Outline] Image processing error:', error);
        throw error;
    }
}

/**
 * Generate a simple SVG outline based on product type
 */
function generateSimpleSVGOutline(productType = 'tshirt') {
    console.log(`[Gemini Outline] Generating simple SVG for ${productType}`);
    
    const svgTemplates = {
        tshirt: `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 2000 2000">
            <path d="M 600,400 L 500,600 L 500,1600 L 1500,1600 L 1500,600 L 1400,400 L 1200,500 L 1000,450 L 800,500 Z" 
                  fill="none" stroke="black" stroke-width="8"/>
        </svg>`,
        hoodie: `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 2000 2000">
            <path d="M 600,400 L 500,600 L 500,1600 L 1500,1600 L 1500,600 L 1400,400 L 1200,500 L 1100,300 L 900,300 L 800,500 Z" 
                  fill="none" stroke="black" stroke-width="8"/>
            <circle cx="1000" cy="400" r="150" fill="none" stroke="black" stroke-width="8"/>
        </svg>`,
        mug: `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 2000 2000">
            <rect x="600" y="600" width="600" height="800" rx="50" fill="none" stroke="black" stroke-width="8"/>
            <path d="M 1200,800 L 1400,800 Q 1500,800 1500,1000 Q 1500,1200 1400,1200 L 1200,1200" 
                  fill="none" stroke="black" stroke-width="8"/>
        </svg>`,
        bag: `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 2000 2000">
            <rect x="600" y="700" width="800" height="900" fill="none" stroke="black" stroke-width="8"/>
            <path d="M 700,700 Q 1000,500 1300,700" fill="none" stroke="black" stroke-width="8"/>
        </svg>`
    };

    return svgTemplates[productType] || svgTemplates.tshirt;
}

/**
 * Convert SVG to PNG using sharp
 */
async function svgToPng(svgString) {
    const svgBuffer = Buffer.from(svgString);
    return await sharp(svgBuffer)
        .resize(2000, 2000)
        .png()
        .toBuffer();
}

/**
 * Main function to generate product outline
 * @param {string} productImageUrl - URL of the product image from Printful
 * @param {string} productId - Product ID for caching
 * @param {string} productType - Type of product (tshirt, hoodie, mug, etc.)
 * @returns {Promise<Buffer>} - PNG buffer of the outline
 */
async function generateProductOutline(productImageUrl, productId, productType = 'tshirt') {
    console.log(`[Gemini Outline] Generating outline for product ${productId}`);
    
    try {
        // Fetch the product image
        const imageBuffer = await fetchImageBuffer(productImageUrl);
        
        // Try to analyze with Gemini if available
        let aiAnalysis = null;
        if (genAI) {
            aiAnalysis = await analyzeProductWithGemini(imageBuffer);
        }
        
        // Attempt to create outline from image processing
        try {
            const outline = await createOutlineFromImage(imageBuffer);
            return outline;
        } catch (imageError) {
            console.warn('[Gemini Outline] Image processing failed, falling back to SVG template');
            
            // Fallback to simple SVG
            const svgOutline = generateSimpleSVGOutline(productType);
            return await svgToPng(svgOutline);
        }
    } catch (error) {
        console.error('[Gemini Outline] Failed to generate outline:', error);
        
        // Ultimate fallback - simple SVG
        const svgOutline = generateSimpleSVGOutline(productType);
        return await svgToPng(svgOutline);
    }
}

/**
 * Save outline to disk
 */
async function saveOutlineToDisk(outlineBuffer, productId, outputDir) {
    const filename = `product-${productId}.png`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, outlineBuffer);
    console.log(`[Gemini Outline] Saved outline to: ${filepath}`);
    
    return filepath;
}

/**
 * Check if outline already exists
 */
async function outlineExists(productId, outputDir) {
    const filename = `product-${productId}.png`;
    const filepath = path.join(outputDir, filename);
    
    try {
        await fs.access(filepath);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    generateProductOutline,
    saveOutlineToDisk,
    outlineExists,
    analyzeProductWithGemini
};

