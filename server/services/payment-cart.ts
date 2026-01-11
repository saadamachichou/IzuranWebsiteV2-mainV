import { db } from '@db';
import { Order, OrderItem, orderItems, products } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Cart item interface from the frontend
 */
export interface CartItem {
  id: number;
  name: string;
  price: number | string;
  quantity: number;
  category?: string;
  type?: string;
}

/**
 * Creates or updates order items in the database for a given order
 */
export async function createOrderItemsFromCart(orderId: number, cartItems: CartItem[]): Promise<OrderItem[]> {
  const createdItems: OrderItem[] = [];
  
  // Process each cart item
  for (const item of cartItems) {
    try {
      // Normalize product ID from cart item
      const productId = item.id;
      
      // First check if the product exists
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId)
      });
      
      if (!product) {
        console.warn(`Product with ID ${productId} not found, skipping order item creation`);
        continue;
      }
      
      // Convert price to string if it's a number
      const priceString = typeof item.price === 'number' 
        ? item.price.toString() 
        : item.price;
      
      // Insert order item
      const [orderItem] = await db.insert(orderItems).values({
        orderId,
        productId,
        quantity: item.quantity,
        price: priceString,
        createdAt: new Date()
      }).returning();
      
      createdItems.push(orderItem);
      console.log(`Created order item for order ${orderId}, product ${productId}, quantity ${item.quantity}`);
    } catch (error) {
      console.error(`Failed to create order item for product ID ${item.id}:`, error);
      // Continue with other items even if one fails
    }
  }
  
  return createdItems;
}

/**
 * Updates an order with the total price based on cart items
 */
export async function updateOrderTotal(order: Order, cartItems: CartItem[]): Promise<Order> {
  try {
    // Calculate total from cart items
    let total = 0;
    
    for (const item of cartItems) {
      const itemPrice = typeof item.price === 'number' 
        ? item.price 
        : parseFloat(item.price);
      
      total += itemPrice * item.quantity;
    }
    
    // Update order with new total
    const { orders } = await import('@shared/schema');
    const [updatedOrder] = await db.update(orders)
      .set({ 
        total: total.toString(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id))
      .returning();
    
    console.log(`Updated order ${order.id} total to ${total}`);
    return updatedOrder;
  } catch (error) {
    console.error(`Failed to update order total for order ${order.id}:`, error);
    throw error;
  }
}

/**
 * Process cart items for a PayPal order ID
 * This will create a new order if none exists, or update an existing one
 */
export async function processCartItemsForPaypalOrder(
  paypalOrderId: string, 
  cartItems: CartItem[],
  userId: number = 0,
  customerEmail: string = '',
  customerName: string = 'Guest User'
): Promise<Order> {
  try {
    // Check if order already exists
    const { orders } = await import('@shared/schema');
    let dbOrder = await db.query.orders.findFirst({
      where: eq(orders.paypalOrderId, paypalOrderId)
    });
    
    // Calculate total from cart items
    let total = 0;
    for (const item of cartItems) {
      const itemPrice = typeof item.price === 'number' 
        ? item.price 
        : parseFloat(item.price);
      
      total += itemPrice * item.quantity;
    }
    
    if (!dbOrder) {
      // Create a new order
      const [newOrder] = await db.insert(orders).values({
        userId: userId,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'paypal',
        total: total.toString(),
        currency: 'USD', // Default, will be updated from PayPal response
        paypalOrderId: paypalOrderId,
        customerEmail: customerEmail,
        customerName: customerName, // Add customer name
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      dbOrder = newOrder;
      console.log(`Created new order with ID ${dbOrder.id} for PayPal order ${paypalOrderId}`);
    } else {
      // Update the existing order
      const [updatedOrder] = await db.update(orders)
        .set({ 
          total: total.toString(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, dbOrder.id))
        .returning();
      
      dbOrder = updatedOrder;
      console.log(`Updated existing order ${dbOrder.id} for PayPal order ${paypalOrderId}`);
    }
    
    // Create order items
    await createOrderItemsFromCart(dbOrder.id, cartItems);
    
    return dbOrder;
  } catch (error) {
    console.error(`Failed to process cart items for PayPal order ${paypalOrderId}:`, error);
    throw error;
  }
}