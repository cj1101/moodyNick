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
        required: true
    },
    design: {
        type: Object,
        required: true
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
        default: 'pending'
    },
    stripePaymentIntentId: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
