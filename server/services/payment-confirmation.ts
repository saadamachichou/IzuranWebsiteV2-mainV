import { db } from '@db';
import { Order, orders, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendOrderConfirmationEmail } from './email';

interface PaymentConfirmationData {
  orderId: string;
  transactionId: string;
  paymentStatus: 'completed' | 'failed' | 'refunded';
  paymentDetails?: Record<string, any>;
}

/**
 * Process a successful payment and send confirmation emails
 */
export async function processSuccessfulPayment(data: PaymentConfirmationData) {
  try {
    console.log(`Processing successful payment for order ${data.orderId}`);
    
    // Find order in database
    let dbOrder = await db.query.orders.findFirst({
      where: eq(orders.paypalOrderId, data.orderId)
    });
    
    if (!dbOrder) {
      console.warn(`Order ${data.orderId} not found in database during payment confirmation`);
      return;
    }
    
    // Update order with transaction ID and payment status
    const [updatedOrder] = await db.update(orders)
      .set({
        status: 'paid' as const,
        paymentStatus: 'completed' as const,
        paymentId: data.transactionId, // Using paymentId field instead of transactionId
        updatedAt: new Date()
      })
      .where(eq(orders.id, dbOrder.id))
      .returning();
    
    console.log(`Updated order ${dbOrder.id} status to paid`);
    
    // Get user info if available
    let user = null;
    if (dbOrder.userId && dbOrder.userId > 0) {
      user = await db.query.users.findFirst({
        where: eq(users.id, dbOrder.userId)
      });
    }
    
    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(updatedOrder);
      console.log(`Sent order confirmation email for order ${dbOrder.id}`);
    } catch (emailError) {
      console.error(`Failed to send order confirmation email for order ${dbOrder.id}:`, emailError);
      // Continue even if email fails
    }
    
    return updatedOrder;
  } catch (error) {
    console.error(`Failed to process successful payment for order ${data.orderId}:`, error);
    throw error;
  }
}

/**
 * Process a PayPal payment response
 */
export async function processPayPalPayment(paypalResponse: any) {
  try {
    if (!paypalResponse || !paypalResponse.id) {
      throw new Error('Invalid PayPal response: missing order ID');
    }
    
    const paypalOrderId = paypalResponse.id;
    console.log(`Processing PayPal payment for order ${paypalOrderId}`);
    
    // Check if order already exists in our database
    let dbOrder = await db.query.orders.findFirst({
      where: eq(orders.paypalOrderId, paypalOrderId)
    });
    
    if (!dbOrder) {
      // Extract customer info from PayPal response
      let customerEmail = '';
      let customerName = '';
      
      // Try to extract email from different PayPal response formats
      if (paypalResponse.payer && paypalResponse.payer.email_address) {
        customerEmail = paypalResponse.payer.email_address;
        customerName = paypalResponse.payer.name?.given_name || '';
      }
      
      // Get amount from PayPal response
      let amount = '0';
      let currency = 'USD';
      
      if (paypalResponse.purchase_units && 
          paypalResponse.purchase_units.length > 0 && 
          paypalResponse.purchase_units[0].amount) {
        amount = paypalResponse.purchase_units[0].amount.value || '0';
        currency = paypalResponse.purchase_units[0].amount.currency_code || 'USD';
      }
      
      // Create a new order in our database with required fields
      const [newOrder] = await db.insert(orders)
        .values({
          userId: 0, // Guest user ID or system user ID
          total: amount,
          paymentMethod: 'paypal',
          status: 'paid',
          paymentStatus: 'completed',
          currency: currency,
          paypalOrderId: paypalOrderId, // Set PayPal order ID
          customerEmail: customerEmail, 
          customerName: customerName,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      dbOrder = newOrder;
      console.log(`Created new order in database with ID ${dbOrder.id} for PayPal order ${paypalOrderId}`);
    } else {
      // Update existing order
      const [updatedOrder] = await db.update(orders)
        .set({ 
          status: 'paid' as const,
          paymentStatus: 'completed' as const,
          updatedAt: new Date()
        })
        .where(eq(orders.id, dbOrder.id))
        .returning();
      
      dbOrder = updatedOrder;
      console.log(`Updated existing order ${dbOrder.id} for PayPal order ${paypalOrderId}`);
    }
    
    // Extract transaction ID
    let transactionId = '';
    
    // Try to find capture ID in different PayPal response formats
    if (paypalResponse.purchase_units && 
        paypalResponse.purchase_units.length > 0 && 
        paypalResponse.purchase_units[0].payments &&
        paypalResponse.purchase_units[0].payments.captures &&
        paypalResponse.purchase_units[0].payments.captures.length > 0) {
      transactionId = paypalResponse.purchase_units[0].payments.captures[0].id || '';
    }
    
    // Create confirmation data
    const confirmationData: PaymentConfirmationData = {
      orderId: paypalOrderId,
      transactionId: transactionId,
      paymentStatus: 'completed',
      paymentDetails: paypalResponse
    };
    
    // Process the successful payment
    const updatedOrder = await processSuccessfulPayment(confirmationData);
    
    return updatedOrder;
  } catch (error) {
    console.error('Error processing PayPal payment:', error);
    throw error;
  }
}