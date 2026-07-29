USE medlynk_africa;

-- Add new columns for multi-tenant support
ALTER TABLE users ADD
    account_type    NVARCHAR(30) DEFAULT 'patient',
    organization_id UNIQUEIDENTIFIER NULL,
    organization_name NVARCHAR(200) NULL,
    is_admin        BIT DEFAULT 0,
    last_login      DATETIME2 NULL;

-- Create index on account_type for fast filtering
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_org ON users(organization_id);