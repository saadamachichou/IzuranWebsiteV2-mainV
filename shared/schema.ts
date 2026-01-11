import { pgTable, text, serial, integer, timestamp, decimal, boolean, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Artist Schema
export const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  image_Url: text('image_url'),
  instagram: text('instagram'),
  soundcloud: text('soundcloud'),
  bandcamp: text('bandcamp'),
  linktree: text('linktree'),
  facebook: text('facebook'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Event Schema
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  date: timestamp('date').notNull(),
  endDate: timestamp('end_date'),
  location: text('location').notNull(),
  lineup: text('lineup'),
  // Legacy field - will be deprecated
  ticketPrice: text('ticket_price'),
  // New tiered pricing fields
  earlyBirdPrice: text('early_bird_price'),
  earlyBirdEndDate: timestamp('early_bird_end_date'),
  secondPhasePrice: text('second_phase_price'),
  secondPhaseEndDate: timestamp('second_phase_end_date'),
  lastPhasePrice: text('last_phase_price'),
  displayDate: text('display_date').notNull(),
  status: text('status').notNull().default('upcoming'),
  featured: boolean('featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Product Type Enum
export const productTypeEnum = pgEnum('product_type', ['physical', 'digital']);

// Product Category Enum - for more structured categories
export const productCategoryEnum = pgEnum('product_category', ['vinyl', 'digital', 'merch', 'clothing', 'accessories', 'other']);

// Product Schema
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  category: productCategoryEnum('category').notNull(),
  productType: productTypeEnum('product_type').notNull(),
  artistName: text('artist_name'),
  stockLevel: integer('stock_level').default(0),
  isNewRelease: boolean('is_new_release').default(false),
  cmiProductId: text('cmi_product_id'), // For CMI payment gateway
  paypalProductId: text('paypal_product_id'), // For PayPal integration
  digitalFileUrl: text('digital_file_url'), // URL to download for digital products
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  archived: boolean('archived').default(false),
});

// Podcast Schema
export const podcasts = pgTable('podcasts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  coverUrl: text('cover_url'),
  audioUrl: text('audio_url').notNull(),
  artistName: text('artist_name').notNull(),
  duration: text('duration').notNull(),
  genre: text('genre').notNull(),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Streams Schema
export const streams = pgTable('streams', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  twitchChannelName: text('twitch_channel_name'),
  iframeCode: text('iframe_code'),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Article Schema
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  category: text('category').notNull(),
  publishDate: timestamp('publish_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Gallery Schema
export const galleryItems = pgTable('gallery_items', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'image' or 'video'
  src: text('src').notNull(),
  thumbnail: text('thumbnail'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Contact Messages Schema
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  repliedAt: timestamp('replied_at'),
  adminReply: text('admin_reply')
});

// User Role Enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'artist']);

// Artist Type Enum
export const artistTypeEnum = pgEnum('artist_type', ['dj', 'producer', 'hybrid']);

// Auth Provider Enum
export const authProviderEnum = pgEnum('auth_provider', ['local', 'google']);

// User Schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // This is nullable for Google/external auth users
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: userRoleEnum('role').default('user').notNull(),
  artistType: artistTypeEnum('artist_type'), // DJ, Producer, or Hybrid (only for artist role users)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  // New fields for authentication and profile
  authProvider: authProviderEnum('auth_provider').default('local').notNull(),
  providerId: text('provider_id').unique(), // Google or other provider ID
  profilePictureUrl: text('profile_picture_url'), // URL to profile picture (from storage or Google)
  lastLoginAt: timestamp('last_login_at')
});

// Favorite Podcasts Schema (for users to save favorites)
export const favoritePodcasts = pgTable('favorite_podcasts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  podcastId: integer('podcast_id').notNull().references(() => podcasts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Delivery Personnel Schema
export const deliveryPersonnel = pgTable('delivery_personnel', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  isActive: boolean('is_active').default(true).notNull(),
  vehicleInfo: text('vehicle_info'), // vehicle type, license plate, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Payment Method Enum
export const paymentMethodEnum = pgEnum('payment_method', ['cmi', 'paypal', 'cod']);

// Order Status Enum
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'shipped', 'out_for_delivery', 'delivered', 'delivered_paid', 'cancelled', 'refunded']);

// Payment Status Enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

// Orders Schema
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: orderStatusEnum('status').notNull().default('pending'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentId: text('payment_id'), // External payment reference ID
  cmiSessionUrl: text('cmi_session_url'), // URL for CMI payment session
  paypalOrderId: text('paypal_order_id'), // PayPal order ID
  customerEmail: text('customer_email'), // For guest purchases and order confirmations
  customerName: text('customer_name'),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  trackingNumber: text('tracking_number'), // For physical product shipments
  notes: text('notes'),
  
  // COD specific fields
  deliveryPersonnelId: integer('delivery_personnel_id').references(() => deliveryPersonnel.id),
  deliveryScheduledAt: timestamp('delivery_scheduled_at'),
  deliveryAttemptedAt: timestamp('delivery_attempted_at'),
  deliveryCompletedAt: timestamp('delivery_completed_at'),
  cashCollectedAmount: decimal('cash_collected_amount', { precision: 10, scale: 2 }),
  deliveryNotes: text('delivery_notes'),
  customerPhone: text('customer_phone'), // Required for COD deliveries
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Order Items Schema
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Ticket Status Enum
export const ticketStatusEnum = pgEnum('ticket_status', ['active', 'used', 'cancelled', 'expired']);

// Ticket Type Enum
export const ticketTypeEnum = pgEnum('ticket_type', ['early_bird', 'second_phase', 'last_phase', 'vip']);

// Tickets Schema
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  ticketId: text('ticket_id').notNull().unique(), // Unique identifier for QR code
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  ticketType: ticketTypeEnum('ticket_type').notNull(),
  status: ticketStatusEnum('status').notNull().default('active'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  attendeeName: text('attendee_name').notNull(),
  attendeeEmail: text('attendee_email').notNull(),
  attendeePhone: text('attendee_phone'),
  qrCodeData: text('qr_code_data').notNull(), // Encrypted ticket data for QR
  usedAt: timestamp('used_at'), // When ticket was scanned/used
  usedBy: text('used_by'), // Admin who scanned the ticket
  expiresAt: timestamp('expires_at'), // Optional expiration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Event Ticket Limits Schema (for managing ticket availability)
export const eventTicketLimits = pgTable('event_ticket_limits', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  ticketType: ticketTypeEnum('ticket_type').notNull(),
  maxTickets: integer('max_tickets').notNull(),
  soldTickets: integer('sold_tickets').notNull().default(0),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

// Ticket Validation Log Schema (for security and audit)
export const ticketValidationLogs = pgTable('ticket_validation_logs', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  validationType: text('validation_type').notNull(), // 'scan', 'manual', 'api'
  validatedBy: text('validated_by'), // Admin username or API key
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  result: text('result').notNull(), // 'valid', 'invalid', 'already_used', 'expired'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const artistsRelations = relations(artists, ({ many }) => ({
  podcasts: many(podcasts)
}));

export const podcastsRelations = relations(podcasts, ({ one, many }) => ({
  artist: one(artists, {
    fields: [podcasts.artistName],
    references: [artists.name]
  }),
  favorites: many(favoritePodcasts)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  artist: one(artists, {
    fields: [products.artistName],
    references: [artists.name]
  }),
  orderItems: many(orderItems)
}));

export const favoritePodcastsRelations = relations(favoritePodcasts, ({ one }) => ({
  user: one(users, {
    fields: [favoritePodcasts.userId],
    references: [users.id]
  }),
  podcast: one(podcasts, {
    fields: [favoritePodcasts.podcastId],
    references: [podcasts.id]
  })
}));

export const deliveryPersonnelRelations = relations(deliveryPersonnel, ({ many }) => ({
  orders: many(orders)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

// Ticket Relations
export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id]
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id]
  }),
  order: one(orders, {
    fields: [tickets.orderId],
    references: [orders.id]
  })
}));

export const eventTicketLimitsRelations = relations(eventTicketLimits, ({ one }) => ({
  event: one(events, {
    fields: [eventTicketLimits.eventId],
    references: [events.id]
  })
}));

export const ticketValidationLogsRelations = relations(ticketValidationLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketValidationLogs.ticketId],
    references: [tickets.id]
  })
}));

// Add ticket relations to existing tables
export const eventsRelations = relations(events, ({ many }) => ({
  tickets: many(tickets),
  ticketLimits: many(eventTicketLimits)
}));

export const usersRelations = relations(users, ({ many }) => ({
  favoritePodcasts: many(favoritePodcasts),
  orders: many(orders),
  tickets: many(tickets)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  items: many(orderItems),
  tickets: many(tickets),
  deliveryPersonnel: one(deliveryPersonnel, {
    fields: [orders.deliveryPersonnelId],
    references: [deliveryPersonnel.id]
  })
}));

// Validation Schemas
export const artistsInsertSchema = createInsertSchema(artists, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  description: z.string().nullable().transform(e => e === null ? "" : e),
  image_Url: (schema) => schema.refine(
    (url: string | null) => {
      if (!url) return true; // Allow empty/null values
      // Accept both relative paths and absolute URLs
      return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
    },
    "Image URL must be a valid relative path or absolute URL"
  )
});

export const eventsInsertSchema = createInsertSchema(events, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().transform(e => e === null ? "" : e),
  imageUrl: (schema) => schema.refine(
    (url: string | null) => {
      if (!url) return true; // Allow empty/null values
      // Accept both relative paths and absolute URLs
      return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
    },
    "Image URL must be a valid relative path or absolute URL"
  ),
  location: (schema) => schema.min(3, "Location must be at least 3 characters"),
  // Handle date conversions from strings to Date objects
  date: (schema) => z.union([
    z.string().transform(val => new Date(val)), 
    z.date()
  ]),
  endDate: (schema) => z.union([
    z.string().transform(val => new Date(val)),
    z.date(),
    z.null()
  ]).optional(),
  // New tiered pricing date fields
  earlyBirdEndDate: (schema) => z.union([
    z.string().transform(val => new Date(val)),
    z.date(),
    z.null()
  ]).optional(),
  secondPhaseEndDate: (schema) => z.union([
    z.string().transform(val => new Date(val)),
    z.date(),
    z.null()
  ]).optional()
});

export const productsInsertSchema = createInsertSchema(products, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
  description: z.string().nullable().transform(e => e === null ? "" : e),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (url) =>
        !url ||
        url.startsWith("/") ||
        url.startsWith("uploads/") ||
        url.startsWith("http://") ||
        url.startsWith("https://"),
      {
        message: "Image URL must be a valid relative path or absolute URL",
      }
    ),
  // Fix for price field to handle both string and number inputs
  price: (schema) => z.union([
    z.string().refine((val) => parseFloat(val) > 0, "Price must be greater than 0"),
    z.number().positive("Price must be greater than 0")
  ]).transform(val => typeof val === 'number' ? val.toString() : val),
  stockLevel: (schema) => schema.gte(0, "Stock level must be 0 or greater"),
  currency: (schema) => schema.min(3, "Currency code must be 3 characters").max(3, "Currency code must be 3 characters"),
  // Fix for digitalFileUrl validation - handle empty strings correctly
  digitalFileUrl: (schema) => schema.transform(val => val === "" ? undefined : val)
    .pipe(z.string().url("Digital file URL must be a valid URL").optional().or(z.undefined()))
});

export const podcastsInsertSchema = createInsertSchema(podcasts, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  slug: (schema) => schema.min(1, "Slug is required"),
  description: z.string().nullable().transform(e => e === null ? "" : e),
  coverUrl: (schema) => schema.optional().nullable(),
  audioUrl: z.string().min(1, "Audio source is required"),
  artistName: (schema) => schema.min(2, "Artist name is required"),
  duration: (schema) => schema.min(1, "Duration is required"),
  genre: (schema) => schema.min(1, "Genre is required"),
  createdAt: z.union([
    z.string().transform(val => new Date(val)),
    z.date()
  ]),
});

export const streamsInsertSchema = createInsertSchema(streams, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  twitchChannelName: z.string().optional().nullable(),
  iframeCode: z.string().optional().nullable(),
  description: z.string().nullable().transform(e => e === null ? "" : e),
  displayOrder: (schema) => schema.gte(0, "Display order must be 0 or greater"),
  isActive: z.boolean().default(true)
}).refine(
  (data) => data.twitchChannelName || data.iframeCode,
  {
    message: "Either Twitch channel name or iframe code is required",
    path: ["twitchChannelName"]
  }
);

export const articlesInsertSchema = createInsertSchema(articles, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  content: z.string().nullable().transform(e => e === null ? "" : e),
  imageUrl: (schema) => schema.refine(
    (url: string | null) => {
      if (!url || url.trim() === '') return true; // Allow empty imageUrl
      // Accept both relative paths and absolute URLs
      return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
    },
    "Image URL must be a valid relative path or absolute URL (or leave empty)"
  ),
  publishDate: (schema) => z.union([
    z.string().transform(val => new Date(val)),
    z.date()
  ]),
  createdAt: (schema) => z.union([
    z.string().transform(val => new Date(val)),
    z.date()
  ]),
});

// Gallery Schemas
export const galleryItemsInsertSchema = createInsertSchema(galleryItems, {
  type: z.enum(['image', 'video', 'youtube']),
  src: z.string().min(1, "Source URL is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required")
});

export const galleryItemsSelectSchema = createSelectSchema(galleryItems);

// Contact Messages Schemas
export const contactMessagesInsertSchema = createInsertSchema(contactMessages, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Please provide a valid email address"),
  subject: (schema) => schema.min(3, "Subject must be at least 3 characters"),
  message: (schema) => schema.min(10, "Message must be at least 10 characters"),
  status: z.enum(['unread', 'read', 'replied']).default('unread')
});

export const contactMessagesSelectSchema = createSelectSchema(contactMessages);

// Ticket-related schemas
export const ticketsInsertSchema = createInsertSchema(tickets, {
  ticketId: (schema) => schema.min(1, "Ticket ID is required"),
  attendeeName: (schema) => schema.min(2, "Attendee name must be at least 2 characters"),
  attendeeEmail: (schema) => schema.email("Please provide a valid email address"),
  qrCodeData: (schema) => schema.min(1, "QR code data is required")
});

export const eventTicketLimitsInsertSchema = createInsertSchema(eventTicketLimits, {
  maxTickets: z.number().gt(0, "Max tickets must be greater than 0"),
  soldTickets: z.number().gte(0, "Sold tickets cannot be negative")
});

export const ticketValidationLogsInsertSchema = createInsertSchema(ticketValidationLogs, {
  validationType: z.enum(['scan', 'manual', 'api']),
  result: z.enum(['valid', 'invalid', 'already_used', 'expired'])
});

// User-related schemas
export const usersInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Please provide a valid email address"),
  passwordHash: (schema) => schema.optional() // Make password hash optional for Google auth users
});

export const userSignupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const userLoginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

// Schema for Google auth
export const googleAuthSchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  email: z.string().email("Please provide a valid email address"),
  username: z.string().min(1, "Username is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profilePictureUrl: z.string().url("Profile picture URL must be a valid URL").optional()
});

// Schema for password change
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmNewPassword: z.string().min(8, "Confirm new password must be at least 8 characters")
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"]
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
});

// Schema for profile picture upload
export const profilePictureSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  imageUrl: z.string().url("Image URL must be a valid URL")
});

export const favoritePodcastsInsertSchema = createInsertSchema(favoritePodcasts);

export const deliveryPersonnelInsertSchema = createInsertSchema(deliveryPersonnel, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  phone: (schema) => schema.min(10, "Phone number must be at least 10 characters"),
  email: (schema) => schema.email("Must provide a valid email address").optional()
});

export const ordersInsertSchema = createInsertSchema(orders, {
  total: (schema) => z.union([
    z.string().refine((val) => parseFloat(val) > 0, "Total must be greater than 0"),
    z.number().positive("Total must be greater than 0")
  ]).transform(val => typeof val === 'number' ? val.toString() : val),
  customerEmail: (schema) => schema.email("Must provide a valid email address"),
  customerName: (schema) => schema.min(2, "Customer name must be at least 2 characters"),
  customerPhone: (schema) => schema.min(10, "Phone number must be at least 10 characters").optional(),
  shippingAddress: (schema) => schema.min(10, "Shipping address must be at least 10 characters").optional()
});

export const orderItemsInsertSchema = createInsertSchema(orderItems);

// Export types
export type Artist = typeof artists.$inferSelect;
export type ArtistInsert = z.infer<typeof artistsInsertSchema>;

export type Event = typeof events.$inferSelect;
export type EventInsert = z.infer<typeof eventsInsertSchema>;

export type Product = typeof products.$inferSelect;
export type ProductInsert = z.infer<typeof productsInsertSchema>;

export type Podcast = typeof podcasts.$inferSelect;
export type PodcastInsert = z.infer<typeof podcastsInsertSchema>;

export type Stream = typeof streams.$inferSelect;
export type StreamInsert = z.infer<typeof streamsInsertSchema>;

export type Article = typeof articles.$inferSelect;
export type ArticleInsert = z.infer<typeof articlesInsertSchema>;

export type User = typeof users.$inferSelect;
export type UserInsert = z.infer<typeof usersInsertSchema>;
export type UserSignup = z.infer<typeof userSignupSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type GoogleAuth = z.infer<typeof googleAuthSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type ProfilePicture = z.infer<typeof profilePictureSchema>;

export type FavoritePodcast = typeof favoritePodcasts.$inferSelect;
export type FavoritePodcastInsert = z.infer<typeof favoritePodcastsInsertSchema>;

export type DeliveryPersonnel = typeof deliveryPersonnel.$inferSelect;
export type DeliveryPersonnelInsert = z.infer<typeof deliveryPersonnelInsertSchema>;

export type Order = typeof orders.$inferSelect;
export type OrderInsert = z.infer<typeof ordersInsertSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type OrderItemInsert = z.infer<typeof orderItemsInsertSchema>;

// Gallery Types
export type GalleryItem = typeof galleryItems.$inferSelect;
export type GalleryItemInsert = z.infer<typeof galleryItemsInsertSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type ContactMessageInsert = z.infer<typeof contactMessagesInsertSchema>;

// Ticket Types
export type Ticket = typeof tickets.$inferSelect;
export type TicketInsert = z.infer<typeof ticketsInsertSchema>;
export type EventTicketLimit = typeof eventTicketLimits.$inferSelect;
export type EventTicketLimitInsert = z.infer<typeof eventTicketLimitsInsertSchema>;
export type TicketValidationLog = typeof ticketValidationLogs.$inferSelect;
export type TicketValidationLogInsert = z.infer<typeof ticketValidationLogsInsertSchema>;
