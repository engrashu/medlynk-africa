const { getPool, sql } = require('../config/db');

// Dashboard modules available per role
const ROLE_MODULES = {
  patient: {
    label_fr: 'Patient',
    label_en: 'Patient',
    modules: [
      { id: 'home',          label_fr: 'Accueil',            label_en: 'Home',              icon: 'home' },
      { id: 'search',        label_fr: 'Recherche',          label_en: 'Search',            icon: 'search' },
      { id: 'appointments',  label_fr: 'Rendez-vous',        label_en: 'Appointments',      icon: 'calendar' },
      { id: 'medications',   label_fr: 'Médicaments',        label_en: 'Medications',       icon: 'pill' },
      { id: 'emergency',     label_fr: 'Urgences',           label_en: 'Emergency',         icon: 'alert-circle' },
      { id: 'records',       label_fr: 'Dossier médical',    label_en: 'Medical Records',   icon: 'folder' },
      { id: 'messages',      label_fr: 'Messages',           label_en: 'Messages',          icon: 'chat' },
      { id: 'profile',       label_fr: 'Profil',             label_en: 'Profile',           icon: 'user' },
    ],
  },
  pharmacy: {
    label_fr: 'Pharmacie',
    label_en: 'Pharmacy',
    modules: [
      { id: 'overview',      label_fr: 'Vue d\'ensemble',    label_en: 'Overview',          icon: 'dashboard' },
      { id: 'inventory',     label_fr: 'Inventaire',         label_en: 'Inventory',         icon: 'box' },
      { id: 'prescriptions', label_fr: 'Ordonnances',        label_en: 'Prescriptions',     icon: 'clipboard' },
      { id: 'orders',        label_fr: 'Commandes',          label_en: 'Orders',            icon: 'cart' },
      { id: 'suppliers',     label_fr: 'Fournisseurs',       label_en: 'Suppliers',         icon: 'truck' },
      { id: 'sales',         label_fr: 'Ventes',             label_en: 'Sales',             icon: 'chart' },
      { id: 'reports',       label_fr: 'Rapports',           label_en: 'Reports',           icon: 'file' },
      { id: 'settings',      label_fr: 'Paramètres',         label_en: 'Settings',          icon: 'settings' },
    ],
  },
  facility: {
    label_fr: 'Établissement',
    label_en: 'Healthcare Facility',
    modules: [
      { id: 'overview',      label_fr: 'Vue d\'ensemble',    label_en: 'Overview',          icon: 'dashboard' },
      { id: 'patients',      label_fr: 'Patients',           label_en: 'Patients',          icon: 'users' },
      { id: 'appointments',  label_fr: 'Rendez-vous',        label_en: 'Appointments',      icon: 'calendar' },
      { id: 'pharmacy',      label_fr: 'Pharmacie',          label_en: 'Pharmacy',          icon: 'pill' },
      { id: 'laboratory',    label_fr: 'Laboratoire',        label_en: 'Laboratory',        icon: 'flask' },
      { id: 'billing',       label_fr: 'Facturation',        label_en: 'Billing',           icon: 'dollar' },
      { id: 'reports',       label_fr: 'Rapports',           label_en: 'Reports',           icon: 'chart' },
      { id: 'settings',      label_fr: 'Paramètres',         label_en: 'Settings',          icon: 'settings' },
    ],
  },
  admin: {
    label_fr: 'Super Admin',
    label_en: 'Super Admin',
    modules: [
      { id: 'dashboard',     label_fr: 'Tableau de bord',    label_en: 'Dashboard',         icon: 'dashboard' },
      { id: 'patients',      label_fr: 'Patients',           label_en: 'Patients',          icon: 'users' },
      { id: 'pharmacies',    label_fr: 'Pharmacies',         label_en: 'Pharmacies',        icon: 'pill' },
      { id: 'facilities',    label_fr: 'Établissements',     label_en: 'Facilities',        icon: 'hospital' },
      { id: 'providers',     label_fr: 'Professionnels',     label_en: 'Healthcare Providers', icon: 'stethoscope' },
      { id: 'users',         label_fr: 'Utilisateurs',       label_en: 'Users & Roles',     icon: 'shield' },
      { id: 'inventory',     label_fr: 'Inventaire',         label_en: 'Inventory',         icon: 'box' },
      { id: 'analytics',     label_fr: 'Analyses',           label_en: 'Reports & Analytics', icon: 'chart' },
      { id: 'settings',      label_fr: 'Paramètres',         label_en: 'Settings',          icon: 'settings' },
    ],
  },
};

// GET /api/dashboard — returns the modules for the logged-in user
const getDashboard = async (req, res) => {
  try {
    const { id, role } = req.user;
    const pool = getPool();

    // Get full user profile
    const userResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT id, phone_number, full_name, language, role, city,
               account_type, organization_id, organization_name, is_admin
        FROM users WHERE id = @id
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.recordset[0];
    const accountType = user.account_type || user.role || 'patient';
    const lang = user.language || 'fr';

    // Get the correct module set
    const dashboardConfig = ROLE_MODULES[accountType] || ROLE_MODULES.patient;

    // Format modules with the user's language
    const modules = dashboardConfig.modules.map(m => ({
      id: m.id,
      label: lang === 'fr' ? m.label_fr : m.label_en,
      icon: m.icon,
    }));

    // Get platform stats for admin
    let stats = null;
    if (accountType === 'admin') {
      const statsResult = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'patient') AS total_patients,
          (SELECT COUNT(*) FROM pharmacies WHERE is_active = 1) AS total_pharmacies,
          (SELECT COUNT(*) FROM facilities WHERE is_active = 1) AS total_facilities,
          (SELECT COUNT(*) FROM pharmacy_stock WHERE in_stock = 1) AS medicines_in_stock,
          (SELECT COUNT(*) FROM users) AS total_users
      `);
      stats = statsResult.recordset[0];
    }

    // Get pharmacy stats if pharmacy role
    let pharmacyStats = null;
    if (accountType === 'pharmacy' && user.organization_id) {
      const pResult = await pool.request()
        .input('org_id', sql.UniqueIdentifier, user.organization_id)
        .query(`
          SELECT
            (SELECT COUNT(*) FROM pharmacy_stock WHERE pharmacy_id = @org_id AND in_stock = 1) AS items_in_stock,
            (SELECT COUNT(*) FROM pharmacy_stock WHERE pharmacy_id = @org_id AND quantity < 10 AND quantity > 0) AS low_stock,
            (SELECT COUNT(*) FROM pharmacy_stock WHERE pharmacy_id = @org_id AND expiry_date < DATEADD(month, 1, GETDATE()) AND expiry_date IS NOT NULL) AS expiring_soon
        `);
      pharmacyStats = pResult.recordset[0];
    }

    const greeting = lang === 'fr'
      ? `Bienvenue, ${user.full_name || 'Utilisateur'}`
      : `Welcome, ${user.full_name || 'User'}`;

    return res.json({
      success: true,
      greeting,
      tenant: {
        type: accountType,
        label: lang === 'fr' ? dashboardConfig.label_fr : dashboardConfig.label_en,
        organization_id: user.organization_id,
        organization_name: user.organization_name,
      },
      user: {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        language: lang,
        city: user.city,
        is_admin: user.is_admin,
      },
      modules,
      stats,
      pharmacy_stats: pharmacyStats,
    });

  } catch (err) {
    console.error('Dashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Dashboard failed', error: err.message });
  }
};

module.exports = { getDashboard };