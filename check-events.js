import { db } from './db/index.ts';
import { events, eventTicketLimits } from './shared/schema.ts';

async function checkEvents() {
  try {
    console.log('🔍 Checking events in database...\n');
    
    // Check events
    const eventsList = await db.select().from(events);
    console.log('📅 Events found:', eventsList.length);
    eventsList.forEach(event => {
      console.log(`   - ID: ${event.id}, Name: ${event.name}, Date: ${event.date}`);
    });
    
    // Check ticket limits
    const ticketLimits = await db.select().from(eventTicketLimits);
    console.log('\n🎟️ Ticket limits found:', ticketLimits.length);
    ticketLimits.forEach(limit => {
      console.log(`   - Event ID: ${limit.eventId}, Type: ${limit.ticketType}, Price: ${limit.price} ${limit.currency}`);
    });
    
    if (eventsList.length > 0 && ticketLimits.length === 0) {
      console.log('\n⚠️  No ticket limits found. Creating sample ticket limits...');
      
      // Create ticket limits for the first event
      const firstEvent = eventsList[0];
      console.log(`Creating ticket limits for event: ${firstEvent.name} (ID: ${firstEvent.id})`);
      
      const ticketLimitData = {
        eventId: firstEvent.id,
        ticketType: 'early_bird',
        maxTickets: 50,
        soldTickets: 0,
        price: '150.00',
        currency: 'USD',
        isActive: true
      };
      
      const [newTicketLimit] = await db.insert(eventTicketLimits)
        .values(ticketLimitData)
        .returning();
      
      console.log('✅ Created ticket limit:', newTicketLimit);
      
      // Create a second ticket type
      const vipTicketData = {
        eventId: firstEvent.id,
        ticketType: 'vip',
        maxTickets: 20,
        soldTickets: 0,
        price: '250.00',
        currency: 'USD',
        isActive: true
      };
      
      const [newVipTicket] = await db.insert(eventTicketLimits)
        .values(vipTicketData)
        .returning();
      
      console.log('✅ Created VIP ticket limit:', newVipTicket);
    }
    
    console.log('\n🎉 Event check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEvents(); 