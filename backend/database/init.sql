-- Create database and user
CREATE DATABASE codementorx_db;
CREATE USER codementorx_user WITH ENCRYPTED PASSWORD '@code123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE codementorx_db TO codementorx_user;

-- Connect to the new database
\c codementorx_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO codementorx_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO codementorx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO codementorx_user;

-- Create custom functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';