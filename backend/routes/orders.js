const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// Note: Stripe payment endpoints removed - now using Printful checkout

// @route   POST api/orders/create-order
// @desc    Create a new custom design order and submit to Printful
// @access  Private
router.post('/create-order', auth, async (req, res) => {
    const { productVariantId, syncVariantId, quantity = 1, design, shippingAddress, totalCost } = req.body;

    try {
        console.log(`[Custom Order] Creating custom design order for variant ${productVariantId || syncVariantId}`);
        
        // Check if API key is configured
        if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
            console.error('[Custom Order] PRINTFUL_API_KEY is not configured');
            return res.status(500).json({ message: 'PRINTFUL_API_KEY is not configured' });
        }
        // Prepare Printful order data for custom designs
        const items = [];
        if (syncVariantId) {
            items.push({
                sync_variant_id: syncVariantId,
                quantity: Number(quantity) || 1
            });
        } else if (productVariantId) {
            items.push({
                variant_id: productVariantId,
                quantity: Number(quantity) || 1,
                files: (design && design.files) ? design.files : []
            });
        } else {
            return res.status(400).json({ message: 'Either syncVariantId or productVariantId is required' });
        }

        const printfulOrderData = {
            external_id: `moodynick-custom-${Date.now()}-${req.user.id}`,
            shipping: 'STANDARD',
            recipient: {
                name: shippingAddress.name,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2 || '',
                city: shippingAddress.city,
                state_code: shippingAddress.state_code,
                country_code: shippingAddress.country_code,
                zip: shippingAddress.zip
            },
            items,
            retail_costs: {
                currency: 'USD',
                subtotal: totalCost || '0.00',
                discount: '0.00',
                shipping: '0.00', // Will be calculated by Printful
                tax: '0.00' // Will be calculated by Printful
            },
            gift: {
                subject: '',
                message: ''
            }
        };

        // Submit order to Printful
        console.log('[Custom Order] Submitting order to Printful:', JSON.stringify(printfulOrderData, null, 2));
        
        const printfulResponse = await fetch('https://api.printful.com/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            },
            body: JSON.stringify(printfulOrderData)
        });

        const printfulData = await printfulResponse.json();
        console.log('[Custom Order] Printful response status:', printfulResponse.status);
        console.log('[Custom Order] Printful response data:', JSON.stringify(printfulData, null, 2));

        if (!printfulResponse.ok) {
            console.error('[Custom Order] Printful order creation failed:', printfulData);
            return res.status(printfulResponse.status).json({ 
                message: 'Failed to create Printful order',
                error: printfulData 
            });
        }

        const printfulOrder = printfulData.result;
        
        // Save order to database with pending status
        const order = new Order({
            user: req.user.id,
            printfulOrderId: printfulOrder.id,
            productVariantId,
            syncVariantId,
            quantity: Number(quantity) || 1,
            design,
            shippingAddress,
            totalCost: printfulOrder.costs?.total || totalCost,
            status: 'pending_payment',
            orderType: 'custom_design'
        });

        await order.save();

        // Get checkout URL from Printful
        const checkoutUrl = `https://www.printful.com/checkout/${printfulOrder.id}`;
        
        console.log(`[Custom Order] ✓ Order created successfully. Checkout URL: ${checkoutUrl}`);

        res.json({ 
            success: true,
            order,
            printfulOrder,
            checkoutUrl
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST api/orders/create-store-order
// @desc    Create a new order for store products and get Printful checkout URL
// @access  Private
router.post('/create-store-order', auth, async (req, res) => {
    const { storeProductId, variantId, quantity = 1, shippingAddress } = req.body;

    try {
        console.log(`[Store Order] Creating order for store product ${storeProductId}, variant ${variantId}`);
        
        // Check if API key is configured
        if (!process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_KEY === 'your_printful_api_key_here') {
            console.error('[Store Order] PRINTFUL_API_KEY is not configured');
            return res.status(500).json({ message: 'PRINTFUL_API_KEY is not configured' });
        }

        // Prepare Printful order data for store products
        const printfulOrderData = {
            external_id: `moodynick-store-${Date.now()}-${req.user.id}`,
            shipping: 'STANDARD',
            recipient: {
                name: shippingAddress.name,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2 || '',
                city: shippingAddress.city,
                state_code: shippingAddress.state_code,
                country_code: shippingAddress.country_code,
                zip: shippingAddress.zip
            },
            items: [{
                sync_variant_id: variantId,
                quantity: Number(quantity) || 1
            }],
            retail_costs: {
                currency: 'USD',
                subtotal: '0.00', // Will be calculated by Printful
                discount: '0.00',
                shipping: '0.00', // Will be calculated by Printful
                tax: '0.00' // Will be calculated by Printful
            },
            gift: {
                subject: '',
                message: ''
            }
        };

        console.log('[Store Order] Submitting order to Printful:', JSON.stringify(printfulOrderData, null, 2));
        
        // Submit order to Printful
        const printfulResponse = await fetch('https://api.printful.com/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            },
            body: JSON.stringify(printfulOrderData)
        });

        const printfulData = await printfulResponse.json();
        console.log('[Store Order] Printful response status:', printfulResponse.status);
        console.log('[Store Order] Printful response data:', JSON.stringify(printfulData, null, 2));

        if (!printfulResponse.ok) {
            console.error('[Store Order] Printful order creation failed:', printfulData);
            return res.status(printfulResponse.status).json({ 
                message: 'Failed to create Printful order',
                error: printfulData 
            });
        }

        const printfulOrder = printfulData.result;
        
        // Save order to database with pending status
        const order = new Order({
            user: req.user.id,
            printfulOrderId: printfulOrder.id,
            storeProductId,
            variantId,
            quantity: Number(quantity) || 1,
            shippingAddress,
            totalCost: printfulOrder.costs?.total || '0.00',
            status: 'pending_payment',
            orderType: 'store_product'
        });

        await order.save();

        // Get checkout URL from Printful
        const checkoutUrl = `https://www.printful.com/checkout/${printfulOrder.id}`;
        
        console.log(`[Store Order] ✓ Order created successfully. Checkout URL: ${checkoutUrl}`);

        res.json({ 
            success: true,
            order,
            printfulOrder,
            checkoutUrl
        });
    } catch (error) {
        console.error('[Store Order] Error creating store order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST api/orders/printful-webhook
// @desc    Handle webhook notifications from Printful
// @access  Public (but should verify webhook signature)
router.post('/printful-webhook', async (req, res) => {
    try {
        console.log('[Webhook] Received Printful webhook:', JSON.stringify(req.body, null, 2));
        
        const { type, data } = req.body;
        
        if (type === 'order_updated') {
            const { order } = data;
            const printfulOrderId = order.id;
            
            console.log(`[Webhook] Order ${printfulOrderId} updated. Status: ${order.status}`);
            
            // Find the order in our database
            const dbOrder = await Order.findOne({ printfulOrderId });
            
            if (dbOrder) {
                // Update order status based on Printful status
                let newStatus = 'pending_payment';
                
                switch (order.status) {
                    case 'draft':
                        newStatus = 'pending_payment';
                        break;
                    case 'pending':
                        newStatus = 'paid';
                        break;
                    case 'failed':
                        newStatus = 'failed';
                        break;
                    case 'canceled':
                        newStatus = 'cancelled';
                        break;
                    case 'onhold':
                        newStatus = 'on_hold';
                        break;
                    case 'inprocess':
                        newStatus = 'processing';
                        break;
                    case 'fulfilled':
                        newStatus = 'fulfilled';
                        break;
                    case 'returned':
                        newStatus = 'returned';
                        break;
                    default:
                        newStatus = order.status;
                }
                
                // Update the order
                dbOrder.status = newStatus;
                dbOrder.totalCost = order.costs?.total || dbOrder.totalCost;
                await dbOrder.save();
                
                console.log(`[Webhook] ✓ Updated order ${printfulOrderId} status to ${newStatus}`);
            } else {
                console.log(`[Webhook] Order ${printfulOrderId} not found in database`);
            }
        }
        
        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('[Webhook] Error processing webhook:', error);
        res.status(500).json({ message: 'Webhook processing error', error: error.message });
    }
});

// @route   GET api/orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
