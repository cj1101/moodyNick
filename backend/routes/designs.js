const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Design = require('../models/Design');

// Apply auth middleware to all routes in this file
router.use(auth);

// @route   POST api/designs
// @desc    Save a new design
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { productId, productVariantId, placements } = req.body;
    const newDesign = new Design({
      user: req.user.id,
      productId,
      productVariantId,
      placements,
    });
    const design = await newDesign.save();
    res.json(design);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/designs
// @desc    Get all designs for the logged-in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const designs = await Design.find({ user: req.user.id });
    res.json(designs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/designs/:id
// @desc    Delete a design by ID
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    let design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ msg: 'Design not found' });
    }

    // Make sure user owns the design
    if (design.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Design.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Design removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Design not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
