# 🎟️ Ticketing System Setup Guide

## Overview

The Izuran ticketing system is a complete solution for event ticket management, including purchase flow, QR code generation, email delivery, and admin validation. This guide will walk you through the complete setup process.

## Environment Variables Configuration

Create a `.env` file in your project root with these variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/izuran_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-2024"

# Email Configuration (Required for ticket emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# QR Code Security (Required for QR code encryption)
QR_SECRET_KEY="your-qr-code-secret-key-2024"

# PayPal Configuration (if using PayPal)
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# Google OAuth (if using Google auth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Session Secret
SESSION_SECRET="your-session-secret-key-2024"
```

## Email Setup Instructions

### For Gmail:
1. **Enable 2-factor authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the generated password** as `SMTP_PASS`

### For Other Email Providers:
- **Outlook/Hotmail**: Use `smtp-mail.outlook.com` as SMTP_HOST
- **Yahoo**: Use `smtp.mail.yahoo.com` as SMTP_HOST
- **Custom SMTP**: Use your provider's SMTP settings

## Quick Setup Scripts

### 1. Test the System
```bash
node test-ticketing.js
```

### 2. Set Up Ticket Limits
```bash
node setup-tickets.js
```

## Manual Setup Process

### Step 1: Create Ticket Limits for an Event

First, you need to set up ticket limits for an event. Use the admin API:

```bash
# Create ticket limits for event ID 4 (Izuran's first gathering)
curl -X POST http://localhost:3000/api/admin/events/4/ticket-limits \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "ticketType": "early_bird",
    "maxTickets": 50,
    "soldTickets": 0,
    "price": "150.00",
    "currency": "USD",
    "isActive": true
  }'
```

### Step 2: Test Ticket Purchase Flow

1. **Login to your user account**
2. **Navigate to**: `http://localhost:3000/tickets/purchase/4` (replace 4 with your event ID)
3. **Fill in attendee information**:
   - Attendee Name
   - Attendee Email
   - Attendee Phone (optional)
   - Select ticket type
4. **Complete purchase**
5. **Check email for QR code**

### Step 3: Test QR Code Validation

1. **Go to admin scanner**: `http://localhost:3000/admin/tickets/scanner`
2. **Enter scanner name**
3. **Scan or enter QR code data** manually
4. **Validate ticket**
5. **Mark as used**

## Adding Ticket Purchase Buttons

Add this button to your event pages:

```tsx
import { useLocation } from 'wouter';

// In your event component
const [, setLocation] = useLocation();

const handleBuyTickets = () => {
  setLocation(`/tickets/purchase/${event.id}`);
};

<Button onClick={handleBuyTickets} className="bg-amber-500 hover:bg-amber-600 text-white">
  Buy Tickets
</Button>
```

## Admin Ticket Management

### View Event Tickets:
- Navigate to `/admin/events/{eventId}/tickets` (API endpoint)
- Or create an admin interface to view all tickets

### Create Ticket Limits:
- Use the API endpoint: `POST /api/admin/events/{eventId}/ticket-limits`
- Set pricing tiers and availability

### QR Code Scanner:
- Navigate to `/admin/tickets/scanner`
- Scan tickets at events
- Mark tickets as used

## Security Features

✅ **Encrypted QR Codes**: All ticket data is encrypted with `QR_SECRET_KEY`
✅ **Unique Ticket IDs**: Each ticket has a unique identifier
✅ **Validation Logging**: All scans are logged for security
✅ **Prevent Double Usage**: Tickets can only be used once
✅ **Expiration Support**: Tickets can expire after events
✅ **Admin Authentication**: All admin endpoints require authentication
✅ **User Authentication**: Ticket purchase requires user login

## Testing URLs

### Public URLs:
- **Ticket Purchase**: `http://localhost:3000/tickets/purchase/4`
- **My Tickets**: `http://localhost:3000/tickets/my-tickets`

### Admin URLs:
- **Admin Scanner**: `http://localhost:3000/admin/tickets/scanner`
- **Admin Dashboard**: `http://localhost:3000/admin`

## Troubleshooting

### Email Not Sending:
- Check SMTP credentials in `.env`
- Verify email provider settings
- Check server logs for errors
- Ensure 2-factor authentication is enabled for Gmail

### QR Codes Not Working:
- Verify `QR_SECRET_KEY` is set in `.env`
- Check ticket data format
- Ensure QR code library is installed
- Test QR code generation manually

### Database Issues:
- Run `npx drizzle-kit push` to apply migrations
- Check database connection
- Verify table structure
- Ensure PostgreSQL is running

### Authentication Issues:
- Check session configuration
- Verify JWT_SECRET is set
- Ensure cookies are enabled
- Check admin role permissions

### API Errors:
- Verify server is running on port 3000
- Check authentication headers
- Ensure proper content-type headers
- Validate request body format

## API Endpoints Summary

### Public Endpoints:
- `GET /api/events/:eventId/tickets` - Get available tickets
- `POST /api/tickets/purchase` - Purchase tickets
- `GET /api/tickets/my-tickets` - User's tickets
- `GET /api/tickets/:ticketId/qr-code` - Generate QR code

### Admin Endpoints:
- `POST /api/tickets/validate` - Validate QR codes
- `POST /api/tickets/:ticketId/use` - Mark ticket as used
- `GET /api/admin/events/:eventId/tickets` - View event tickets
- `POST /api/admin/events/:eventId/ticket-limits` - Create ticket limits
- `PUT /api/admin/events/:eventId/ticket-limits/:limitId` - Update ticket limits

## Database Schema

### Event Ticket Limits:
```sql
CREATE TABLE event_ticket_limits (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  ticket_type TEXT NOT NULL,
  max_tickets INTEGER NOT NULL,
  sold_tickets INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tickets:
```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id),
  ticket_type TEXT NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  qr_code_data TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  used_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Ticket Validation Logs:
```sql
CREATE TABLE ticket_validation_logs (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id),
  validated_by TEXT NOT NULL,
  validation_result TEXT NOT NULL,
  validation_time TIMESTAMP DEFAULT NOW()
);
```

## Next Steps

1. **Add ticket purchase buttons** to event pages
2. **Create admin interfaces** for ticket management
3. **Set up email templates** customization
4. **Add ticket analytics** and reporting
5. **Implement ticket refunds** if needed
6. **Add payment gateway integration** (PayPal, Stripe)
7. **Create mobile app** for QR code scanning
8. **Add bulk ticket operations** for admin

## Production Checklist

- [ ] Set up production database
- [ ] Configure production email settings
- [ ] Set secure environment variables
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Test all payment flows
- [ ] Verify email delivery
- [ ] Test QR code validation
- [ ] Set up backup procedures
- [ ] Configure rate limiting

## Support

If you encounter issues:

1. **Check the server logs** for detailed error messages
2. **Verify environment variables** are correctly set
3. **Test API endpoints** individually
4. **Check database connectivity**
5. **Verify email configuration**

The ticketing system is now ready for production use! 🎉

## Quick Reference

### Current Event ID: 4 (Izuran's first gathering)
### Test Purchase URL: `http://localhost:3000/tickets/purchase/4`
### Admin Scanner: `http://localhost:3000/admin/tickets/scanner`
### My Tickets: `http://localhost:3000/tickets/my-tickets` 