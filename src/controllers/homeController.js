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

const addDistances = (items, userLat, userLng) => {
  return items
    .map(item => ({
      ...item,
      distance_km: (item.latitude && item.longitude)
        ? getDistanceKm(userLat, userLng, item.latitude, item.longitude)
        : null,
    }))
    .sort((a, b) => {
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
};

// Home screen — everything a patient needs in one call
const getHomeSummary = async (req, res) => {
  try {
    const { city, lat, lng, language } = req.query;
    const pool = getPool();
    const cityFilter = city || 'Douala';
    const lang = language || 'fr';
    const hasGPS = lat && lng;
    const userLat = hasGPS ? parseFloat(lat) : null;
    const userLng = hasGPS ? parseFloat(lng) : null;

    // 1. Nearest pharmacies with stock
    const pharmaciesResult = await pool.request()
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT TOP 5
          p.id, p.name_fr, p.name_en, p.address, p.quarter,
          p.phone_number, p.whatsapp_number,
          p.latitude, p.longitude,
          COUNT(ps.id) AS medicines_in_stock
        FROM pharmacies p
        LEFT JOIN pharmacy_stock ps
          ON ps.pharmacy_id = p.id AND ps.in_stock = 1
        WHERE p.city = @city AND p.is_active = 1 AND p.is_verified = 1
        GROUP BY
          p.id, p.name_fr, p.name_en, p.address, p.quarter,
          p.phone_number, p.whatsapp_number,
          p.latitude, p.longitude
        ORDER BY medicines_in_stock DESC
      `);

    // 2. Nearest verified facilities
    const facilitiesResult = await pool.request()
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT TOP 5
          f.id, f.name_fr, f.name_en,
          ft.name_fr AS type_fr, ft.name_en AS type_en,
          f.address, f.quarter,
          f.phone_number, f.emergency_number,
          f.latitude, f.longitude,
          f.is_emergency, f.has_lab, f.has_pharmacy
        FROM facilities f
        LEFT JOIN facility_types ft ON ft.id = f.facility_type_id
        WHERE f.city = @city AND f.is_active = 1 AND f.is_verified = 1
        ORDER BY f.is_emergency DESC, f.name_fr ASC
      `);

    // 3. Nearest emergency facility
    const emergencyResult = await pool.request()
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT TOP 1
          f.id, f.name_fr, f.name_en,
          f.address, f.quarter,
          f.phone_number, f.emergency_number,
          f.latitude, f.longitude
        FROM facilities f
        WHERE f.city = @city
          AND f.is_active = 1
          AND f.is_verified = 1
          AND f.is_emergency = 1
        ORDER BY f.name_fr ASC
      `);

    // 4. Most searched medicines in this city this week
    const trendingResult = await pool.request()
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT TOP 5
          medicine_searched,
          COUNT(*) AS search_count
        FROM search_logs
        WHERE city = @city
          AND searched_at >= DATEADD(day, -7, GETDATE())
        GROUP BY medicine_searched
        ORDER BY search_count DESC
      `);

    // 5. Platform stats for the city
    const statsResult = await pool.request()
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM pharmacies
           WHERE city = @city AND is_active = 1 AND is_verified = 1) AS total_pharmacies,
          (SELECT COUNT(*) FROM facilities
           WHERE city = @city AND is_active = 1 AND is_verified = 1) AS total_facilities,
          (SELECT COUNT(*) FROM pharmacy_stock ps
           INNER JOIN pharmacies p ON p.id = ps.pharmacy_id
           WHERE p.city = @city AND ps.in_stock = 1) AS medicines_available
      `);

    // Apply distance sorting if GPS provided
    let pharmacies = pharmaciesResult.recordset;
    let facilities = facilitiesResult.recordset;
    let emergency = emergencyResult.recordset[0] || null;

    if (hasGPS) {
      pharmacies = addDistances(pharmacies, userLat, userLng);
      facilities = addDistances(facilities, userLat, userLng);
      if (emergency && emergency.latitude) {
        emergency.distance_km = getDistanceKm(
          userLat, userLng, emergency.latitude, emergency.longitude
        );
      }
    }

    const greeting = lang === 'fr'
      ? `Bienvenue sur Medlynk — ${cityFilter}`
      : `Welcome to Medlynk — ${cityFilter}`;

    return res.json({
      success: true,
      greeting,
      city: cityFilter,
      user_location: hasGPS ? { lat: userLat, lng: userLng } : null,
      stats: statsResult.recordset[0],
      nearest_pharmacies: pharmacies,
      nearest_facilities: facilities,
      emergency_facility: emergency,
      trending_searches: trendingResult.recordset,
    });

  } catch (err) {
    console.error('Home summary error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load home summary',
      error: err.message,
    });
  }
};

module.exports = { getHomeSummary };