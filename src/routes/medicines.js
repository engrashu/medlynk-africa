const express = require('express');
const router = express.Router();
const {
  searchMedicines,
  getAllMedicines,
  getCategories,
} = require('../controllers/medicineController');

// GET /api/medicines/search?name=paracetamol&city=Douala
router.get('/search', searchMedicines);

// GET /api/medicines
router.get('/', getAllMedicines);

// GET /api/medicines/categories
router.get('/categories', getCategories);

module.exports = router;