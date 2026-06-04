const { getPool, sql } = require('../config/db');

// Register a new pharmacy
const registerPharmacy = async (req, res) => {
  try {
    const {
      name_fr, name_en, owner_phone, owner_name,
      address, city, quarter, latitude, longitude,
      phone_number, whatsapp_number,
    } = req.body;

    if (!name_fr || !owner_phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'name_fr, owner_phone and address are required',
      });
    }

    const pool = getPool();

    // Check if phone already registered
    const existing = await pool.request()
      .input('owner_phone', sql.NVarChar, owner_phone)
      .query(`SELECT id FROM pharmacies WHERE owner_phone = @owner_phone`);

    if (existing.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A pharmacy with this phone number already exists',
      });
    }

    const result = await pool.request()
      .input('name_fr',         sql.NVarChar, name_fr)
      .input('name_en',         sql.NVarChar, name_en || null)
      .input('owner_phone',     sql.NVarChar, owner_phone)
      .input('owner_name',      sql.NVarChar, owner_name || null)
      .input('address',         sql.NVarChar, address)
      .input('city',            sql.NVarChar, city || 'Douala')
      .input('quarter',         sql.NVarChar, quarter || null)
      .input('latitude',        sql.Decimal(10,8), latitude || null)
      .input('longitude',       sql.Decimal(11,8), longitude || null)
      .input('phone_number',    sql.NVarChar, phone_number || null)
      .input('whatsapp_number', sql.NVarChar, whatsapp_number || null)
      .query(`
        INSERT INTO pharmacies
          (name_fr, name_en, owner_phone, owner_name, address, city,
           quarter, latitude, longitude, phone_number, whatsapp_number)
        OUTPUT INSERTED.id, INSERTED.name_fr, INSERTED.city, INSERTED.joined_at
        VALUES
          (@name_fr, @name_en, @owner_phone, @owner_name, @address, @city,
           @quarter, @latitude, @longitude, @phone_number, @whatsapp_number)
      `);

    return res.status(201).json({
      success: true,
      message: 'Pharmacy registered successfully — pending verification',
      pharmacy: result.recordset[0],
    });

  } catch (err) {
    console.error('Register pharmacy error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message,
    });
  }
};

// Get all pharmacies (admin or public list)
const getAllPharmacies = async (req, res) => {
  try {
    const { city, verified } = req.query;
    const pool = getPool();

    const request = pool.request();
    let whereClause = 'WHERE p.is_active = 1';

    if (city) {
      request.input('city', sql.NVarChar, city);
      whereClause += ' AND p.city = @city';
    }
    if (verified === 'true') {
      whereClause += ' AND p.is_verified = 1';
    }

    const result = await request.query(`
      SELECT
        p.id, p.name_fr, p.name_en, p.address, p.quarter, p.city,
        p.phone_number, p.whatsapp_number, p.latitude, p.longitude,
        p.is_verified, p.subscription, p.joined_at,
        COUNT(ps.id) AS total_medicines_listed
      FROM pharmacies p
      LEFT JOIN pharmacy_stock ps ON ps.pharmacy_id = p.id AND ps.in_stock = 1
      ${whereClause}
      GROUP BY
        p.id, p.name_fr, p.name_en, p.address, p.quarter, p.city,
        p.phone_number, p.whatsapp_number, p.latitude, p.longitude,
        p.is_verified, p.subscription, p.joined_at
      ORDER BY p.is_verified DESC, p.name_fr ASC
    `);

    return res.json({
      success: true,
      total: result.recordset.length,
      pharmacies: result.recordset,
    });

  } catch (err) {
    console.error('Get pharmacies error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load pharmacies',
      error: err.message,
    });
  }
};

// Get one pharmacy with its full stock list
const getPharmacyById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const pharmacy = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          id, name_fr, name_en, address, quarter, city,
          phone_number, whatsapp_number, latitude, longitude,
          is_verified, subscription, joined_at
        FROM pharmacies
        WHERE id = @id AND is_active = 1
      `);

    if (pharmacy.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    const stock = await pool.request()
      .input('pharmacy_id', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          m.name_fr, m.name_en, m.generic_name,
          m.dosage_form, m.strength, m.needs_prescription,
          mc.name_fr AS category_fr,
          ps.quantity, ps.price_fcfa, ps.expiry_date, ps.updated_at
        FROM pharmacy_stock ps
        INNER JOIN medicines m ON m.id = ps.medicine_id
        LEFT JOIN medicine_categories mc ON mc.id = m.category_id
        WHERE ps.pharmacy_id = @pharmacy_id AND ps.in_stock = 1
        ORDER BY m.name_fr ASC
      `);

    return res.json({
      success: true,
      pharmacy: pharmacy.recordset[0],
      stock: stock.recordset,
      total_in_stock: stock.recordset.length,
    });

  } catch (err) {
    console.error('Get pharmacy error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load pharmacy',
      error: err.message,
    });
  }
};

// Update stock for a pharmacy (dashboard or WhatsApp sync)
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicine_id, quantity, price_fcfa, expiry_date, update_method } = req.body;

    if (!medicine_id || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'medicine_id and quantity are required',
      });
    }

    const pool = getPool();

    // Verify pharmacy exists
    const pharmacy = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`SELECT id FROM pharmacies WHERE id = @id AND is_active = 1`);

    if (pharmacy.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    // Upsert stock — update if exists, insert if not
    await pool.request()
      .input('pharmacy_id',   sql.UniqueIdentifier, id)
      .input('medicine_id',   sql.UniqueIdentifier, medicine_id)
      .input('quantity',      sql.Int, quantity)
      .input('price_fcfa',    sql.Int, price_fcfa || null)
      .input('expiry_date',   sql.Date, expiry_date || null)
      .input('update_method', sql.NVarChar, update_method || 'dashboard')
      .query(`
        IF EXISTS (
          SELECT 1 FROM pharmacy_stock
          WHERE pharmacy_id = @pharmacy_id AND medicine_id = @medicine_id
        )
          UPDATE pharmacy_stock
          SET quantity = @quantity, price_fcfa = @price_fcfa,
              expiry_date = @expiry_date, update_method = @update_method,
              updated_at = GETDATE()
          WHERE pharmacy_id = @pharmacy_id AND medicine_id = @medicine_id
        ELSE
          INSERT INTO pharmacy_stock
            (pharmacy_id, medicine_id, quantity, price_fcfa, expiry_date, update_method)
          VALUES
            (@pharmacy_id, @medicine_id, @quantity, @price_fcfa, @expiry_date, @update_method)
      `);

    return res.json({
      success: true,
      message: quantity > 0 ? 'Stock updated — medicine marked in stock' : 'Stock updated — medicine marked out of stock',
    });

  } catch (err) {
    console.error('Update stock error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Stock update failed',
      error: err.message,
    });
  }
};

// Verify a pharmacy (admin action)
const verifyPharmacy = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`UPDATE pharmacies SET is_verified = 1 WHERE id = @id`);

    return res.json({
      success: true,
      message: 'Pharmacy verified successfully',
    });

  } catch (err) {
    console.error('Verify pharmacy error:', err.message);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

module.exports = {
  registerPharmacy,
  getAllPharmacies,
  getPharmacyById,
  updateStock,
  verifyPharmacy,
};