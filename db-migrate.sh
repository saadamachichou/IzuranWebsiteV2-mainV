#!/bin/bash

echo "Running database migration with explicit artist type enum creation"

# Execute a SQL statement directly to create the artist_type enum if it doesn't exist
psql $DATABASE_URL -c "DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'artist_type') THEN
        CREATE TYPE artist_type AS ENUM ('dj', 'producer', 'hybrid');
    END IF;
END \$\$;"

# Add the artist_type column to the users table if it doesn't exist
psql $DATABASE_URL -c "DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'artist_type') THEN
        ALTER TABLE users ADD COLUMN artist_type artist_type;
    END IF;
END \$\$;"

echo "Migration completed"