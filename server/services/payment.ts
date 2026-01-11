import { db } from "@db";
import * as schema from "@shared/schema";
import { orders, orderItems, products, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

interface PaymentIntentOptions {
  amount: number;
  currency: string;
  userId?: number; // Optional for guest checkout
  customerEmail: string;
  customerName: string;
  items: {
    productId: number;
    quantity: number;
  }[];
  paymentMethod: 'cmi' | 'paypal';
  billingAddress?: string;
  shippingAddress?: string;
}

interface VerifyPaymentOptions {
  orderId: number;
  paymentId: string;
  amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
}

/**
 * Create a CMI payment session
 * Documentation for CMI gateway: https://docs.cmi.co.ma/ (hypothetical URL)
 */
export async function createCmiPaymentSession(options: PaymentIntentOptions) {
  try {
    // 1. Create order record in database
    const [order] = await db.insert(orders).values({
      userId: options.userId || 0,
      status: 'pending',
      total: options.amount.toString(),
      currency: options.currency,
      paymentMethod: 'cmi',
      customerEmail: options.customerEmail,
      customerName: options.customerName,
      billingAddress: options.billingAddress || null,
      shippingAddress: options.shippingAddress || null,
    }).returning();

    // 2. Create order items
    const orderLineItems = [];
    
    for (const item of options.items) {
      // Get product details
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId)
      });
      
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      
      // Add to order items
      const [orderItem] = await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      }).returning();
      
      orderLineItems.push(orderItem);
    }

    // 3. Create a hash for order verification
    const orderHash = crypto.createHash('sha256')
      .update(`${order.id}-${options.amount}-${Date.now()}`)
      .digest('hex');
    
    // 4. Configure CMI session parameters
    // Note: In a real implementation, you would integrate with the actual CMI API
    // These values are placeholders to demonstrate the structure
    const cmiSessionParams = {
      merchantId: process.env.CMI_MERCHANT_ID || 'TEST_MERCHANT_ID',
      amount: options.amount,
      currency: options.currency,
      orderId: order.id.toString(),
      callbackUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/payments/cmi/callback`,
      customerEmail: options.customerEmail,
      orderHash: orderHash,
    };
    
    // 5. In a real implementation, call the CMI API to create a payment session
    // This is a simulated response for demonstration purposes
    const cmiSessionUrl = `https://payment.cmi.co.ma/pay?merchantId=${cmiSessionParams.merchantId}&amount=${cmiSessionParams.amount}&hash=${orderHash}&orderId=${order.id}`;
    
    // 6. Update order with CMI session URL
    await db.update(orders)
      .set({ 
        cmiSessionUrl: cmiSessionUrl,
        paymentId: orderHash // Store hash as payment reference
      })
      .where(eq(orders.id, order.id));
    
    return {
      orderId: order.id,
      paymentId: orderHash,
      redirectUrl: cmiSessionUrl,
      amount: options.amount,
      currency: options.currency,
      status: 'pending'
    };
  } catch (error) {
    console.error("Error creating CMI payment session:", error);
    throw error;
  }
}

/**
 * Create a PayPal payment
 * Documentation: https://developer.paypal.com/docs/api/overview/
 */
export async function createPaypalPayment(options: PaymentIntentOptions) {
  try {
    // 1. Create order record in database
    const [order] = await db.insert(orders).values({
      userId: options.userId || 0,
      status: 'pending',
      total: options.amount.toString(),
      currency: options.currency,
      paymentMethod: 'paypal',
      customerEmail: options.customerEmail,
      customerName: options.customerName,
      billingAddress: options.billingAddress || null,
      shippingAddress: options.shippingAddress || null,
    }).returning();

    // 2. Create order items
    const orderLineItems = [];
    
    for (const item of options.items) {
      // Get product details
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId)
      });
      
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      
      // Add to order items
      const [orderItem] = await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      }).returning();
      
      orderLineItems.push(orderItem);
    }

    // 3. In a real implementation, call the PayPal API to create a payment
    // This is a simulated response for demonstration purposes
    const paypalOrderId = `PAYPAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 4. Prepare line items for PayPal
    const paypalItems = orderLineItems.map(item => ({
      name: `Product ID: ${item.productId}`,
      quantity: item.quantity,
      price: item.price,
    }));
    
    // 5. Update order with PayPal order ID
    await db.update(orders)
      .set({ paypalOrderId: paypalOrderId })
      .where(eq(orders.id, order.id));
    
    // 6. Return PayPal checkout data
    return {
      orderId: order.id,
      paypalOrderId: paypalOrderId,
      // In a real implementation, this would come from the PayPal API response
      approvalUrl: `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`,
      amount: options.amount,
      currency: options.currency,
      status: 'pending'
    };
  } catch (error) {
    console.error("Error creating PayPal payment:", error);
    throw error;
  }
}

/**
 * Verify and process a payment
 */
export async function verifyPayment(options: VerifyPaymentOptions) {
  try {
    // Find the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, options.orderId)
    });
    
    if (!order) {
      throw new Error(`Order with ID ${options.orderId} not found`);
    }
    
    // Update order status
    await db.update(orders)
      .set({ 
        status: options.status,
        updatedAt: new Date(),
        paymentId: options.paymentId
      })
      .where(eq(orders.id, options.orderId));
    
    // If payment is successful and physical products are purchased, decrement stock
    if (options.status === 'paid') {
      // Get order items
      const orderItemsList = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, options.orderId),
        with: {
          product: true
        }
      });
      
      // Update stock for physical products
      for (const item of orderItemsList) {
        if (item.product.productType === 'physical') {
          const currentStock = item.product.stockLevel || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          
          await db.update(products)
            .set({ stockLevel: newStock })
            .where(eq(products.id, item.productId));
        }
      }
    }
    
    return { 
      success: options.status === 'paid',
      orderId: options.orderId,
      status: options.status
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

/**
 * Get order details
 */
export async function getOrderById(orderId: number) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: true
          }
        }
      }
    });
    
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    return order;
  } catch (error) {
    console.error("Error getting order details:", error);
    throw error;
  }
}

/**
 * Get download link for digital product
 */
export async function getDigitalProductDownload(orderId: number, productId: number, userId?: number) {
  try {
    // Check if order exists and is paid
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.status, 'paid'),
        userId ? eq(orders.userId, userId) : undefined
      )
    });
    
    if (!order) {
      throw new Error('Order not found or not paid');
    }
    
    // Check if product is part of this order
    const orderItem = await db.query.orderItems.findFirst({
      where: and(
        eq(orderItems.orderId, orderId),
        eq(orderItems.productId, productId)
      ),
      with: {
        product: true
      }
    });
    
    if (!orderItem || !orderItem.product) {
      throw new Error('Product not found in this order');
    }
    
    // Check if product is digital
    if (orderItem.product.productType !== 'digital') {
      throw new Error('Product is not a digital product');
    }
    
    // Return download URL
    return {
      productId,
      productName: orderItem.product.name,
      downloadUrl: orderItem.product.digitalFileUrl
    };
  } catch (error) {
    console.error("Error getting digital product download:", error);
    throw error;
  }
}