const express = require('express');
const router = express.Router();

// Server-side pricing calculator mirrors frontend logic for a single source of truth
const { calculatePrice } = require('../services/pricingCalculator');

// @route   POST /api/pricing/quote
// @desc    Return a price breakdown for given inputs
// @access  Public (no auth; inputs are non-sensitive)
router.post('/quote', async (req, res) => {
  try {
    const input = req.body || {};
    // Basic shape validation; fallback defaults handled in calculator
    const breakdown = calculatePrice(input);
    return res.json(breakdown);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid pricing input', error: String(err?.message || err) });
  }
});

module.exports = router;


