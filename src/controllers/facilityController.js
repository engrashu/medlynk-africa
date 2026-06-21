const { getPool, sql } = require('../config/db');
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

// Search facilities by type, city, or specialisation
const searchFacilities = async (req, res) => {
  try {
    const { city, type, specialisation, emergency } = req.query;
    const pool = getPool();
    const request = pool.request();

    let where = 'WHERE f.is_active = 1 AND f.is_verified = 1';

    if (city) {
      request.input('city', sql.NVarChar, city);
      where += ' AND f.city = @city';
    }
    if (emergency === 'true') {
      where += ' AND f.is_emergency = 1';
    }
    if (type) {
      request.input('type_name', sql.NVarChar, `%${type}%`);
      where += ' AND (ft.name_fr LIKE @type_name OR ft.name_en LIKE @type_name)';
    }

    const result = await request.query(`
      SELECT DISTINCT
        f.id, f.name_fr, f.name_en,
        ft.name_fr AS type_fr, ft.name_en AS type_en,
        f.address, f.quarter, f.city,
        f.phone_number, f.whatsapp_number, f.emergency_number,
        f.latitude, f.longitude,
        f.is_emergency, f.has_lab, f.has_pharmacy, f.has_ambulance,
        f.opening_hours
      FROM facilities f
      LEFT JOIN facility_types ft ON ft.id = f.facility_type_id
      ${where}
      ORDER BY f.is_emergency DESC, f.name_fr ASC
    `);

    let facilities = result.recordset;

    if (req.query.lat && req.query.lng) {
      const userLat = parseFloat(req.query.lat);
      const userLng = parseFloat(req.query.lng);
      facilities = facilities.map(f => {
        f.distance_km = (f.latitude && f.longitude)
          ? getDistanceKm(userLat, userLng, f.latitude, f.longitude)
          : null;
        return f;
      });
      facilities.sort((a, b) => {
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return res.json({
      success: true,
      total: facilities.length,
      user_location: req.query.lat ? { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng) } : null,
      facilities,
    });

  } catch (err) {
    console.error('Search facilities error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: err.message,
    });
  }
};

// Get one facility with full details — specialisations + lab services
const getFacilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const facility = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          f.id, f.name_fr, f.name_en,
          ft.name_fr AS type_fr, ft.name_en AS type_en,
          f.address, f.quarter, f.city,
          f.phone_number, f.whatsapp_number, f.emergency_number,
          f.latitude, f.longitude,
          f.is_emergency, f.has_lab, f.has_pharmacy, f.has_ambulance,
          f.opening_hours, f.joined_at
        FROM facilities f
        LEFT JOIN facility_types ft ON ft.id = f.facility_type_id
        WHERE f.id = @id AND f.is_active = 1
      `);

    if (facility.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found',
      });
    }

    // Get specialisations
    const specs = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT s.name_fr, s.name_en
        FROM facility_specialisations fs
        INNER JOIN specialisations s ON s.id = fs.specialisation_id
        WHERE fs.facility_id = @id
        ORDER BY s.name_fr ASC
      `);

    // Get lab services if facility has a lab
    const labs = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT name_fr, name_en, price_fcfa, turnaround_hrs
        FROM lab_services
        WHERE facility_id = @id AND is_available = 1
        ORDER BY name_fr ASC
      `);

    return res.json({
      success: true,
      facility: facility.recordset[0],
      specialisations: specs.recordset,
      lab_services: labs.recordset,
    });

  } catch (err) {
    console.error('Get facility error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load facility',
      error: err.message,
    });
  }
};

// Register a new facility
const registerFacility = async (req, res) => {
  try {
    const {
      name_fr, name_en, facility_type_id, address, city,
      quarter, latitude, longitude, phone_number,
      whatsapp_number, emergency_number,
      is_emergency, has_lab, has_pharmacy, has_ambulance,
      opening_hours,
    } = req.body;

    if (!name_fr || !address) {
      return res.status(400).json({
        success: false,
        message: 'name_fr and address are required',
      });
    }

    const pool = getPool();

    const result = await pool.request()
      .input('name_fr',           sql.NVarChar, name_fr)
      .input('name_en',           sql.NVarChar, name_en || null)
      .input('facility_type_id',  sql.UniqueIdentifier, facility_type_id || null)
      .input('address',           sql.NVarChar, address)
      .input('city',              sql.NVarChar, city || 'Douala')
      .input('quarter',           sql.NVarChar, quarter || null)
      .input('latitude',          sql.Decimal(10,8), latitude || null)
      .input('longitude',         sql.Decimal(11,8), longitude || null)
      .input('phone_number',      sql.NVarChar, phone_number || null)
      .input('whatsapp_number',   sql.NVarChar, whatsapp_number || null)
      .input('emergency_number',  sql.NVarChar, emergency_number || null)
      .input('is_emergency',      sql.Bit, is_emergency ? 1 : 0)
      .input('has_lab',           sql.Bit, has_lab ? 1 : 0)
      .input('has_pharmacy',      sql.Bit, has_pharmacy ? 1 : 0)
      .input('has_ambulance',     sql.Bit, has_ambulance ? 1 : 0)
      .input('opening_hours',     sql.NVarChar, opening_hours || null)
      .query(`
        INSERT INTO facilities (
          name_fr, name_en, facility_type_id, address, city,
          quarter, latitude, longitude, phone_number,
          whatsapp_number, emergency_number,
          is_emergency, has_lab, has_pharmacy, has_ambulance, opening_hours
        )
        OUTPUT INSERTED.id, INSERTED.name_fr, INSERTED.city, INSERTED.joined_at
        VALUES (
          @name_fr, @name_en, @facility_type_id, @address, @city,
          @quarter, @latitude, @longitude, @phone_number,
          @whatsapp_number, @emergency_number,
          @is_emergency, @has_lab, @has_pharmacy, @has_ambulance, @opening_hours
        )
      `);

    return res.status(201).json({
      success: true,
      message: 'Facility registered — pending verification',
      facility: result.recordset[0],
    });

  } catch (err) {
    console.error('Register facility error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message,
    });
  }
};

// Add specialisation to a facility
const addSpecialisation = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialisation_id } = req.body;
    const pool = getPool();

    await pool.request()
      .input('facility_id',       sql.UniqueIdentifier, id)
      .input('specialisation_id', sql.UniqueIdentifier, specialisation_id)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM facility_specialisations
          WHERE facility_id = @facility_id AND specialisation_id = @specialisation_id
        )
        INSERT INTO facility_specialisations (facility_id, specialisation_id)
        VALUES (@facility_id, @specialisation_id)
      `);

    return res.json({
      success: true,
      message: 'Specialisation added',
    });

  } catch (err) {
    console.error('Add specialisation error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add specialisation' });
  }
};

// Add lab service to a facility
const addLabService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_fr, name_en, price_fcfa, turnaround_hrs } = req.body;
    const pool = getPool();

    await pool.request()
      .input('facility_id',    sql.UniqueIdentifier, id)
      .input('name_fr',        sql.NVarChar, name_fr)
      .input('name_en',        sql.NVarChar, name_en || null)
      .input('price_fcfa',     sql.Int, price_fcfa || null)
      .input('turnaround_hrs', sql.Int, turnaround_hrs || null)
      .query(`
        INSERT INTO lab_services (facility_id, name_fr, name_en, price_fcfa, turnaround_hrs)
        VALUES (@facility_id, @name_fr, @name_en, @price_fcfa, @turnaround_hrs)
      `);

    return res.json({
      success: true,
      message: 'Lab service added',
    });

  } catch (err) {
    console.error('Add lab service error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add lab service' });
  }
};

// Get all specialisations (for dropdown)
const getSpecialisations = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT id, name_fr, name_en
      FROM specialisations
      ORDER BY name_fr ASC
    `);
    return res.json({ success: true, specialisations: result.recordset });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load specialisations' });
  }
};

// Get all facility types (for dropdown)
const getFacilityTypes = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT id, name_fr, name_en FROM facility_types ORDER BY name_fr ASC
    `);
    return res.json({ success: true, types: result.recordset });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not load facility types' });
  }
};

module.exports = {
  searchFacilities, getFacilityById, registerFacility,
  addSpecialisation, addLabService,
  getSpecialisations, getFacilityTypes,
};