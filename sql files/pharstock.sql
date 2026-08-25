CREATE VIEW pharmacy_stock_with_freshness AS
SELECT
    ps.*,
    DATEDIFF(HOUR, ps.updated_at, GETDATE()) AS hours_since_update,
    CASE
        WHEN DATEDIFF(HOUR, ps.updated_at, GETDATE()) <= 6 THEN 'fresh'
        WHEN DATEDIFF(HOUR, ps.updated_at, GETDATE()) <= 24 THEN 'recent'
        WHEN DATEDIFF(HOUR, ps.updated_at, GETDATE()) <= 72 THEN 'aging'
        ELSE 'stale'
    END AS freshness
FROM pharmacy_stock ps;
GO