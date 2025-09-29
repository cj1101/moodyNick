const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// @route   POST api/orders/create-payment-intent
// @desc    Create a payment intent
// @access  Private
router.post('/create-payment-intent', auth, async (req, res) => {
    const { amount } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd'
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/orders/create-order
// @desc    Create a new order and submit to Printful
// @access  Private
router.post('/create-order', auth, async (req, res) => {
    const { productVariantId, design, shippingAddress, totalCost, paymentIntentId } = req.body;

    try {
        // Prepare Printful order data
        const printfulOrderData = {
            recipient: {
                name: shippingAddress.name,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2 || '',
                city: shippingAddress.city,
                state_code: shippingAddress.state_code,
                country_code: shippingAddress.country_code,
                zip: shippingAddress.zip
            },
            items: [
                {
                    variant_id: productVariantId,
                    quantity: 1,
                    files: design.files || []
                }
            ]
        };

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

        if (!printfulResponse.ok) {
            console.error('Printful order creation failed:', printfulData);
            return res.status(printfulResponse.status).json({ 
                message: 'Failed to create Printful order',
                error: printfulData 
            });
        }

        // Save order to database
        const order = new Order({
            user: req.user.id,
            printfulOrderId: printfulData.result.id,
            productVariantId,
            design,
            shippingAddress,
            totalCost,
            stripePaymentIntentId: paymentIntentId,
            status: 'confirmed'
        });

        await order.save();

        res.json({ 
            success: true,
            order,
            printfulOrder: printfulData.result 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
