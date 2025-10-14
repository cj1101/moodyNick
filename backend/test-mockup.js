/**
 * Test script to verify Printful mockup generation
 * 
 * This script tests:
 * 1. Fetching variant information
 * 2. Creating a blank mockup task
 * 3. Polling for mockup completion
 * 
 * Usage: node test-mockup.js <variantId>
 * Example: node test-mockup.js 4012
 */

require('dotenv').config();

const variantId = process.argv[2] || '4012'; // Default to common T-shirt variant

async function testMockupGeneration() {
  console.log('\n========== MOCKUP GENERATION TEST ==========');
  console.log('Testing with variant ID:', variantId);
  console.log('Timestamp:', new Date().toISOString());
  
  // Check environment variables
  if (!process.env.PRINTFUL_API_KEY) {
    console.error('❌ PRINTFUL_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  console.log('✓ PRINTFUL_API_KEY found');
  if (process.env.PRINTFUL_STORE_ID) {
    console.log('✓ PRINTFUL_STORE_ID found:', process.env.PRINTFUL_STORE_ID);
  } else {
    console.log('⚠ PRINTFUL_STORE_ID not set (optional)');
  }
  
  try {
    // Step 1: Fetch variant information
    console.log('\n--- Step 1: Fetching Variant Information ---');
    const variantResponse = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    
    if (!variantResponse.ok) {
      const errorText = await variantResponse.text();
      console.error('❌ Failed to fetch variant:', variantResponse.status);
      console.error('Error:', errorText);
      process.exit(1);
    }
    
    const variantData = await variantResponse.json();
    const variant = variantData.result.variant;
    const productId = variant.product_id;
    
    console.log('✓ Variant found:');
    console.log('  - Variant ID:', variant.id);
    console.log('  - Variant Name:', variant.name);
    console.log('  - Product ID:', productId);
    console.log('  - Product Name:', variantData.result.product?.name);
    
    // Step 2: Create mockup generation task
    console.log('\n--- Step 2: Creating Blank Mockup Task ---');
    
    // Create a 1x1 transparent PNG as blank design
    const blankDesign = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const mockupRequest = {
      variant_ids: [parseInt(variantId)],
      format: 'png',
      files: [
        {
          placement: 'front',
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
    
    console.log('Request payload:', JSON.stringify(mockupRequest, null, 2));
    
    const headers = {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    if (process.env.PRINTFUL_STORE_ID) {
      headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
    }
    
    const createTaskUrl = `https://api.printful.com/mockup-generator/create-task/${productId}`;
    console.log('Creating task at:', createTaskUrl);
    
    const createTaskResponse = await fetch(createTaskUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(mockupRequest)
    });
    
    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error('❌ Failed to create mockup task:', createTaskResponse.status);
      console.error('Error:', errorText);
      process.exit(1);
    }
    
    const taskData = await createTaskResponse.json();
    const taskKey = taskData.result.task_key;
    
    console.log('✓ Task created successfully');
    console.log('  - Task Key:', taskKey);
    
    // Step 3: Poll for mockup completion
    console.log('\n--- Step 3: Polling for Mockup Completion ---');
    
    let mockupUrl = null;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!mockupUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
      
      const resultHeaders = {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      };
      
      if (process.env.PRINTFUL_STORE_ID) {
        resultHeaders['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
      }
      
      const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
        headers: resultHeaders
      });
      
      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        const status = resultData.result.status;
        
        console.log(`Poll attempt ${attempts}/${maxAttempts}: status=${status}`);
        
        if (status === 'completed') {
          mockupUrl = resultData.result.mockups?.[0]?.mockup_url;
          console.log('✓ Mockup generated successfully!');
          console.log('  - Mockup URL:', mockupUrl);
          break;
        } else if (status === 'failed') {
          console.error('❌ Mockup generation failed');
          console.error('Result:', JSON.stringify(resultData.result, null, 2));
          process.exit(1);
        }
      } else {
        console.error(`⚠ Poll request failed: ${resultResponse.status}`);
      }
    }
    
    if (!mockupUrl) {
      console.error('❌ Mockup generation timed out after', maxAttempts, 'attempts');
      process.exit(1);
    }
    
    console.log('\n========== TEST COMPLETED SUCCESSFULLY ==========');
    console.log('✓ All tests passed!');
    console.log('✓ Mockup URL:', mockupUrl);
    console.log('\nYou can view the mockup at the URL above.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH EXCEPTION');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMockupGeneration();

