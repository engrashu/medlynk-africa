const { getPool, sql } = require('../config/db');

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Search medicines by name (French or English) + filter by city
const searchMedicines = async (req, res) => {
  try {
    const { name, city } = req.query;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please enter at least 2 characters to search',
      });
    }

    const pool = getPool();
    const searchTerm = `%${name.trim()}%`;
    const cityFilter = city || 'Douala';

    const result = await pool.request()
      .input('searchTerm', sql.NVarChar, searchTerm)
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT
          m.id              AS medicine_id,
          m.name_fr,
          m.name_en,
          m.generic_name,
          m.dosage_form,
          m.strength,
          m.needs_prescription,
          m.is_who_essential,
          mc.name_fr        AS category_fr,
          mc.name_en        AS category_en,
          p.id              AS pharmacy_id,
          p.name_fr         AS pharmacy_name_fr,
          p.name_en         AS pharmacy_name_en,
          p.address,
          p.quarter,
          p.city,
          p.phone_number,
          p.whatsapp_number,
          p.latitude,
          p.longitude,
          ps.quantity,
          ps.price_fcfa,
          ps.updated_at     AS stock_updated_at
        FROM medicines m
        INNER JOIN pharmacy_stock ps
          ON ps.medicine_id = m.id AND ps.in_stock = 1 AND ps.quantity > 0
        INNER JOIN pharmacies p
          ON p.id = ps.pharmacy_id AND p.is_active = 1 AND p.is_verified = 1
        LEFT JOIN medicine_categories mc
          ON mc.id = m.category_id
        WHERE
          (m.name_fr LIKE @searchTerm OR m.name_en LIKE @searchTerm OR m.generic_name LIKE @searchTerm)
          AND p.city = @city
        ORDER BY ps.quantity DESC, p.name_fr ASC
      `);

    // Log the search
    await pool.request()
      .input('medicine_searched', sql.NVarChar, name.trim())
      .input('city', sql.NVarChar, cityFilter)
      .input('results_found', sql.Int, result.recordset.length)
      .query(`
        INSERT INTO search_logs (medicine_searched, city, results_found)
        VALUES (@medicine_searched, @city, @results_found)
      `);

    let medicines = result.recordset;

    if (req.query.lat && req.query.lng) {
      const userLat = parseFloat(req.query.lat);
      const userLng = parseFloat(req.query.lng);
      medicines = medicines.map(m => {
        m.distance_km = (m.latitude && m.longitude)
          ? getDistanceKm(userLat, userLng, m.latitude, m.longitude)
          : null;
        return m;
      });
      medicines.sort((a, b) => {
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return res.json({
      success: true,
      query: name.trim(),
      city: cityFilter,
      total_results: medicines.length,
      medicines,
    });

  } catch (err) {
    console.error('Search error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Search failed — please try again',
      error: err.message,
    });
  }
};

// Get all medicines (for dropdown / autocomplete)
const getAllMedicines = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT
        m.id,
        m.name_fr,
        m.name_en,
        m.generic_name,
        m.dosage_form,
        m.strength,
        m.needs_prescription,
        mc.name_fr AS category_fr,
        mc.name_en AS category_en
      FROM medicines m
      LEFT JOIN medicine_categories mc ON mc.id = m.category_id
      WHERE m.is_active = 1
      ORDER BY m.name_fr ASC
    `);

    return res.json({
      success: true,
      total: result.recordset.length,
      medicines: result.recordset,
    });

  } catch (err) {
    console.error('Get medicines error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load medicines',
      error: err.message,
    });
  }
};

// Get all medicine categories
const getCategories = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT id, name_fr, name_en, description, icon_code
      FROM medicine_categories
      ORDER BY name_fr ASC
    `);

    return res.json({
      success: true,
      total: result.recordset.length,
      categories: result.recordset,
    });

  } catch (err) {
    console.error('Get categories error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load categories',
    });
  }
};

module.exports = { searchMedicines, getAllMedicines, getCategories };