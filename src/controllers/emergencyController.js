const { getPool, sql } = require('../config/db');

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
};

// GET /api/emergency?city=Douala&lat=&lng=&language=fr
const getEmergencyInfo = async (req, res) => {
  try {
    const { city, lat, lng, language } = req.query;
    const cityFilter = city || 'Douala';
    const lang = language || 'fr';
    const pool = getPool();

    // Get nearest emergency facilities
    const facilities = await pool.request()
      .input('city', sql.NVarChar, cityFilter)
      .query(`
        SELECT TOP 5
          f.id, f.name_fr, f.name_en,
          ft.name_fr AS type_fr, ft.name_en AS type_en,
          f.address, f.quarter, f.city,
          f.phone_number, f.emergency_number,
          f.latitude, f.longitude,
          f.has_ambulance
        FROM facilities f
        LEFT JOIN facility_types ft ON ft.id = f.facility_type_id
        WHERE f.city = @city
          AND f.is_active = 1
          AND f.is_emergency = 1
        ORDER BY f.name_fr ASC
      `);

    let emergencyFacilities = facilities.recordset;

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      emergencyFacilities = emergencyFacilities.map(f => {
        f.distance_km = (f.latitude && f.longitude)
          ? getDistanceKm(userLat, userLng, f.latitude, f.longitude)
          : null;
        return f;
      }).sort((a, b) => {
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    // Emergency numbers for Cameroon
    const emergencyNumbers = {
      country: 'Cameroon',
      country_code: '+237',
      numbers: [
        {
          service_fr: 'SAMU — Urgences médicales',
          service_en: 'SAMU — Medical emergencies',
          number: '119',
          icon: 'ambulance',
          type: 'medical',
        },
        {
          service_fr: 'Police — Urgences',
          service_en: 'Police — Emergency',
          number: '117',
          icon: 'shield',
          type: 'police',
        },
        {
          service_fr: 'Pompiers — Incendies',
          service_en: 'Fire brigade',
          number: '118',
          icon: 'fire',
          type: 'fire',
        },
        {
          service_fr: 'Gendarmerie Nationale',
          service_en: 'National Gendarmerie',
          number: '113',
          icon: 'shield',
          type: 'gendarmerie',
        },
      ],
      disclaimer_fr: 'Medlynk fournit ces numéros à titre informatif. En cas d\'urgence vitale, appelez directement le 119 (SAMU) ou rendez-vous à l\'hôpital le plus proche. Medlynk n\'est pas un service d\'urgence et ne garantit pas la disponibilité des services listés.',
      disclaimer_en: 'Medlynk provides these numbers for informational purposes. In a life-threatening emergency, call 119 (SAMU) directly or go to the nearest hospital. Medlynk is not an emergency service and does not guarantee the availability of listed services.',
    };

    // Offline-ready emergency data — can be cached by the app
    const offlineData = {
      cached_at: new Date().toISOString(),
      cache_valid_hours: 168, // 7 days
      numbers: emergencyNumbers.numbers,
    };

    const greeting = lang === 'fr'
      ? 'Services d\'urgence — ' + cityFilter
      : 'Emergency services — ' + cityFilter;

    return res.json({
      success: true,
      title: greeting,
      city: cityFilter,
      user_location: lat ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      emergency_numbers: emergencyNumbers,
      nearest_emergency_facilities: emergencyFacilities,
      nearest_facility: emergencyFacilities.length > 0 ? emergencyFacilities[0] : null,
      offline_cache: offlineData,
    });

  } catch (err) {
    console.error('Emergency error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not load emergency information',
      error: err.message,
    });
  }
};

module.exports = { getEmergencyInfo };