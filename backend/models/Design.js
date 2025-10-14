const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productVariantId: {
    type: Number,
    required: true,
  },
  productId: {
    type: Number,
    required: true,
  },
  // placements is now an object with keys for each placement area (front, back, left, right, etc.)
  // Each placement contains: { images: [], texts: [] }
  placements: {
    type: Object,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);
