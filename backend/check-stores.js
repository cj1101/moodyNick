require('dotenv').config();

async function checkStores() {
  console.log('\n=== Checking Printful Store Access ===\n');
  
  const apiKey = process.env.PRINTFUL_API_KEY;
  const currentStoreId = process.env.PRINTFUL_STORE_ID;
  
  if (!apiKey) {
    console.error('❌ PRINTFUL_API_KEY not found in .env file');
    return;
  }
  
  console.log('✅ API Key found');
  console.log('📋 Current Store ID in .env:', currentStoreId || 'NOT SET');
  console.log('\n🔍 Fetching stores accessible by this API key...\n');
  
  try {
    const response = await fetch('https://api.printful.com/stores', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const data = await response.json();
    
    if (data.code === 200 && data.result) {
      console.log('✅ Found', data.result.length, 'store(s):\n');
      
      data.result.forEach((store, index) => {
        const isCurrent = store.id.toString() === currentStoreId;
        const marker = isCurrent ? '👉 CURRENT' : '  ';
        
        console.log(`${marker} Store #${index + 1}:`);
        console.log(`   ID: ${store.id}`);
        console.log(`   Name: ${store.name || 'Unnamed'}`);
        console.log(`   Type: ${store.type}`);
        console.log(`   Currency: ${store.currency}`);
        console.log('');
      });
      
      if (data.result.length > 0) {
        const firstStore = data.result[0];
        console.log('\n💡 To use the first store, add this to your .env file:');
        console.log(`   PRINTFUL_STORE_ID=${firstStore.id}`);
        
        if (currentStoreId && !data.result.find(s => s.id.toString() === currentStoreId)) {
          console.log('\n⚠️  WARNING: Your current PRINTFUL_STORE_ID is not in the list above!');
          console.log('   This is why you\'re getting the "Store not found" error.');
        }
      } else {
        console.log('⚠️  No stores found. You need to create a store first:');
        console.log('   https://www.printful.com/dashboard/store');
      }
    } else {
      console.error('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Error fetching stores:', error.message);
  }
}

checkStores();
