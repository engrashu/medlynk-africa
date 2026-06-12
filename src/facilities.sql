-- Facility types (Hospital, Clinic, Laboratory, Health Centre)
CREATE TABLE facility_types (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_fr     NVARCHAR(100) NOT NULL,
    name_en     NVARCHAR(100) NOT NULL,
    created_at  DATETIME2 DEFAULT GETDATE()
);

-- Medical specialisations
CREATE TABLE specialisations (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_fr     NVARCHAR(150) NOT NULL,
    name_en     NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    created_at  DATETIME2 DEFAULT GETDATE()
);

-- Clinics, hospitals, labs
CREATE TABLE facilities (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_fr             NVARCHAR(200) NOT NULL,
    name_en             NVARCHAR(200),
    facility_type_id    UNIQUEIDENTIFIER REFERENCES facility_types(id),
    address             NVARCHAR(MAX) NOT NULL,
    city                NVARCHAR(80) NOT NULL DEFAULT 'Douala',
    quarter             NVARCHAR(100),
    latitude            DECIMAL(10,8),
    longitude           DECIMAL(11,8),
    phone_number        NVARCHAR(20),
    whatsapp_number     NVARCHAR(20),
    emergency_number    NVARCHAR(20),
    is_emergency        BIT DEFAULT 0,
    is_verified         BIT DEFAULT 0,
    is_active           BIT DEFAULT 1,
    has_lab             BIT DEFAULT 0,
    has_pharmacy        BIT DEFAULT 0,
    has_ambulance       BIT DEFAULT 0,
    opening_hours       NVARCHAR(MAX),
    joined_at           DATETIME2 DEFAULT GETDATE()
);

-- Link facilities to their specialisations (one facility can have many)
CREATE TABLE facility_specialisations (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    facility_id     UNIQUEIDENTIFIER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    specialisation_id UNIQUEIDENTIFIER NOT NULL REFERENCES specialisations(id),
    CONSTRAINT UQ_facility_spec UNIQUE(facility_id, specialisation_id)
);

-- Lab services offered by a facility
CREATE TABLE lab_services (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    facility_id     UNIQUEIDENTIFIER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name_fr         NVARCHAR(200) NOT NULL,
    name_en         NVARCHAR(200),
    price_fcfa      INT,
    turnaround_hrs  INT,
    is_available    BIT DEFAULT 1
);

-- Indexes
CREATE INDEX idx_facilities_city     ON facilities(city);
CREATE INDEX idx_facilities_type     ON facilities(facility_type_id);
CREATE INDEX idx_facilities_location ON facilities(latitude, longitude);
CREATE INDEX idx_facilities_emergency ON facilities(is_emergency);

-- Seed: facility types
INSERT INTO facility_types (name_fr, name_en) VALUES
('Hôpital',             'Hospital'),
('Clinique',            'Clinic'),
('Laboratoire',         'Laboratory'),
('Centre de Santé',     'Health Centre'),
('Maternité',           'Maternity'),
('Cabinet Médical',     'Medical Cabinet'),
('Pharmacie Hospitalière', 'Hospital Pharmacy');

-- Seed: specialisations
INSERT INTO specialisations (name_fr, name_en) VALUES
('Médecine Générale',       'General Medicine'),
('Pédiatrie',               'Paediatrics'),
('Gynécologie-Obstétrique', 'Gynaecology & Obstetrics'),
('Cardiologie',             'Cardiology'),
('Ophtalmologie',           'Ophthalmology'),
('Dermatologie',            'Dermatology'),
('Orthopédie',              'Orthopaedics'),
('Neurologie',              'Neurology'),
('Oncologie',               'Oncology'),
('Urologie',                'Urology'),
('ORL',                     'ENT'),
('Psychiatrie',             'Psychiatry'),
('Radiologie',              'Radiology'),
('Diabétologie',            'Diabetology'),
('Urgences',                'Emergency');

-- Seed: first real facility in Douala
INSERT INTO facilities (
    name_fr, name_en, address, city, quarter,
    latitude, longitude, phone_number,
    is_emergency, has_lab, has_pharmacy, is_verified
) VALUES (
    'Hôpital Général de Douala',
    'Douala General Hospital',
    'Rue Ivy, Deido',
    'Douala', 'Deido',
    4.0612, 9.7241,
    '+237233421234',
    1, 1, 1, 1
);

SELECT 'Facilities module ready' AS status;
GO