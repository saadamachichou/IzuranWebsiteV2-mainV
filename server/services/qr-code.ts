import QRCode from 'qrcode';
import crypto from 'crypto';

export interface TicketQRData {
  ticketId: string;
  eventId: number;
  userId: number;
  orderId: number;
  attendeeName: string;
  attendeeEmail: string;
  timestamp: number;
}

export class QRCodeService {
  private static readonly SECRET_KEY = process.env.QR_SECRET_KEY || 'izuran-ticket-secret-key-2024';
  private static readonly ALGORITHM = 'aes-256-cbc';

  /**
   * Generate a unique ticket ID
   */
  static generateTicketId(): string {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Encrypt ticket data for QR code
   */
  static encryptTicketData(data: TicketQRData): string {
    const jsonData = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.SECRET_KEY);
    
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt ticket data from QR code
   */
  static decryptTicketData(encryptedData: string): TicketQRData | null {
    try {
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher(this.ALGORITHM, this.SECRET_KEY);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted) as TicketQRData;
    } catch (error) {
      console.error('Failed to decrypt ticket data:', error);
      return null;
    }
  }

  /**
   * Generate QR code as data URL
   */
  static async generateQRCode(data: TicketQRData): Promise<string> {
    const encryptedData = this.encryptTicketData(data);
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(encryptedData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as buffer (for email attachments)
   */
  static async generateQRCodeBuffer(data: TicketQRData): Promise<Buffer> {
    const encryptedData = this.encryptTicketData(data);
    
    try {
      const qrCodeBuffer = await QRCode.toBuffer(encryptedData, {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeBuffer;
    } catch (error) {
      console.error('Failed to generate QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Validate QR code data
   */
  static validateQRCodeData(data: TicketQRData): boolean {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return !!(
      data.ticketId &&
      data.eventId &&
      data.userId &&
      data.orderId &&
      data.attendeeName &&
      data.attendeeEmail &&
      (now - data.timestamp) < maxAge
    );
  }
} 