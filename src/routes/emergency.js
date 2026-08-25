const express = require('express');
const router = express.Router();
const { getEmergencyInfo } = require('../controllers/emergencyController');

// GET /api/emergency?city=Douala&lat=&lng=&language=fr
// No auth required — emergency info must be accessible to everyone
router.get('/', getEmergencyInfo);

module.exports = router;