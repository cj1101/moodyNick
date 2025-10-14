/**
 * Product Outline Generator using Google Gemini (Imagen 3)
 * 
 * This script automatically generates product outline images using Google's Gemini API.
 * Gemini Imagen 3 is cost-effective and produces high-quality images.
 * 
 * Setup:
 * 1. Get API key from: https://aistudio.google.com/app/apikey
 * 2. Set environment variable: GEMINI_API_KEY=your_key_here
 * 3. Run: node scripts/generate-outlines-gemini.js
 * 
 * Cost (as of October 2025):
 * - Imagen 3: ~$0.04 per image (1024x1024)
 * - Total for 14 products: ~$0.56
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Attempt to load GEMINI_API_KEY from common .env locations if not already in process.env
const envCandidates = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../frontend/.env'),
  path.join(__dirname, '../backend/.env')
];

envCandidates.forEach((envPath) => {
  const result = dotenv.config({ path: envPath, override: false });
  if (result.error && result.error.code !== 'ENOENT') {
    console.warn(`⚠️  Could not load environment file: ${envPath}`, result.error.message);
  }
});

// Product definitions matching productOutlines.ts
const products = [
  // Apparel
  {
    id: '71',
    name: 'Unisex Staple T-Shirt',
    filename: 'unisex-staple-tshirt.png',
    prompt: 'Simple black outline silhouette of a unisex crew neck t-shirt, front view, centered, transparent background, minimalist line art style, clean edges, no shading, no texture, no details, short sleeves'
  },
  {
    id: '19',
    name: 'Heavy Cotton Tee',
    filename: 'heavy-cotton-tee.png',
    prompt: 'Simple black outline of a classic cotton t-shirt, front view, centered, transparent background, minimalist line drawing, crew neck, short sleeves, no shading, no details'
  },
  {
    id: '380',
    name: 'Garment-Dyed T-Shirt',
    filename: 'garment-dyed-tshirt.png',
    prompt: 'Clean outline silhouette of a relaxed fit t-shirt, front view, transparent background, simple black line art, crew neck, short sleeves, minimalist style, no shading'
  },
  {
    id: '146',
    name: 'Heavy Blend Hoodie',
    filename: 'heavy-blend-hoodie.png',
    prompt: 'Simple black outline of a pullover hoodie with hood, front view, centered, transparent background, minimalist line art, kangaroo pocket, drawstrings, no shading, no texture, clean edges'
  },
  {
    id: '387',
    name: 'Heavy Blend Crewneck Sweatshirt',
    filename: 'heavy-blend-crewneck.png',
    prompt: 'Simple outline of a crewneck sweatshirt, front view, transparent background, black line art, ribbed collar and cuffs, long sleeves, minimalist style, no shading, no details'
  },
  {
    id: '679',
    name: 'Sports Jersey',
    filename: 'sports-jersey.png',
    prompt: 'Clean outline of an athletic sports jersey, front view, transparent background, simple black line art, sleeveless, minimalist style, no shading, no numbers, no details'
  },
  
  // Accessories
  {
    id: '163',
    name: 'Tote Bag',
    filename: 'tote-bag.png',
    prompt: 'Simple black outline of a canvas tote bag, front view, centered, transparent background, minimalist line art, two handles at top, rectangular shape, no shading, no texture'
  },
  {
    id: '327',
    name: 'Large Organic Tote Bag',
    filename: 'large-organic-tote.png',
    prompt: 'Simple outline of a large tote bag, front view, transparent background, black line art, two handles, tall rectangular shape, minimalist style, no shading, no details'
  },
  {
    id: '45',
    name: 'iPhone Case',
    filename: 'iphone-case.png',
    prompt: 'Simple black outline of an iPhone case, front view, centered, transparent background, minimalist line art, rounded corners, camera cutout at top, clean edges, no shading'
  },
  {
    id: '46',
    name: 'Samsung Case',
    filename: 'samsung-case.png',
    prompt: 'Simple outline of a Samsung phone case, front view, transparent background, black line art, rounded corners, camera cutout, minimalist style, no shading, clean edges'
  },
  
  // Home & Living
  {
    id: '20',
    name: 'White Glossy Mug',
    filename: 'white-glossy-mug.png',
    prompt: 'Simple black outline of a coffee mug, side view showing handle, centered, transparent background, minimalist line art, cylindrical shape with handle, no shading, no details, clean edges'
  },
  {
    id: '21',
    name: 'Black Glossy Mug',
    filename: 'black-glossy-mug.png',
    prompt: 'Simple outline of a ceramic mug, side view with handle visible, transparent background, black line art, cylindrical body, curved handle, minimalist style, no shading'
  },
  
  // Stationery
  {
    id: '1',
    name: 'Poster',
    filename: 'poster.png',
    prompt: 'Simple black outline of a rectangular poster, front view, centered, transparent background, minimalist line art, portrait orientation, clean edges, no frame, no shading'
  },
  {
    id: '2',
    name: 'Framed Poster',
    filename: 'framed-poster.png',
    prompt: 'Simple outline of a framed poster, front view, transparent background, black line art, rectangular frame with mat border, portrait orientation, minimalist style, no shading, clean edges'
  }
];

/**
 * Generate a single product outline using Gemini Imagen 3
 */
async function generateOutline(product, apiKey) {
  console.log(`\n🎨 Generating: ${product.name} (${product.filename})`);
  console.log(`   Prompt: ${product.prompt.substring(0, 80)}...`);
  
  try {
    // Gemini Imagen 3 API endpoint
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict';
    
    const requestBody = {
      instances: [{
        prompt: product.prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1', // Square image
        negativePrompt: 'person, human, model, background, color, shading, gradient, texture, realistic, photo, 3d, detailed',
        safetyFilterLevel: 'block_some',
        personGeneration: 'dont_allow'
      }
    };

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract base64 image from response
    if (!data.predictions || !data.predictions[0] || !data.predictions[0].bytesBase64Encoded) {
      throw new Error('No image data in response');
    }

    const imageBase64 = data.predictions[0].bytesBase64Encoded;
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Save to file
    const outputDir = path.join(__dirname, '../frontend/public/product-outlines');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, product.filename);
    await fs.writeFile(outputPath, imageBuffer);
    
    console.log(`   ✅ Saved: ${outputPath}`);
    console.log(`   📦 Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    return { success: true, product: product.name };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, product: product.name, error: error.message };
  }
}

/**
 * Generate all product outlines
 */
async function generateAllOutlines() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Product Outline Generator - Google Gemini (Imagen 3)    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('\n❌ Error: GEMINI_API_KEY environment variable not set');
    console.log('\n📝 Setup Instructions:');
    console.log('   1. Get API key: https://aistudio.google.com/app/apikey');
    console.log('   2. Set environment variable:');
    console.log('      Windows: set GEMINI_API_KEY=your_key_here');
    console.log('      Mac/Linux: export GEMINI_API_KEY=your_key_here');
    console.log('   3. Run: node scripts/generate-outlines-gemini.js');
    process.exit(1);
  }

  console.log(`\n📊 Products to generate: ${products.length}`);
  console.log(`💰 Estimated cost: ~$${(products.length * 0.04).toFixed(2)} USD`);
  console.log(`⏱️  Estimated time: ~${products.length * 10} seconds\n`);

  const results = [];
  
  // Generate outlines sequentially (to avoid rate limits)
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n[${i + 1}/${products.length}] Processing: ${product.name}`);
    
    const result = await generateOutline(product, apiKey);
    results.push(result);
    
    // Wait 2 seconds between requests to avoid rate limits
    if (i < products.length - 1) {
      console.log('   ⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Generation Summary                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${products.length}`);
  console.log(`❌ Failed: ${failed}/${products.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed products:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.product}: ${r.error}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n✅ Next Steps:');
    console.log('   1. Check generated images in: frontend/public/product-outlines/');
    console.log('   2. Review quality and transparency');
    console.log('   3. Start dev server: cd frontend && npm run dev');
    console.log('   4. Test on design page: http://localhost:3000/design/71');
    console.log('   5. Adjust scaleFactor in productOutlines.ts if needed');
  }
  
  console.log('\n🎉 Generation complete!\n');
}

// Run the generator
generateAllOutlines().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
