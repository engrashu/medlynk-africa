const express = require('express');
const router = express.Router();
const {
  searchFacilities, getFacilityById, registerFacility,
  addSpecialisation, addLabService,
  getSpecialisations, getFacilityTypes,
} = require('../controllers/facilityController');
const { protect } = require('../middleware/auth');

// GET /api/facilities?city=Douala&type=hospital&emergency=true
router.get('/', searchFacilities);

// GET /api/facilities/types
router.get('/types', getFacilityTypes);

// GET /api/facilities/specialisations
router.get('/specialisations', getSpecialisations);

// GET /api/facilities/:id
router.get('/:id', getFacilityById);

// POST /api/facilities
router.post('/', protect, registerFacility);

// POST /api/facilities/:id/specialisations
router.post('/:id/specialisations', protect, addSpecialisation);

// POST /api/facilities/:id/lab-services
router.post('/:id/lab-services', protect, addLabService);

module.exports = router;