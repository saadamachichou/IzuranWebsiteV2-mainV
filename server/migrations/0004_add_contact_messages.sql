-- Migration: Add contact_messages table
-- Date: 2024-01-15

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  replied_at TIMESTAMP,
  admin_reply TEXT
);

-- Add some sample data for testing
INSERT INTO contact_messages (name, email, phone, subject, message, status, created_at) VALUES
('John Doe', 'john@example.com', '+1234567890', 'General Inquiry', 'Hello, I''m interested in your music and would like to know more about your upcoming events.', 'unread', NOW() - INTERVAL '1 day'),
('Jane Smith', 'jane@example.com', NULL, 'Event Information', 'Could you please provide more details about the upcoming festival? I''m very interested in attending.', 'read', NOW() - INTERVAL '2 days'),
('Mike Johnson', 'mike@example.com', '+1987654321', 'Partnership Opportunity', 'I represent a local venue and would like to discuss potential collaboration opportunities.', 'replied', NOW() - INTERVAL '3 days'); 