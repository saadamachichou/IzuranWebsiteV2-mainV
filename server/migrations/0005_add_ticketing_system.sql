-- Migration: Add Ticketing System
-- This migration adds the ticketing system tables for QR code-based event tickets

-- Create ticket status enum
CREATE TYPE "ticket_status" AS ENUM ('active', 'used', 'cancelled', 'expired');

-- Create ticket type enum
CREATE TYPE "ticket_type" AS ENUM ('early_bird', 'second_phase', 'last_phase', 'vip');

-- Create tickets table
CREATE TABLE "tickets" (
  "id" serial PRIMARY KEY,
  "ticket_id" text NOT NULL UNIQUE,
  "event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "ticket_type" "ticket_type" NOT NULL,
  "status" "ticket_status" NOT NULL DEFAULT 'active',
  "price" decimal(10,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'MAD',
  "attendee_name" text NOT NULL,
  "attendee_email" text NOT NULL,
  "attendee_phone" text,
  "qr_code_data" text NOT NULL,
  "used_at" timestamp,
  "used_by" text,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp
);

-- Create event ticket limits table
CREATE TABLE "event_ticket_limits" (
  "id" serial PRIMARY KEY,
  "event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "ticket_type" "ticket_type" NOT NULL,
  "max_tickets" integer NOT NULL,
  "sold_tickets" integer NOT NULL DEFAULT 0,
  "price" decimal(10,2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'MAD',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp
);

-- Create ticket validation logs table
CREATE TABLE "ticket_validation_logs" (
  "id" serial PRIMARY KEY,
  "ticket_id" integer NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
  "validation_type" text NOT NULL,
  "validated_by" text,
  "ip_address" text,
  "user_agent" text,
  "result" text NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX "idx_tickets_event_id" ON "tickets"("event_id");
CREATE INDEX "idx_tickets_user_id" ON "tickets"("user_id");
CREATE INDEX "idx_tickets_order_id" ON "tickets"("order_id");
CREATE INDEX "idx_tickets_status" ON "tickets"("status");
CREATE INDEX "idx_tickets_ticket_id" ON "tickets"("ticket_id");

CREATE INDEX "idx_event_ticket_limits_event_id" ON "event_ticket_limits"("event_id");
CREATE INDEX "idx_event_ticket_limits_ticket_type" ON "event_ticket_limits"("ticket_type");

CREATE INDEX "idx_ticket_validation_logs_ticket_id" ON "ticket_validation_logs"("ticket_id");
CREATE INDEX "idx_ticket_validation_logs_created_at" ON "ticket_validation_logs"("created_at"); 