#!/bin/bash

echo "Running migration to add tiered ticket pricing to events table"

psql $DATABASE_URL <<SQL
-- Add new columns for tiered pricing
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS early_bird_price TEXT,
ADD COLUMN IF NOT EXISTS early_bird_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS second_phase_price TEXT,
ADD COLUMN IF NOT EXISTS second_phase_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_phase_price TEXT;

-- Copy data from ticket_price to last_phase_price for existing events
UPDATE events SET last_phase_price = ticket_price WHERE last_phase_price IS NULL;

SQL

echo "Migration completed - tiered ticketing structure added"