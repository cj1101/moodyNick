# Printful API Integration Notes

## API Response Structure

All Printful API responses follow this structure:

```json
{
  "code": 200,
  "result": {
    // Actual data here
  }
}
```

Or for arrays:

```json
{
  "code": 200,
  "result": [
    // Array of items
  ]
}
```

## Implemented Endpoints

### 1. Get Products (`GET /products`)
**Backend:** `backend/routes/catalog.js`

```javascript
// Correct implementation - extracts result array
const response = await fetch('https://api.printful.com/products', {
  headers: {
    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
  }
});
const data = await response.json();
// Send only data.result to frontend
res.json(data.result);
```

**Response Structure:**
```json
{
  "code": 200,
  "result": [
    {
      "id": 71,
      "type": "T-SHIRT",
      "type_name": "T-Shirt",
      "title": "Unisex Staple T-Shirt",
      "brand": "Bella + Canvas",
      "model": "3001",
      "image": "https://...",
      "variant_count": 396,
      "currency": "USD",
      "files": [...],
      "options": [...],
      "is_discontinued": false,
      "description": "..."
    }
  ]
}
```

### 2. Create Mockup Task (`POST /mockup-generator/create-task/{product_id}`)
**Backend:** `backend/routes/mockups.js`

```javascript
const createTaskResponse = await fetch('https://api.printful.com/mockup-generator/create-task/71', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
  },
  body: JSON.stringify({
    variant_ids: [4012, 4013],
    format: 'jpg',
    files: [
      {
        placement: 'front',
        image_url: 'https://...',
        position: { area_width: 1800, area_height: 2400, width: 1800, height: 1800, top: 300, left: 0 }
      }
    ]
  })
});

const data = await createTaskResponse.json();
const taskKey = data.result.task_key; // Extract task_key from result
```

### 3. Get Mockup Task Result (`GET /mockup-generator/task?task_key={key}`)
**Backend:** `backend/routes/mockups.js`

```javascript
const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
  }
});

const resultData = await resultResponse.json();
// Check status: 'pending', 'completed', 'failed'
if (resultData.result.status === 'completed') {
  const mockups = resultData.result.mockups;
}
```

### 4. Create Order (`POST /orders`)
**Backend:** `backend/routes/orders.js`

```javascript
const printfulResponse = await fetch('https://api.printful.com/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
  },
  body: JSON.stringify({
    recipient: {
      name: "John Doe",
      address1: "123 Main St",
      city: "New York",
      state_code: "NY",
      country_code: "US",
      zip: "10001"
    },
    items: [
      {
        variant_id: 4012,
        quantity: 1,
        files: [
          {
            url: "https://..."
          }
        ]
      }
    ]
  })
});

const printfulData = await printfulResponse.json();
const orderId = printfulData.result.id; // Extract order ID from result
```

## Common Patterns

### Always Extract `result`
```javascript
const response = await fetch('https://api.printful.com/...');
const data = await response.json();

// ✅ CORRECT - Access data.result
const actualData = data.result;

// ❌ WRONG - Don't use data directly
// const actualData = data;
```

### Error Handling
```javascript
const response = await fetch('https://api.printful.com/...');
const data = await response.json();

if (!response.ok || data.code !== 200) {
  console.error('Printful API error:', data);
  return res.status(response.status).json({ 
    message: 'Printful API error',
    error: data 
  });
}

// Use data.result for success
res.json(data.result);
```

## Authentication

All authenticated endpoints require the Bearer token:

```javascript
headers: {
  'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
}
```

Get your API key from: https://www.printful.com/dashboard/store

## Rate Limiting

- **Catalog API (unauthenticated):** 30 requests per 60 seconds
- **Shipping Rate API:** 120 requests per 60 seconds (5 if >100 items)
- **Other endpoints:** Standard rate limits apply

## Important Notes

1. **Always use Variant IDs, not Product IDs** when creating orders or mockups
2. **File URLs must be publicly accessible** - Printful needs to download them
3. **Mockup generation is asynchronous** - poll the task endpoint for results
4. **Jewelry products are not supported** via API
5. **Test orders** can be created with `confirm: false` parameter

## Testing

Use test mode by setting `confirm: false` in order creation:

```javascript
{
  recipient: {...},
  items: [...],
  confirm: false  // Creates draft order only
}
```

## Resources

- **API Documentation:** https://developers.printful.com/docs/
- **OpenAPI Spec:** Available in `openapi.json`
- **Postman Collection:** Download from Printful docs
- **Developer Support:** https://developers.printful.com/docs/#tag/Other-resources/Developer-support

---

**Last Updated:** 2025-09-29
