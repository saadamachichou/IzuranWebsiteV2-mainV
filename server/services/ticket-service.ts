import { db } from '../../db';
import { tickets, events, eventTicketLimits, ticketValidationLogs, orders } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { QRCodeService, TicketQRData } from './qr-code';
import { TicketEmailService } from './ticket-email';
import { Ticket, Event, EventTicketLimit } from '../../shared/schema';

export interface CreateTicketData {
  eventId: number;
  userId: number;
  orderId: number;
  ticketType: 'early_bird' | 'second_phase' | 'last_phase' | 'vip';
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  price: number;
  currency?: string;
}

export interface TicketValidationResult {
  isValid: boolean;
  ticket?: Ticket;
  event?: Event;
  message: string;
  status: 'valid' | 'invalid' | 'already_used' | 'expired' | 'not_found' | 'cancelled';
}

export class TicketService {
  /**
   * Create a new ticket
   */
  static async createTicket(data: CreateTicketData): Promise<Ticket> {
    // Check if tickets are available
    const ticketLimit = await this.getTicketLimit(data.eventId, data.ticketType);
    if (!ticketLimit) {
      throw new Error(`No ticket limit found for event ${data.eventId} and type ${data.ticketType}`);
    }

    if (ticketLimit.soldTickets >= ticketLimit.maxTickets) {
      throw new Error(`No tickets available for ${data.ticketType} tier`);
    }

    // Generate unique ticket ID
    const ticketId = QRCodeService.generateTicketId();

    // Create QR code data
    const qrData: TicketQRData = {
      ticketId,
      eventId: data.eventId,
      userId: data.userId,
      orderId: data.orderId,
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      timestamp: Date.now()
    };

    const qrCodeData = QRCodeService.encryptTicketData(qrData);

    // Create ticket in database
    const [ticket] = await db.insert(tickets).values({
      ticketId,
      eventId: data.eventId,
      userId: data.userId,
      orderId: data.orderId,
      ticketType: data.ticketType,
      price: data.price.toString(),
      currency: data.currency || 'USD',
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      attendeePhone: data.attendeePhone,
      qrCodeData
    }).returning();

    // Update sold tickets count
    await db.update(eventTicketLimits)
      .set({ soldTickets: ticketLimit.soldTickets + 1 })
      .where(and(
        eq(eventTicketLimits.eventId, data.eventId),
        eq(eventTicketLimits.ticketType, data.ticketType)
      ));

    return ticket;
  }

  /**
   * Get ticket by ID
   */
  static async getTicket(ticketId: string): Promise<Ticket | null> {
    const [ticket] = await db.select()
      .from(tickets)
      .where(eq(tickets.ticketId, ticketId));
    
    return ticket || null;
  }

  /**
   * Get ticket with event details
   */
  static async getTicketWithEvent(ticketId: string): Promise<{ ticket: Ticket; event: Event } | null> {
    const result = await db.select({
      ticket: tickets,
      event: events
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .where(eq(tickets.ticketId, ticketId));

    return result[0] || null;
  }

  /**
   * Validate ticket QR code
   */
  static async validateTicket(qrCodeData: string, validatedBy?: string): Promise<TicketValidationResult> {
    try {
      // Decrypt QR code data
      const ticketData = QRCodeService.decryptTicketData(qrCodeData);
      if (!ticketData) {
        return {
          isValid: false,
          message: 'Invalid QR code format',
          status: 'invalid'
        };
      }

      // Validate QR code data
      if (!QRCodeService.validateQRCodeData(ticketData)) {
        return {
          isValid: false,
          message: 'QR code data is invalid or expired',
          status: 'invalid'
        };
      }

      // Get ticket from database
      const ticket = await this.getTicket(ticketData.ticketId);
      if (!ticket) {
        return {
          isValid: false,
          message: 'Ticket not found',
          status: 'not_found'
        };
      }

      // Check if ticket is already used
      if (ticket.status === 'used') {
        return {
          isValid: false,
          ticket,
          message: 'Ticket has already been used',
          status: 'already_used'
        };
      }

      // Check if ticket is cancelled or expired
      if (ticket.status === 'cancelled' || ticket.status === 'expired') {
        return {
          isValid: false,
          ticket,
          message: `Ticket is ${ticket.status}`,
          status: ticket.status as 'cancelled' | 'expired'
        };
      }

      // Check if event has passed
      const event = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
      if (event[0] && new Date(event[0].date) < new Date()) {
        return {
          isValid: false,
          ticket,
          message: 'Event has already passed',
          status: 'expired'
        };
      }

      // Log validation attempt
      await this.logValidation(ticket.id, 'scan', validatedBy, 'valid');

      return {
        isValid: true,
        ticket,
        message: 'Ticket is valid',
        status: 'valid'
      };

    } catch (error) {
      console.error('Ticket validation error:', error);
      return {
        isValid: false,
        message: 'Error validating ticket',
        status: 'invalid'
      };
    }
  }

  /**
   * Mark ticket as used
   */
  static async markTicketAsUsed(ticketId: string, usedBy: string): Promise<Ticket | null> {
    const [ticket] = await db.update(tickets)
      .set({
        status: 'used',
        usedAt: new Date(),
        usedBy
      })
      .where(eq(tickets.ticketId, ticketId))
      .returning();

    return ticket || null;
  }

  /**
   * Get ticket limit for event and type
   */
  static async getTicketLimit(eventId: number, ticketType: string): Promise<EventTicketLimit | null> {
    const [limit] = await db.select()
      .from(eventTicketLimits)
      .where(and(
        eq(eventTicketLimits.eventId, eventId),
        eq(eventTicketLimits.ticketType, ticketType as any),
        eq(eventTicketLimits.isActive, true)
      ));

    return limit || null;
  }

  /**
   * Get available tickets for event
   */
  static async getAvailableTickets(eventId: number): Promise<EventTicketLimit[]> {
    return await db.select()
      .from(eventTicketLimits)
      .where(and(
        eq(eventTicketLimits.eventId, eventId),
        eq(eventTicketLimits.isActive, true)
      ));
  }

  /**
   * Get user's tickets
   */
  static async getUserTickets(userId: number): Promise<Ticket[]> {
    return await db.select()
      .from(tickets)
      .where(eq(tickets.userId, userId));
  }

  /**
   * Get event tickets (admin)
   */
  static async getEventTickets(eventId: number): Promise<Ticket[]> {
    return await db.select()
      .from(tickets)
      .where(eq(tickets.eventId, eventId));
  }

  /**
   * Log ticket validation attempt
   */
  static async logValidation(
    ticketId: number,
    validationType: string,
    validatedBy?: string,
    result: string = 'valid',
    notes?: string
  ): Promise<void> {
    await db.insert(ticketValidationLogs).values({
      ticketId,
      validationType,
      validatedBy,
      result,
      notes
    });
  }

  /**
   * Send ticket email with QR code
   */
  static async sendTicketEmail(ticket: Ticket, event: Event): Promise<void> {
    const qrData: TicketQRData = {
      ticketId: ticket.ticketId,
      eventId: ticket.eventId,
      userId: ticket.userId,
      orderId: ticket.orderId,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      timestamp: Date.now()
    };

    const qrCodeBuffer = await QRCodeService.generateQRCodeBuffer(qrData);

    await TicketEmailService.sendTicketEmail({
      ticket,
      event,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      qrCodeBuffer
    });
  }
} 