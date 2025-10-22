require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Test script to fetch blank 2D product images for product 71 variants
 * 
 * IMPORTANT: The Printful Mockup Generator API is designed for creating mockups WITH artwork.
 * This script fetches product catalog images instead, which show blank products.
 * 
 * Note: Product catalog images are often shared across color variants of the same product.
 * For variant-specific mockups showing exact colors, you would need to use the mockup
 * generator with a transparent/blank artwork file hosted on a public URL.
 * 
 * Usage:
 *   node test-mockup-generation.js              // Lists all variants
 *   node test-mockup-generation.js <variant_id> // Fetches image for specific variant
 *   node test-mockup-generation.js all          // Fetches images for all variants
 */

const PRODUCT_ID = 71; // Bella + Canvas 3001 Unisex Short Sleeve Jersey T-Shirt with Tear Away Label

// Fetch product info including all variants
async function getProductVariants() {
    console.log(`Fetching product ${PRODUCT_ID} information...`);
    
    const response = await fetch(`https://api.printful.com/products/${PRODUCT_ID}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch product info: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.result;
}

// Get mockup templates for the product
async function getMockupTemplates() {
    console.log('Fetching mockup templates...');
    
    const response = await fetch(`https://api.printful.com/mockup-generator/templates/${PRODUCT_ID}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch mockup templates: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.result;
}

// Get available print files (templates) for the product
async function getPrintFiles() {
    console.log('Fetching available print files for product...');
    
    const response = await fetch(`https://api.printful.com/mockup-generator/printfiles/${PRODUCT_ID}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch print files: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.result;
}

// Get variant information including product images (blank mockups)
async function getVariantInfo(variantId) {
    console.log('Fetching variant information including product images...');
    
    const response = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch variant info: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.result;
}

// "Generate" a blank mockup by fetching product catalog images
async function generateBlankMockup(variantId) {
    console.log(`\nFetching blank product images for variant ${variantId}...`);
    console.log('Note: The Printful API does not support generating truly blank mockups.');
    console.log('Instead, we will fetch the product catalog images which show the blank product.\n');
    
    // Get variant info which includes product images
    const variantInfo = await getVariantInfo(variantId);
    
    if (!variantInfo || !variantInfo.variant) {
        throw new Error('Could not fetch variant information');
    }
    
    const variant = variantInfo.variant;
    const product = variantInfo.product;
    
    console.log(`Product: ${product.title}`);
    console.log(`Variant: ${variant.name} (Color: ${variant.color}, Size: ${variant.size})`);
    
    // Extract product images (these are blank mockups)
    const mockups = [];
    
    if (product.image) {
        mockups.push({
            mockup_url: product.image,
            placement: 'main',
            variant_ids: [variantId]
        });
    }
    
    // Add all available images
    if (product.images && product.images.length > 0) {
        product.images.forEach((imageUrl, index) => {
            mockups.push({
                mockup_url: imageUrl,
                placement: `view_${index + 1}`,
                variant_ids: [variantId]
            });
        });
    }
    
    if (mockups.length === 0) {
        throw new Error('No product images available for this variant');
    }
    
    console.log(`Found ${mockups.length} product image(s)`);
    
    // Return in the same format as mockup generator would
    return {
        mockups: mockups,
        status: 'completed'
    };
}

// Save mockup images to disk
async function saveMockupImages(mockupResult, variantId) {
    const outputDir = path.join(__dirname, 'test-mockups');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\nSaving product images to ${outputDir}...`);
    
    for (const mockup of mockupResult.mockups) {
        const variantName = mockup.variant_ids.join('-');
        const placementName = mockup.placement || 'default';
        
        // Determine file extension from URL
        const url = mockup.mockup_url;
        const ext = url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] || 'jpg';
        
        const filename = `variant-${variantName}-${placementName}.${ext}`;
        const filepath = path.join(outputDir, filename);
        
        // Download and save the mockup image
        console.log(`  Downloading: ${url}`);
        const imageResponse = await fetch(mockup.mockup_url);
        
        if (!imageResponse.ok) {
            console.log(`  ✗ Failed to download: ${filename}`);
            continue;
        }
        
        const buffer = await imageResponse.arrayBuffer();
        
        fs.writeFileSync(filepath, Buffer.from(buffer));
        console.log(`  ✓ Saved: ${filename}`);
        console.log(`    Placement: ${mockup.placement || 'N/A'}`);
    }
}

// Main execution
async function main() {
    try {
        // Check for API key
        if (!process.env.PRINTFUL_API_KEY) {
            console.error('ERROR: PRINTFUL_API_KEY not found in environment variables');
            console.error('Please ensure your .env file contains PRINTFUL_API_KEY');
            process.exit(1);
        }

        const args = process.argv.slice(2);
        const productInfo = await getProductVariants();
        
        console.log(`\nProduct: ${productInfo.product.name}`);
        console.log(`Total Variants: ${productInfo.variants.length}\n`);

        // If no arguments, list all variants
        if (args.length === 0) {
            console.log('Available Variants:');
            console.log('='.repeat(80));
            
            productInfo.variants.forEach(variant => {
                console.log(`ID: ${variant.id.toString().padEnd(10)} | ${variant.name}`);
                console.log(`  Color: ${variant.color || 'N/A'} | Size: ${variant.size || 'N/A'}`);
                console.log(`  Availability: ${variant.availability_status || 'N/A'}`);
                console.log('-'.repeat(80));
            });
            
            console.log('\nUsage:');
            console.log('  node test-mockup-generation.js <variant_id>  // Generate mockup for specific variant');
            console.log('  node test-mockup-generation.js all            // Generate mockups for all variants');
            console.log('\nExample:');
            console.log(`  node test-mockup-generation.js ${productInfo.variants[0].id}`);
            
            return;
        }

        // Generate mockups
        const variantArg = args[0];
        
        if (variantArg === 'all') {
            console.log('\nGenerating mockups for ALL variants...');
            console.log('This may take several minutes...\n');
            
            for (let i = 0; i < productInfo.variants.length; i++) {
                const variant = productInfo.variants[i];
                console.log(`\n[${i + 1}/${productInfo.variants.length}] Processing variant ${variant.id}: ${variant.name}`);
                
                try {
                    const mockupResult = await generateBlankMockup(variant.id);
                    await saveMockupImages(mockupResult, variant.id);
                } catch (error) {
                    console.error(`  ✗ Failed for variant ${variant.id}: ${error.message}`);
                }
                
                // Add delay between requests to avoid rate limiting
                if (i < productInfo.variants.length - 1) {
                    console.log('  Waiting 3 seconds before next variant...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            console.log('\n✓ Completed fetching product images for all variants');
        } else {
            // Generate mockup for specific variant
            const variantId = parseInt(variantArg);
            
            if (isNaN(variantId)) {
                console.error('ERROR: Invalid variant ID. Must be a number.');
                process.exit(1);
            }
            
            // Verify variant exists
            const variant = productInfo.variants.find(v => v.id === variantId);
            if (!variant) {
                console.error(`ERROR: Variant ${variantId} not found for product ${PRODUCT_ID}`);
                console.log('\nRun without arguments to see available variants:');
                console.log('  node test-mockup-generation.js');
                process.exit(1);
            }
            
            console.log(`Variant Info: ${variant.name}`);
            console.log(`  Color: ${variant.color || 'N/A'}`);
            console.log(`  Size: ${variant.size || 'N/A'}`);
            
            const mockupResult = await generateBlankMockup(variantId);
            await saveMockupImages(mockupResult, variantId);
            
            console.log('\n✓ Product image fetched successfully!');
        }
        
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        process.exit(1);
    }
}

// Run the script
main();

