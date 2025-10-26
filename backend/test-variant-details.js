require('dotenv').config();

async function testVariantDetails() {
  try {
    console.log('Testing Printful variant details...');
    
    // Test getting variant details for a specific variant
    const variantId = 4011; // White S variant from the list
    
    const response = await fetch(`https://api.printful.com/products/variant/${variantId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log(`Variant ${variantId} details:`);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.result && data.result.product && data.result.product.files) {
      console.log('\nExtracted file info:');
      data.result.product.files.forEach((file, index) => {
        console.log(`${index + 1}. File: ${file.title || 'unknown'}`);
        console.log(`   Type: ${file.type || 'unknown'}`);
        console.log(`   Dimensions: ${file.width || 'unknown'}x${file.height || 'unknown'}`);
        console.log(`   URL: ${file.url || 'unknown'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVariantDetails();
