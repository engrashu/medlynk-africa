USE medlynk_africa;

ALTER TABLE pharmacies ADD
    listing_status NVARCHAR(20) DEFAULT 'public';

ALTER TABLE facilities ADD
    listing_status NVARCHAR(20) DEFAULT 'public';
GO