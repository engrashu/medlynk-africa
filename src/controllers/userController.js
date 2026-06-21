const { getPool, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
const { sendOTP: sendSMS } = require('../services/smsService');
require('dotenv').config();

// Generate JWT token
const generateToken = (id, phone, role) => {
  return jwt.sign(
    { id, phone, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// STEP 1 — Request OTP (patient sends their phone number)
const requestOTP = async (req, res) => {
  try {
    const { phone_number, language } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Normalize Cameroon number — always store with +237
    let phone = phone_number.trim();
    if (phone.startsWith('0')) {
      phone = '+237' + phone.slice(1);
    }
    if (!phone.startsWith('+')) {
      phone = '+237' + phone;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const lang = language || 'fr';

    const pool = getPool();

    // Check if user already exists
    const existing = await pool.request()
      .input('phone', sql.NVarChar, phone)
      .query(`SELECT id, full_name, role FROM users WHERE phone_number = @phone`);

    if (existing.recordset.length === 0) {
      // New user — create account
      await pool.request()
        .input('phone',      sql.NVarChar,  phone)
        .input('language',   sql.NVarChar,  lang)
        .input('otp',        sql.NVarChar,  otp)
        .input('otp_expiry', sql.DateTime2, otpExpiry)
        .query(`
          INSERT INTO users (phone_number, language, otp_code, otp_expiry)
          VALUES (@phone, @language, @otp, @otp_expiry)
        `);
    } else {
      // Existing user — update OTP
      await pool.request()
        .input('phone',      sql.NVarChar,  phone)
        .input('otp',        sql.NVarChar,  otp)
        .input('otp_expiry', sql.DateTime2, otpExpiry)
        .query(`
          UPDATE users
          SET otp_code = @otp, otp_expiry = @otp_expiry
          WHERE phone_number = @phone
        `);
    }

    // Send real SMS via Africa's Talking
    const smsResult = await sendSMS(phone, otp, lang);
    console.log(`OTP for ${phone}: ${otp} — SMS status: ${smsResult.status || smsResult.error}`);

    const message = lang === 'fr'
      ? `Votre code Medlynk est: ${otp}. Valable 10 minutes.`
      : `Your Medlynk code is: ${otp}. Valid for 10 minutes.`;

    return res.json({
      success: true,
      message: lang === 'fr'
        ? 'Code envoyé avec succès'
        : 'OTP sent successfully',
      phone_number: phone,
      // REMOVE this line in production — only for development testing
      dev_otp: otp,
    });

  } catch (err) {
    console.error('Request OTP error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: err.message,
    });
  }
};

// STEP 2 — Verify OTP and log in
const verifyOTP = async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body;

    if (!phone_number || !otp_code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP code are required',
      });
    }

    let phone = phone_number.trim();
    if (phone.startsWith('0')) phone = '+237' + phone.slice(1);
    if (!phone.startsWith('+')) phone = '+237' + phone;

    const pool = getPool();

    const result = await pool.request()
      .input('phone', sql.NVarChar, phone)
      .query(`
        SELECT id, phone_number, full_name, language, role,
               otp_code, otp_expiry, city
        FROM users
        WHERE phone_number = @phone
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not found — please request OTP first',
      });
    }

    const user = result.recordset[0];

    // Check OTP matches
    if (user.otp_code !== otp_code) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP code',
      });
    }

    // Check OTP not expired
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired — please request a new one',
      });
    }

    // Mark user as verified, clear OTP
    await pool.request()
      .input('phone', sql.NVarChar, phone)
      .query(`
        UPDATE users
        SET is_verified = 1, otp_code = NULL, otp_expiry = NULL
        WHERE phone_number = @phone
      `);

    const token = generateToken(user.id, user.phone_number, user.role);
    const isNewUser = !user.full_name;

    return res.json({
      success: true,
      message: user.language === 'fr' ? 'Connexion réussie' : 'Login successful',
      is_new_user: isNewUser,
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        language: user.language,
        role: user.role,
        city: user.city,
      },
    });

  } catch (err) {
    console.error('Verify OTP error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: err.message,
    });
  }
};

// STEP 3 — Complete profile (after first login)
const updateProfile = async (req, res) => {
  try {
    const { full_name, city, language } = req.body;
    const userId = req.user.id;

    const pool = getPool();

    await pool.request()
      .input('id',        sql.UniqueIdentifier, userId)
      .input('full_name', sql.NVarChar, full_name || null)
      .input('city',      sql.NVarChar, city || 'Douala')
      .input('language',  sql.NVarChar, language || 'fr')
      .query(`
        UPDATE users
        SET full_name = @full_name, city = @city, language = @language
        WHERE id = @id
      `);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
    });

  } catch (err) {
    console.error('Update profile error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: err.message,
    });
  }
};

// GET — current user profile
const getProfile = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.user.id)
      .query(`
        SELECT id, phone_number, full_name, language, role, city, created_at
        FROM users
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: result.recordset[0],
    });

  } catch (err) {
    console.error('Get profile error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not load profile' });
  }
};

module.exports = { requestOTP, verifyOTP, updateProfile, getProfile };