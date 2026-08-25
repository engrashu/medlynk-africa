USE medlynk_africa;

UPDATE pharmacies SET listing_status = 'verified' WHERE is_verified = 1;
UPDATE pharmacies SET listing_status = 'public' WHERE is_verified = 0;
UPDATE facilities SET listing_status = 'verified' WHERE is_verified = 1;
UPDATE facilities SET listing_status = 'public' WHERE is_verified = 0;
GO