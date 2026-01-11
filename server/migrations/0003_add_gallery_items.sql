-- Migration: Add gallery_items table
-- Created: 2024-01-XX

CREATE TABLE IF NOT EXISTS gallery_items (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  src TEXT NOT NULL,
  thumbnail TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_display_order ON gallery_items(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON gallery_items(created_at); 