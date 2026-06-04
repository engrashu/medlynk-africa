const express = require('express');
const router = express.Router();
const {
  registerPharmacy,
  getAllPharmacies,
  getPharmacyById,
  updateStock,
  verifyPharmacy,
} = require('../controllers/pharmacyController');

// POST /api/pharmacies — register a new pharmacy
router.post('/', registerPharmacy);

// GET /api/pharmacies — list all pharmacies
router.get('/', getAllPharmacies);

// GET /api/pharmacies/:id — get one pharmacy + its stock
router.get('/:id', getPharmacyById);

// PUT /api/pharmacies/:id/stock — update medicine stock
router.put('/:id/stock', updateStock);

// PUT /api/pharmacies/:id/verify — admin verifies pharmacy
router.put('/:id/verify', verifyPharmacy);

module.exports = router;