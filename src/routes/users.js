const express = require('express');
const router = express.Router();
const { requestOTP, verifyOTP, updateProfile, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// POST /api/users/request-otp — send OTP to phone
router.post('/request-otp', requestOTP);

// POST /api/users/verify-otp — verify OTP, get token
router.post('/verify-otp', verifyOTP);

// PUT /api/users/profile — update profile (login required)
router.put('/profile', protect, updateProfile);

// GET /api/users/profile — get my profile (login required)
router.get('/profile', protect, getProfile);

module.exports = router;