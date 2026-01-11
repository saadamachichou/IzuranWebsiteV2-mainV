import nodemailer from 'nodemailer';
import { QRCodeService, TicketQRData } from './qr-code';
import { Event, Ticket } from '../../shared/schema';

export interface TicketEmailData {
  ticket: Ticket;
  event: Event;
  attendeeName: string;
  attendeeEmail: string;
  qrCodeBuffer: Buffer;
}

export class TicketEmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  /**
   * Send ticket confirmation email with QR code
   */
  static async sendTicketEmail(data: TicketEmailData): Promise<void> {
    const { ticket, event, attendeeName, attendeeEmail, qrCodeBuffer } = data;

    const emailHtml = this.generateTicketEmailHTML(ticket, event, attendeeName);
    const emailText = this.generateTicketEmailText(ticket, event, attendeeName);

    try {
      await this.transporter.sendMail({
        from: `"Izuran Events" <${process.env.SMTP_USER}>`,
        to: attendeeEmail,
        subject: `Your Ticket for ${event.name} - Izuran Events`,
        text: emailText,
        html: emailHtml,
        attachments: [
          {
            filename: `ticket-${ticket.ticketId}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png'
          }
        ]
      });

      console.log(`Ticket email sent to ${attendeeEmail} for event ${event.name}`);
    } catch (error) {
      console.error('Failed to send ticket email:', error);
      throw new Error('Failed to send ticket email');
    }
  }

  /**
   * Generate HTML email template
   */
  private static generateTicketEmailHTML(ticket: Ticket, event: Event, attendeeName: string): string {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Ticket - ${event.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FFA500; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .ticket-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .qr-code { text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Your Ticket Confirmation</h1>
            <h2>${event.name}</h2>
          </div>
          
          <div class="content">
            <p>Dear ${attendeeName},</p>
            
            <p>Thank you for purchasing a ticket for <strong>${event.name}</strong>!</p>
            
            <div class="ticket-info">
              <h3>📅 Event Details</h3>
              <p><strong>Date & Time:</strong> ${eventDate}</p>
              <p><strong>Location:</strong> ${event.location}</p>
              <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
              <p><strong>Ticket Type:</strong> ${ticket.ticketType.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Price:</strong> ${ticket.price} ${ticket.currency}</p>
            </div>
            
            <div class="important">
              <h4>⚠️ Important Information</h4>
              <ul>
                <li>Please arrive 30 minutes before the event starts</li>
                <li>Bring a valid ID and this ticket (QR code)</li>
                <li>Each ticket is valid for one person only</li>
                <li>No refunds or exchanges unless the event is cancelled</li>
              </ul>
            </div>
            
            <div class="qr-code">
              <h3>📱 Your QR Code</h3>
              <p>Scan this QR code at the entrance:</p>
              <img src="cid:ticket-${ticket.ticketId}.png" alt="QR Code" style="max-width: 200px;">
            </div>
            
            <p>If you have any questions, please contact us at <a href="mailto:support@izuran.com">support@izuran.com</a></p>
            
            <p>We look forward to seeing you at the event!</p>
            
            <p>Best regards,<br>The Izuran Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Izuran Events. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email template
   */
  private static generateTicketEmailText(ticket: Ticket, event: Event, attendeeName: string): string {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
Your Ticket Confirmation - ${event.name}

Dear ${attendeeName},

Thank you for purchasing a ticket for ${event.name}!

Event Details:
- Date & Time: ${eventDate}
- Location: ${event.location}
- Ticket ID: ${ticket.ticketId}
- Ticket Type: ${ticket.ticketType.replace('_', ' ').toUpperCase()}
- Price: ${ticket.price} ${ticket.currency}

Important Information:
- Please arrive 30 minutes before the event starts
- Bring a valid ID and this ticket (QR code)
- Each ticket is valid for one person only
- No refunds or exchanges unless the event is cancelled

Your QR code is attached to this email. Please present it at the entrance.

If you have any questions, please contact us at support@izuran.com

We look forward to seeing you at the event!

Best regards,
The Izuran Team

© 2024 Izuran Events. All rights reserved.
    `;
  }
} 