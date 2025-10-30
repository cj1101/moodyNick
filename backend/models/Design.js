const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: Number,
    required: false,
  },
  productVariantId: {
    type: Number,
    required: true,
  },
  placements: {
    type: Object,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);
