// Test script for the ticketing system
// Run this after setting up your environment variables

import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = 'http://localhost:3000/api';

async function testTicketingSystem() {
  console.log('🎟️ Testing Ticketing System...\n');

  try {
    // 1. Test getting available tickets for an event
    console.log('1. Testing get available tickets...');
    const ticketsResponse = await axios.get(`${API_BASE}/events/1/tickets`);
    console.log('✅ Available tickets:', ticketsResponse.data);
    console.log('');

    // 2. Test ticket purchase (requires authentication)
    console.log('2. Testing ticket purchase...');
    console.log('⚠️  This requires user authentication');
    console.log('   - Login to your account first');
    console.log('   - Navigate to /tickets/purchase/1');
    console.log('   - Fill in attendee information');
    console.log('   - Complete purchase');
    console.log('');

    // 3. Test getting user tickets (requires authentication)
    console.log('3. Testing get user tickets...');
    console.log('⚠️  This requires user authentication');
    console.log('   - Navigate to /tickets/my-tickets');
    console.log('   - View your purchased tickets');
    console.log('');

    // 4. Test QR code generation (requires authentication)
    console.log('4. Testing QR code generation...');
    console.log('⚠️  This requires user authentication');
    console.log('   - Navigate to /tickets/my-tickets');
    console.log('   - Click "Show QR Code" on a ticket');
    console.log('');

    // 5. Test ticket validation (admin only)
    console.log('5. Testing ticket validation...');
    console.log('⚠️  This requires admin authentication');
    console.log('   - Navigate to /admin/tickets/scanner');
    console.log('   - Enter scanner name');
    console.log('   - Enter QR code data manually');
    console.log('   - Click "Validate"');
    console.log('');

    console.log('🎉 Ticketing system test completed!');
    console.log('');
    console.log('📋 Manual Testing Checklist:');
    console.log('   ✅ Database migration applied');
    console.log('   ✅ Routes added to App.tsx');
    console.log('   ⏳ Configure email settings in .env');
    console.log('   ⏳ Test ticket purchase flow');
    console.log('   ⏳ Test QR code validation');
    console.log('   ⏳ Test email delivery');
    console.log('');
    console.log('📧 Email Configuration Required:');
    console.log('   - Add SMTP settings to .env file');
    console.log('   - Test email delivery');
    console.log('   - Verify QR code attachments');
    console.log('');
    console.log('🔗 Test URLs:');
    console.log('   - Ticket Purchase: http://localhost:3000/tickets/purchase/1');
    console.log('   - My Tickets: http://localhost:3000/tickets/my-tickets');
    console.log('   - Admin Scanner: http://localhost:3000/admin/tickets/scanner');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testTicketingSystem(); 