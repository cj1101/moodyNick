require('dotenv').config();

/**
 * Quick test script to verify outline generation works
 * 
 * Usage:
 *   node test-outline-generation.js
 */

async function testOutlineGeneration() {
    const BASE_URL = 'http://localhost:5000';
    const PRODUCT_ID = '71'; // Bella + Canvas T-Shirt
    
    console.log('🧪 Testing Product Outline Generation System\n');
    console.log('=' .repeat(60));
    
    // Test 1: Check initial status
    console.log('\n📊 Test 1: Checking outline status...');
    try {
        const statusRes = await fetch(`${BASE_URL}/api/outlines/status`);
        const statusData = await statusRes.json();
        console.log(`✓ Status endpoint working`);
        console.log(`  - Total outlines: ${statusData.summary.totalProducts}`);
        console.log(`  - Generated: ${statusData.summary.generatedCount}`);
    } catch (error) {
        console.error(`✗ Status check failed:`, error.message);
        console.error(`  Make sure backend is running on ${BASE_URL}`);
        return;
    }
    
    // Test 2: Try to get outline (should fail if not generated yet)
    console.log(`\n🖼️  Test 2: Attempting to fetch outline for product ${PRODUCT_ID}...`);
    try {
        const getRes = await fetch(`${BASE_URL}/api/outlines/${PRODUCT_ID}`);
        if (getRes.ok) {
            console.log(`✓ Outline already exists for product ${PRODUCT_ID}`);
            console.log(`  URL: ${BASE_URL}/api/outlines/${PRODUCT_ID}`);
        } else {
            console.log(`ℹ️  Outline not found (expected on first run)`);
        }
    } catch (error) {
        console.error(`✗ Fetch failed:`, error.message);
    }
    
    // Test 3: Generate outline
    console.log(`\n⚙️  Test 3: Generating outline for product ${PRODUCT_ID}...`);
    console.log(`  This may take 5-10 seconds...`);
    try {
        const generateRes = await fetch(`${BASE_URL}/api/outlines/generate/${PRODUCT_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (!generateRes.ok) {
            const errorData = await generateRes.json();
            console.error(`✗ Generation failed:`, errorData.message);
            console.error(`  Error:`, errorData.error);
            return;
        }
        
        const generateData = await generateRes.json();
        console.log(`✓ Outline generated successfully!`);
        console.log(`  - Product Type: ${generateData.productType}`);
        console.log(`  - Cached: ${generateData.cached}`);
        console.log(`  - URL: ${generateData.url}`);
        console.log(`  - AI Analysis: ${generateData.aiAnalysis || 'N/A'}`);
    } catch (error) {
        console.error(`✗ Generation failed:`, error.message);
        return;
    }
    
    // Test 4: Verify outline can be fetched
    console.log(`\n✅ Test 4: Verifying outline is accessible...`);
    try {
        const verifyRes = await fetch(`${BASE_URL}/api/outlines/${PRODUCT_ID}`);
        if (verifyRes.ok) {
            console.log(`✓ Outline is accessible`);
            console.log(`  Open in browser: ${BASE_URL}/api/outlines/${PRODUCT_ID}`);
        } else {
            console.error(`✗ Outline not accessible after generation`);
        }
    } catch (error) {
        console.error(`✗ Verification failed:`, error.message);
    }
    
    // Test 5: Check updated status
    console.log(`\n📊 Test 5: Checking updated status...`);
    try {
        const statusRes = await fetch(`${BASE_URL}/api/outlines/status`);
        const statusData = await statusRes.json();
        console.log(`✓ Status updated`);
        console.log(`  - Total outlines: ${statusData.summary.totalProducts}`);
        console.log(`  - Generated: ${statusData.summary.generatedCount}`);
        if (statusData.generatedProductIds.includes(PRODUCT_ID)) {
            console.log(`  ✓ Product ${PRODUCT_ID} is in the list`);
        }
    } catch (error) {
        console.error(`✗ Status check failed:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Open browser to: http://localhost:3000/design/71/4012');
    console.log('2. You should see a faint t-shirt outline');
    console.log('3. "Generate Mockup" button should be grayed out');
    console.log('4. Add artwork from sidebar');
    console.log('5. Button should become blue and clickable');
    console.log('6. Click to generate mockup with your design');
}

// Check environment
if (!process.env.PRINTFUL_API_KEY) {
    console.error('❌ ERROR: PRINTFUL_API_KEY not found in environment');
    console.error('Please ensure .env file contains PRINTFUL_API_KEY');
    process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment');
    console.warn('Outline generation will work but without AI analysis');
    console.warn('Add GEMINI_API_KEY to .env for AI-powered analysis');
}

// Run tests
testOutlineGeneration().catch(error => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
});

