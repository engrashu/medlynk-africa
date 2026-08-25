-- Create the Medlynk Africa database
CREATE DATABASE medlynk_africa;
GO

USE medlynk_africa;
GO

-- Medicine categories
CREATE TABLE medicine_categories (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_fr     NVARCHAR(100) NOT NULL,
    name_en     NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    icon_code   NVARCHAR(50),
    created_at  DATETIME2 DEFAULT GETDATE()
);

-- Master medicine list
CREATE TABLE medicines (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_fr             NVARCHAR(200) NOT NULL,
    name_en             NVARCHAR(200),
    generic_name        NVARCHAR(200),
    category_id         UNIQUEIDENTIFIER REFERENCES medicine_categories(id),
    dosage_form         NVARCHAR(50),
    strength            NVARCHAR(50),
    manufacturer        NVARCHAR(150),
    needs_prescription  BIT DEFAULT 0,
    is_who_essential    BIT DEFAULT 0,
    is_active           BIT DEFAULT 1,
    created_at          DATETIME2 DEFAULT GETDATE()
);

-- Pharmacies
CREATE TABLE pharmacies (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name_fr          NVARCHAR(200) NOT NULL,
    name_en          NVARCHAR(200),
    owner_phone      NVARCHAR(20) NOT NULL,
    owner_name       NVARCHAR(150),
    address          NVARCHAR(MAX) NOT NULL,
    city             NVARCHAR(80) NOT NULL DEFAULT 'Douala',
    quarter          NVARCHAR(100),
    latitude         DECIMAL(10,8),
    longitude        DECIMAL(11,8),
    phone_number     NVARCHAR(20),
    whatsapp_number  NVARCHAR(20),
    is_verified      BIT DEFAULT 0,
    is_active        BIT DEFAULT 1,
    subscription     NVARCHAR(20) DEFAULT 'free',
    joined_at        DATETIME2 DEFAULT GETDATE()
);

-- Opening hours
CREATE TABLE pharmacy_hours (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pharmacy_id   UNIQUEIDENTIFIER NOT NULL REFERENCES pharmacies(id),
    day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time     TIME,
    close_time    TIME,
    is_open_24h   BIT DEFAULT 0,
    is_closed     BIT DEFAULT 0
);

-- Real-time stock — the heart of Medlynk
CREATE TABLE pharmacy_stock (
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pharmacy_id    UNIQUEIDENTIFIER NOT NULL REFERENCES pharmacies(id),
    medicine_id    UNIQUEIDENTIFIER NOT NULL REFERENCES medicines(id),
    quantity       INT NOT NULL DEFAULT 0,
    price_fcfa     INT,
    expiry_date    DATE,
    in_stock       AS CAST(CASE WHEN quantity > 0 THEN 1 ELSE 0 END AS BIT) PERSISTED,
    update_method  NVARCHAR(20) DEFAULT 'dashboard',
    notes          NVARCHAR(MAX),
    updated_at     DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_pharmacy_medicine UNIQUE(pharmacy_id, medicine_id)
);

-- Search analytics
CREATE TABLE search_logs (
    id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    medicine_searched NVARCHAR(200) NOT NULL,
    city              NVARCHAR(80),
    results_found     INT DEFAULT 0,
    user_phone        NVARCHAR(20),
    searched_at       DATETIME2 DEFAULT GETDATE()
);

-- Indexes for fast search
CREATE INDEX idx_medicines_name_fr ON medicines(name_fr);
CREATE INDEX idx_medicines_name_en ON medicines(name_en);
CREATE INDEX idx_stock_medicine    ON pharmacy_stock(medicine_id);
CREATE INDEX idx_stock_pharmacy    ON pharmacy_stock(pharmacy_id);
CREATE INDEX idx_stock_in_stock    ON pharmacy_stock(in_stock);
CREATE INDEX idx_pharmacies_city   ON pharmacies(city);

-- Seed: medicine categories
INSERT INTO medicine_categories (name_fr, name_en) VALUES
('Analgésiques',          'Analgesics'),
('Antibiotiques',         'Antibiotics'),
('Antipaludéens',         'Antimalarials'),
('Antihypertenseurs',     'Antihypertensives'),
('Antidiabétiques',       'Antidiabetics'),
('Vitamines',             'Vitamins & Supplements'),
('Antiparasitaires',      'Antiparasitic'),
('Gastro-intestinaux',    'Gastrointestinal');

-- Seed: most searched medicines in Cameroon
INSERT INTO medicines (name_fr, name_en, generic_name, dosage_form, strength, needs_prescription, is_who_essential)
VALUES
('Paracétamol',               'Paracetamol',            'Acetaminophen',                'Tablet',  '500mg',       0, 1),
('Paracétamol Sirop',         'Paracetamol Syrup',      'Acetaminophen',                'Syrup',   '120mg/5ml',   0, 1),
('Amoxicilline',              'Amoxicillin',            'Amoxicillin',                  'Capsule', '500mg',       1, 1),
('Cotrimoxazole',             'Co-trimoxazole',         'Sulfamethoxazole+Trimethoprim','Tablet',  '480mg',       1, 1),
('Artémether-Luméfantrine',   'Artemether-Lumefantrine','AL',                           'Tablet',  '20/120mg',    1, 1),
('Quinine',                   'Quinine',                'Quinine sulfate',              'Tablet',  '300mg',       1, 1),
('Métronidazole',             'Metronidazole',          'Metronidazole',                'Tablet',  '250mg',       1, 1),
('Ibuprofène',                'Ibuprofen',              'Ibuprofen',                    'Tablet',  '400mg',       0, 1),
('Amlodipine',                'Amlodipine',             'Amlodipine',                   'Tablet',  '5mg',         1, 1),
('Metformine',                'Metformin',              'Metformin HCl',                'Tablet',  '500mg',       1, 1),
('Vitamine C',                'Vitamin C',              'Ascorbic acid',                'Tablet',  '500mg',       0, 0),
('Fer + Acide Folique',       'Iron + Folic Acid',      'Ferrous sulfate',              'Tablet',  '200mg+5mg',   0, 1),
('Oméprazole',                'Omeprazole',             'Omeprazole',                   'Capsule', '20mg',        1, 1),
('Ciprofloxacine',            'Ciprofloxacin',          'Ciprofloxacin',               'Tablet',  '500mg',       1, 1),
('Albendazole',               'Albendazole',            'Albendazole',                  'Tablet',  '400mg',       0, 1);

SELECT 'Medlynk Africa database ready' AS status;
GO