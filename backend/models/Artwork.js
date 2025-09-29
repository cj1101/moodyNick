const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
  },
});

module.exports = mongoose.model('Artwork', artworkSchema);
