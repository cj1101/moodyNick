const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    printfulOrderId: {
        type: String,
        required: true
    },
    productVariantId: {
        type: Number,
        required: false
    },
    syncVariantId: {
        type: Number,
        required: false
    },
    quantity: {
        type: Number,
        default: 1
    },
    design: {
        type: Object,
        required: false
    },
    shippingAddress: {
        name: { type: String, required: true },
        address1: { type: String, required: true },
        address2: String,
        city: { type: String, required: true },
        state_code: { type: String, required: true },
        country_code: { type: String, required: true },
        zip: { type: String, required: true }
    },
    totalCost: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'pending_payment'
    },
    orderType: {
        type: String,
        enum: ['custom_design', 'store_product'],
        default: 'custom_design'
    },
    storeProductId: {
        type: String,
        required: false
    },
    stripePaymentIntentId: {
        type: String,
        required: false // No longer required since we're using Printful checkout
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
