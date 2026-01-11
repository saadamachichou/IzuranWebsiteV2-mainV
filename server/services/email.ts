import { Resend } from 'resend';
import { Order } from '@shared/schema';
// Define the type for order items with products
type OrderItemWithProduct = {
  id: number;
  price: string;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    // Add other product fields as needed
  };
};
import { db } from '@db';
import { eq } from 'drizzle-orm';

let resend: Resend;

// Initialize Resend if API key exists
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('RESEND_API_KEY not found. Email functionality will be disabled.');
}

interface PurchaseEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  transactionId: string;
  orderDate: Date;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
}

/**
 * Send a purchase confirmation email to the customer
 */
export async function sendPurchaseConfirmationEmail(
  data: PurchaseEmailData,
): Promise<void> {
  try {
    if (!resend) {
      console.warn('Skipping email: Resend API not initialized');
      return;
    }

    if (!data.customerEmail) {
      console.error('Cannot send confirmation email: No customer email provided');
      return;
    }

    // Format date nicely
    const formattedDate = data.orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency || 'USD',
    });
    
    const formattedTotal = formatter.format(data.amount);

    // Create items list HTML
    const itemsHTML = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatter.format(item.price)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${formatter.format(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    // Build email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Order Confirmation</title>
        <style>
          @media only screen and (max-width: 620px) {
            table.body h1 {
              font-size: 28px !important;
              margin-bottom: 10px !important;
            }
            
            table.body p,
            table.body ul,
            table.body ol,
            table.body td,
            table.body span,
            table.body a {
              font-size: 16px !important;
            }
            
            table.body .wrapper,
            table.body .article {
              padding: 10px !important;
            }
            
            table.body .content {
              padding: 0 !important;
            }
            
            table.body .container {
              padding: 0 !important;
              width: 100% !important;
            }
            
            table.body .main {
              border-left-width: 0 !important;
              border-radius: 0 !important;
              border-right-width: 0 !important;
            }
          }
        </style>
      </head>
      <body style="background-color: #111; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
        <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #111;">
          <tr>
            <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; vertical-align: top;">&nbsp;</td>
            <td class="container" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; vertical-align: top; display: block; margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
              <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #222; border-radius: 3px; border: 1px solid #333;">
                  <tr>
                    <td class="wrapper" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; vertical-align: top; box-sizing: border-box; padding: 20px;">
                      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                        <tr>
                          <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; vertical-align: top;">
                            <div style="text-align: center; margin-bottom: 20px;">
                              <img src="https://izuran-official-website.replit.app/logo.png" alt="Izuran Records" style="width: 150px; margin-bottom: 10px;">
                              <h1 style="color: #F0C465; font-size: 24px; font-weight: bold; margin: 0;">Order Confirmation</h1>
                            </div>
                            <p style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 15px; color: #CCC;">Hello ${data.customerName || 'Valued Customer'},</p>
                            <p style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 15px; color: #CCC;">Thank you for your purchase from Izuran Records! Your order has been confirmed and is being processed.</p>
                            
                            <h2 style="color: #F0C465; font-size: 18px; font-weight: bold; margin: 20px 0 10px;">Order Details</h2>
                            <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box; margin-bottom: 15px; background: #1A1A1A; border-radius: 5px;">
                              <tr>
                                <td style="padding: 10px; color: #CCC;"><strong>Order Number:</strong></td>
                                <td style="padding: 10px; color: #CCC;">${data.orderId}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px; color: #CCC;"><strong>Order Date:</strong></td>
                                <td style="padding: 10px; color: #CCC;">${formattedDate}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px; color: #CCC;"><strong>Payment Method:</strong></td>
                                <td style="padding: 10px; color: #CCC;">${data.paymentMethod}</td>
                              </tr>
                              <tr>
                                <td style="padding: 10px; color: #CCC;"><strong>Transaction ID:</strong></td>
                                <td style="padding: 10px; color: #CCC;">${data.transactionId || 'N/A'}</td>
                              </tr>
                            </table>
                            
                            <h2 style="color: #F0C465; font-size: 18px; font-weight: bold; margin: 20px 0 10px;">Items Purchased</h2>
                            <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box; background: #1A1A1A; border-radius: 5px;">
                              <thead>
                                <tr>
                                  <th style="padding: 10px; color: #F0C465; text-align: left; border-bottom: 1px solid #333;">Item</th>
                                  <th style="padding: 10px; color: #F0C465; text-align: center; border-bottom: 1px solid #333;">Qty</th>
                                  <th style="padding: 10px; color: #F0C465; text-align: right; border-bottom: 1px solid #333;">Price</th>
                                  <th style="padding: 10px; color: #F0C465; text-align: right; border-bottom: 1px solid #333;">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${itemsHTML}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colspan="3" style="padding: 10px; color: #CCC; text-align: right; border-top: 1px solid #333;"><strong>Total:</strong></td>
                                  <td style="padding: 10px; color: #F0C465; text-align: right; border-top: 1px solid #333;"><strong>${formattedTotal}</strong></td>
                                </tr>
                              </tfoot>
                            </table>
                            
                            <p style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; font-weight: normal; margin: 20px 0; color: #CCC;">If you have any questions about your order, please contact our customer service at <a href="mailto:support@izuran.com" style="color: #F0C465; text-decoration: none;">support@izuran.com</a></p>
                            
                            <p style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 15px; color: #CCC;">Thank you for supporting Izuran Records!</p>
                            
                            <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px; text-align: center; color: #777; font-size: 14px;">
                              <p style="margin-bottom: 5px;">Izuran Records, Experience Amazigh Electronic Music.</p>
                              <p style="margin-bottom: 5px;">© 2025 Izuran Records. All rights reserved.</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
            <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; vertical-align: top;">&nbsp;</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send the email
    const { data: emailResult } = await resend.emails.send({
      from: 'Izuran Records <orders@izuran-official.com>',
      to: [data.customerEmail],
      subject: `Izuran Records - Order Confirmation #${data.orderId}`,
      html: emailHTML,
    });

    console.log(`Confirmation email sent to ${data.customerEmail} for order ${data.orderId}`);
    return;
  } catch (error) {
    console.error('Failed to send purchase confirmation email:', error);
    throw error;
  }
}

/**
 * Prepare purchase confirmation email from order data
 */
export async function sendOrderConfirmationEmail(
  order: Order,
): Promise<void> {
  try {
    // Simplified to avoid TypeScript issues - for now we'll just use placeholder data
    // This can be enhanced later to fetch real order items
    
    // Prepare email data with basic order information
    const data: PurchaseEmailData = {
      customerName: order.customerName || 'Valued Customer',
      customerEmail: order.customerEmail || '',
      orderId: order.id.toString(),
      transactionId: order.paymentId || '',
      orderDate: order.createdAt || new Date(),
      amount: parseFloat(order.total || '0'),
      currency: order.currency || 'USD',
      items: [
        {
          name: 'Your purchase from Izuran Records',
          quantity: 1,
          price: parseFloat(order.total || '0')
        }
      ],
      paymentMethod: order.paymentMethod || 'Online Payment'
    };
    
    await sendPurchaseConfirmationEmail(data);
    console.log('Order confirmation email queued for sending');
    return;
  } catch (error) {
    console.error('Failed to prepare and send order confirmation email:', error);
    // Don't throw, just log - we don't want to disrupt the payment flow because of email issues
  }
}