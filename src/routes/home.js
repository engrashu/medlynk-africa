const express = require('express');
const router = express.Router();
const { getHomeSummary } = require('../controllers/homeController');

// GET /api/home?city=Douala&lat=4.0722&lng=9.7482&language=fr
router.get('/', getHomeSummary);

module.exports = router;