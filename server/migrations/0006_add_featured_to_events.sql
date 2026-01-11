-- Add featured column to events table
ALTER TABLE events ADD COLUMN featured BOOLEAN DEFAULT FALSE; 