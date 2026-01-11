-- Add performance indexes for better query performance
-- This migration adds indexes on frequently queried fields

-- Artists table indexes
CREATE INDEX IF NOT EXISTS idx_artists_display_order ON artists(display_order);
CREATE INDEX IF NOT EXISTS idx_artists_created_at ON artists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Podcasts table indexes
CREATE INDEX IF NOT EXISTS idx_podcasts_display_order ON podcasts(display_order);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_slug ON podcasts(slug);

-- Articles table indexes
CREATE INDEX IF NOT EXISTS idx_articles_publish_date ON articles(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Favorites table indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_artists_order_created ON artists(display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, date DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_created ON products(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_order_created ON podcasts(display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_publish ON articles(category, publish_date DESC);
