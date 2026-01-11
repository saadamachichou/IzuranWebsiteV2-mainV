// Simple script to set up ticket limits using the API
// Run this after creating your .env file

const API_BASE = 'http://localhost:3000/api';

async function setupTicketLimits() {
  console.log('🎟️ Setting up ticket limits...\n');

  try {
    // First, let's check what events we have
    console.log('1. Checking available events...');
    const eventsResponse = await fetch(`${API_BASE}/admin/events`);
    const events = await eventsResponse.json();
    
    console.log(`Found ${events.length} events:`);
    events.forEach(event => {
      console.log(`   - ID: ${event.id}, Name: ${event.name}, Date: ${event.date}`);
    });

    if (events.length === 0) {
      console.log('❌ No events found. Please create an event first.');
      return;
    }

    // Create ticket limits for the first event
    const firstEvent = events[0];
    console.log(`\n2. Creating ticket limits for event: ${firstEvent.name} (ID: ${firstEvent.id})`);

    const ticketLimitData = {
      ticketType: 'early_bird',
      maxTickets: 50,
      soldTickets: 0,
      price: '150.00',
      currency: 'USD',
      isActive: true
    };

    console.log('Creating early bird tickets...');
    const earlyBirdResponse = await fetch(`${API_BASE}/admin/events/${firstEvent.id}/ticket-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketLimitData)
    });

    if (earlyBirdResponse.ok) {
      const earlyBirdTicket = await earlyBirdResponse.json();
      console.log('✅ Created early bird tickets:', earlyBirdTicket);
    } else {
      console.log('❌ Failed to create early bird tickets');
    }

    // Create VIP tickets
    const vipTicketData = {
      ticketType: 'vip',
      maxTickets: 20,
      soldTickets: 0,
      price: '250.00',
      currency: 'USD',
      isActive: true
    };

    console.log('Creating VIP tickets...');
    const vipResponse = await fetch(`${API_BASE}/admin/events/${firstEvent.id}/ticket-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vipTicketData)
    });

    if (vipResponse.ok) {
      const vipTicket = await vipResponse.json();
      console.log('✅ Created VIP tickets:', vipTicket);
    } else {
      console.log('❌ Failed to create VIP tickets');
    }

    console.log('\n🎉 Ticket limits setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Login to your account');
    console.log('   2. Navigate to: http://localhost:3000/tickets/purchase/' + firstEvent.id);
    console.log('   3. Purchase a ticket');
    console.log('   4. Check your email for the QR code');
    console.log('   5. Test validation at: http://localhost:3000/admin/tickets/scanner');

  } catch (error) {
    console.error('❌ Error setting up ticket limits:', error);
  }
}

setupTicketLimits(); 