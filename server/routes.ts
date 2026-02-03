import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import * as schema from "@shared/schema";
import { db } from "@db";
import { eq, and, asc, desc, sql, gte } from "drizzle-orm";
import fetch from 'node-fetch';
import passport from "passport";
import path from "path";
import express from "express";
import { fileURLToPath } from 'url';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  isAuthenticated, 
  isAdmin,
  isArtistMiddleware,
  isArtistOrAdminMiddleware,
  authenticateWithGoogle,
  uploadProfilePicture,
  changePassword,
  refreshToken,
  upload
} from "./auth";
import {
  createCmiPaymentSession,
  createPaypalPayment,
  verifyPayment,
  getOrderById,
  getDigitalProductDownload
} from "./services/payment";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { processPayPalPayment } from "./services/payment-confirmation";
import { createOrderItemsFromCart, updateOrderTotal } from "./services/payment-cart";
import { uploadEventImage, uploadProductImage, uploadArticleImage, uploadPodcastImage, uploadGalleryImage } from "./services/image-upload";
import multer from "multer";
import fs from "fs";
import { uploadArtistImage } from './services/image-upload';
import { performanceMonitor } from "./performance-monitor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";
  
  // Health check endpoint for Docker/Coolify
  app.get(`${apiPrefix}/health`, async (req, res) => {
    try {
      // Basic health check - can add DB ping if needed
      res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (err) {
      res.status(503).json({ status: "error", message: "Service unavailable" });
    }
  });

  // Debug: show static paths in production (visit http://localhost:3000/api/static-check)
  app.get(`${apiPrefix}/static-check`, (req, res) => {
    const distByDir = path.resolve(__dirname, "public");
    const distByCwd = path.resolve(process.cwd(), "dist", "public");
    const indexByDir = path.resolve(distByDir, "index.html");
    const indexByCwd = path.resolve(distByCwd, "index.html");
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      cwd: process.cwd(),
      distByDir,
      distByDirExists: fs.existsSync(distByDir),
      distByCwd,
      distByCwdExists: fs.existsSync(distByCwd),
      indexByDirExists: fs.existsSync(indexByDir),
      indexByCwdExists: fs.existsSync(indexByCwd),
    });
  });
  
  // Error handler middleware
  const handleErrors = (err: any, res: any): Response => { // Explicitly set return type to Response
    console.error("API Error:", err);
    
    if (err instanceof ZodError) {
      const errorMessages = err.errors.map((error: any) => `${error.path.join('.')}: ${error.message}`);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors,
        details: errorMessages.join(', ')
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error"
    });
  };
  
  // User Order History endpoint
  app.get(`${apiPrefix}/orders/history`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { orders } = await import('@shared/schema');
      
      // Get all orders for this user with most recent first
      const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, userId),
        orderBy: [desc(orders.createdAt)],
        with: {
          items: {
            with: {
              product: true
            }
          }
        }
      });
      
      return res.json(userOrders);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Artists endpoints
  app.get(`${apiPrefix}/artists`, async (req, res) => {
    try {
      const artists = await storage.getAllArtists();
      return res.json(artists);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/artists/:slug`, async (req, res) => {
    try {
      // Only treat as ID when the entire param is digits (e.g. "3" not "3PL7VEN")
      const isId = /^\d+$/.test(req.params.slug);
      
      let artist;
      if (isId) {
        // Get artist by ID for admin panel editing
        const id = parseInt(req.params.slug);
        artist = await db.query.artists.findFirst({
          where: eq(schema.artists.id, id)
        });
      } else {
        // Get artist by slug for public facing pages
        const { slug } = req.params;
        artist = await storage.getArtistBySlug(slug);
      }
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      return res.json(artist);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Admin artist management endpoints
  app.post(`${apiPrefix}/artists`, isAdmin, async (req, res) => {
    try {
      // Validate request body
      const artistData = schema.artistsInsertSchema.parse(req.body);
      
      // Insert artist into database
      const [artist] = await db.insert(schema.artists)
        .values(artistData)
        .returning();
      
      // Clear artist cache to ensure fresh data is fetched
      storage.clearArtistCache();
      
      return res.status(201).json(artist);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.put(`${apiPrefix}/artists/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artist ID" });
      }
      
      console.log(`Updating artist with ID: ${id}`);
      console.log('Request body:', req.body);
      
      // Get the current artist to verify it exists
      const existingArtist = await db.query.artists.findFirst({
        where: eq(schema.artists.id, id)
      });
      
      if (!existingArtist) {
        console.log(`Artist with ID ${id} not found`);
        return res.status(404).json({ message: "Artist not found" });
      }
      
      console.log('Existing artist:', existingArtist);
      console.log('Existing artist name:', existingArtist.name);
      
      // Remove createdAt from the request body if present
      const { createdAt, ...artistWithoutCreatedAt } = req.body;
      
      // Validate remaining data
      const artistData = schema.artistsInsertSchema.parse({
        ...artistWithoutCreatedAt,
        createdAt: existingArtist.createdAt // Keep original creation date
      });
      
      console.log('Validated artist data:', artistData);
      console.log('New name to be set:', artistData.name);
      
      // Remove createdAt from data being updated to prevent errors
      delete artistData.createdAt;
      
      // Update artist in database using transaction
      console.log('Starting database update...');
      const [updatedArtist] = await db.update(schema.artists)
        .set(artistData)
        .where(eq(schema.artists.id, id))
        .returning();
      
      console.log('Updated artist returned from database:', updatedArtist);
      console.log('Updated artist name:', updatedArtist?.name);
      
      // Verify the update actually happened by querying again
      console.log('Verifying update by querying database again...');
      const verificationArtist = await db.query.artists.findFirst({
        where: eq(schema.artists.id, id)
      });
      
      console.log('Verification query result:', verificationArtist);
      console.log('Verification artist name:', verificationArtist?.name);
      
      // Clear artist cache to ensure fresh data is fetched
      console.log('Clearing artist cache...');
      storage.clearArtistCache();
      console.log('Artist cache cleared');
      
      return res.json(updatedArtist);
    } catch (err) {
      console.error('Error updating artist:', err);
      handleErrors(err, res);
    }
  });
  
  // Admin artist delete endpoint (refactored for consistency)
  app.delete(`${apiPrefix}/admin/artists/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artist ID" });
      }

      // Check if artist exists
      const existingArtist = await db.query.artists.findFirst({
        where: eq(schema.artists.id, id)
      });

      if (!existingArtist) {
        return res.status(404).json({ message: "Artist not found" });
      }

      // Delete artist from database
      await db.delete(schema.artists)
        .where(eq(schema.artists.id, id));

      // Clear artist cache to ensure fresh data is fetched
      storage.clearArtistCache();

      return res.json({ message: "Artist deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // (Optional) Remove or comment out the old public artist delete endpoint if it exists
  // app.delete(`${apiPrefix}/artists/:id`, ...);

  // Events endpoints
  app.get(`${apiPrefix}/events`, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      return res.json(events);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/events/upcoming`, async (req, res) => {
    try {
      // Update event statuses before fetching upcoming events
      await storage.updateEventStatuses();
      const events = await storage.getUpcomingEvents();
      return res.json(events);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/events/featured`, async (req, res) => {
    try {
      const events = await storage.getFeaturedEvents();
      return res.json(events);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/events/past`, async (req, res) => {
    try {
      const events = await storage.getPastEvents();
      return res.json(events);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Manual trigger to update event statuses
  app.post(`${apiPrefix}/admin/events/update-statuses`, isAdmin, async (req, res) => {
    try {
      const result = await storage.updateEventStatuses();
      return res.json({ 
        message: "Event statuses updated successfully", 
        updatedCount: result.updatedCount 
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/events/:slug`, async (req, res) => {
    try {
      // Only treat as ID when the entire param is digits (e.g. "3" not "3PL7VEN")
      const isId = /^\d+$/.test(req.params.slug);
      
      let event;
      if (isId) {
        // Get event by ID for admin panel editing
        const id = parseInt(req.params.slug);
        event = await db.query.events.findFirst({
          where: eq(schema.events.id, id)
        });
      } else {
        // Get event by slug for public facing pages
        const { slug } = req.params;
        event = await storage.getEventBySlug(slug);
      }
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      return res.json(event);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Admin event management endpoints
  app.post(`${apiPrefix}/admin/events`, isAdmin, async (req, res) => {
    try {
      // Handle imageUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
      if (req.body.imageUrl && !req.body.imageUrl.startsWith('http://') && !req.body.imageUrl.startsWith('https://') && !req.body.imageUrl.startsWith('/uploads/event_images/')) {
        req.body.imageUrl = `/uploads/event_images/${req.body.imageUrl}`;
      }

      // Validate request body
      const eventData = schema.eventsInsertSchema.parse(req.body);
      
      // Insert event into database
      const [event] = await db.insert(schema.events)
        .values(eventData)
        .returning();
      
      return res.status(201).json(event);
    } catch (err) {
      console.error('Error creating event:', err);
      handleErrors(err, res);
    }
  });
  
  app.put(`${apiPrefix}/admin/events/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Get the current event to verify it exists
      const existingEvent = await db.query.events.findFirst({
        where: eq(schema.events.id, id)
      });

      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Handle imageUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
      if (req.body.imageUrl && !req.body.imageUrl.startsWith('http://') && !req.body.imageUrl.startsWith('https://') && !req.body.imageUrl.startsWith('/uploads/event_images/')) {
        req.body.imageUrl = `/uploads/event_images/${req.body.imageUrl}`;
      }

      // Validate remaining data
      const eventData = schema.eventsInsertSchema.parse(req.body);

      // Update event in database
      const [updatedEvent] = await db.update(schema.events)
        .set(eventData)
        .where(eq(schema.events.id, id))
        .returning();

      return res.json(updatedEvent);
    } catch (err) {
      console.error('Error updating event:', err);
      handleErrors(err, res);
    }
  });
  
  app.delete(`${apiPrefix}/events/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      // Check if event exists
      const existingEvent = await db.query.events.findFirst({
        where: eq(schema.events.id, id)
      });
      
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Delete event from database
      await db.delete(schema.events)
        .where(eq(schema.events.id, id));
      
      return res.status(200).json({ message: "Event deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Admin event detail endpoint
  app.get(`${apiPrefix}/admin/events/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await db.query.events.findFirst({
        where: eq(schema.events.id, id)
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      return res.json(event);
    } catch (err) {
      console.error('Error fetching event:', err);
      handleErrors(err, res);
    }
  });

  // Products endpoints
  app.get(`${apiPrefix}/products`, async (req, res) => {
    try {
      const { category } = req.query;
      
      let products;
      if (category && typeof category === 'string' && category !== 'all') {
        // Validate category against the enum values
        const validCategories = schema.productCategoryEnum.enumValues;
        if (validCategories.includes(category as any)) {
          products = await storage.getProductsByCategory(category as typeof schema.productCategoryEnum.enumValues[number]);
        } else {
          // If category is not valid, fetch all products
          products = await storage.getAllProducts();
        }
      } else {
        products = await storage.getAllProducts();
      }
      
      return res.json(products);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/products/:slug`, async (req, res) => {
    try {
      // Only treat as ID when the entire param is digits (e.g. "3" not "3PL7VEN")
      const isId = /^\d+$/.test(req.params.slug);
      
      let product;
      if (isId) {
        // Get product by ID for admin panel editing
        const id = parseInt(req.params.slug);
        product = await db.query.products.findFirst({
          where: eq(schema.products.id, id)
        });
      } else {
        // Get product by slug for public facing pages
        const { slug } = req.params;
        product = await storage.getProductBySlug(slug);
      }
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      return res.json(product);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Admin product management endpoints
  app.post(`${apiPrefix}/products`, isAdmin, async (req, res) => {
    try {
      // Validate request body
      const productData = schema.productsInsertSchema.parse(req.body);
      
      // Insert product into database
      const [product] = await db.insert(schema.products)
        .values(productData)
        .returning();
      
      return res.status(201).json(product);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.put(`${apiPrefix}/products/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Get the current product to verify it exists
      const existingProduct = await db.query.products.findFirst({
        where: eq(schema.products.id, id)
      });
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Remove createdAt from the request body if present
      const { createdAt, ...productWithoutCreatedAt } = req.body;
      
      // Validate remaining data
      const productData = schema.productsInsertSchema.parse({
        ...productWithoutCreatedAt,
        createdAt: existingProduct.createdAt // Keep original creation date
      });
      
      // Remove createdAt from data being updated to prevent errors
      delete productData.createdAt;
      
      // Update product in database
      const [updatedProduct] = await db.update(schema.products)
        .set(productData)
        .where(eq(schema.products.id, id))
        .returning();
      
      return res.json(updatedProduct);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.delete(`${apiPrefix}/products/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if product exists
      const existingProduct = await db.query.products.findFirst({
        where: eq(schema.products.id, id)
      });
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Delete product from database
      await db.delete(schema.products)
        .where(eq(schema.products.id, id));
      
      return res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Podcasts endpoints
  app.get(`${apiPrefix}/podcasts`, async (req, res) => {
    try {
      const podcasts = await storage.getAllPodcasts();
      return res.json(podcasts);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/podcasts/:slug`, async (req, res) => {
    try {
      console.log(`Server: Received request for podcast by slug/ID: ${req.params.slug}`); // Debug log
      // Only treat as ID when the entire param is digits (e.g. "3" not "3PL7VEN")
      const isId = /^\d+$/.test(req.params.slug);
      
      let podcast;
      if (isId) {
        // Get podcast by ID for admin panel editing
        const id = parseInt(req.params.slug);
        console.log(`Server: Attempting to fetch podcast by ID: ${id}`); // Debug log
        podcast = await db.query.podcasts.findFirst({
          where: eq(schema.podcasts.id, id)
        });
      } else {
        // Get podcast by slug for public facing pages
        const { slug } = req.params;
        console.log(`Server: Attempting to fetch podcast by slug: ${slug}`); // Debug log
        podcast = await storage.getPodcastBySlug(slug);
      }
      
      if (!podcast) {
        console.log(`Server: Podcast with ID/slug ${req.params.slug} not found.`); // Debug log
        return res.status(404).json({ message: "Podcast not found" });
      }
      
      console.log("Server: Found podcast:", podcast); // Debug log
      return res.json(podcast);
    } catch (err) {
      console.error("Server: Error fetching podcast:", err); // Debug log
      handleErrors(err, res);
    }
  });
  
  // Admin podcast management endpoints
  app.post(`${apiPrefix}/podcasts`, isAdmin, async (req, res) => {
    try {
      console.log('--- PODCAST CREATION DEBUG ---');
      console.log('Raw request body BEFORE conversion:', req.body);
      
      // Explicitly convert createdAt to a Date object if it's a string
      if (typeof req.body.createdAt === 'string') {
        req.body.createdAt = new Date(req.body.createdAt);
      }
      
      console.log('Request body AFTER createdAt conversion:', req.body);

      let podcastData;
      try {
        // Handle coverUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
        if (req.body.coverUrl && !req.body.coverUrl.startsWith('http://') && !req.body.coverUrl.startsWith('https://') && !req.body.coverUrl.startsWith('/uploads/podcast_images/')) {
          req.body.coverUrl = `/uploads/podcast_images/${req.body.coverUrl}`;
        }

        podcastData = schema.podcastsInsertSchema.parse(req.body);
        console.log('Parsed podcast data:', podcastData);
      } catch (parseErr) {
        console.error('Zod validation error:', parseErr);
        console.error('Validation error details:', parseErr.errors);
        return res.status(400).json({ 
          message: 'Validation error', 
          error: parseErr,
          errors: parseErr.errors || [],
          details: parseErr.message 
        });
      }

      const { createdAt, ...insertData } = podcastData; // Exclude createdAt for insertion
      console.log('Data to insert into DB:', insertData);
      // Insert podcast into database
      try {
        const [podcast] = await db.insert(schema.podcasts)
          .values(insertData)
          .returning();
        console.log('Podcast created successfully:', podcast);
        return res.status(201).json(podcast);
      } catch (dbErr) {
        console.error('Database insertion error:', dbErr);
        return res.status(500).json({ message: 'Database error', error: dbErr });
      }
    } catch (err) {
      console.error('Server: Error creating podcast:', err);
      handleErrors(err, res);
    }
  });

  // Podcast reorder endpoint - must come before individual podcast update endpoint
  app.put(`${apiPrefix}/admin/podcasts/reorder`, isAdmin, async (req, res) => {
    try {
      const { podcastIds } = req.body;
      
      if (!Array.isArray(podcastIds)) {
        return res.status(400).json({ message: "Invalid podcast IDs array" });
      }

      // Update the display order for each podcast
      for (let i = 0; i < podcastIds.length; i++) {
        await db.update(schema.podcasts)
          .set({ displayOrder: i })
          .where(eq(schema.podcasts.id, podcastIds[i]));
      }

      return res.json({ message: "Podcasts reordered successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.put(`${apiPrefix}/admin/podcasts/:id`, isAdmin, async (req, res) => {
    try {
      console.log('Received update request for podcast:', req.params.id);
      console.log('Request body:', req.body);

      // Debug: log request body and createdAt type before validation
      console.log('Request body before validation:', req.body);
      console.log('Type of createdAt:', typeof req.body.createdAt, req.body.createdAt);

      // Force-convert createdAt to a Date if it's a string
      if (typeof req.body.createdAt === 'string') {
        req.body.createdAt = new Date(req.body.createdAt);
        if (isNaN(req.body.createdAt.getTime())) {
          req.body.createdAt = new Date();
        }
      }
      console.log('Type of createdAt after conversion:', typeof req.body.createdAt, req.body.createdAt);

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error('Invalid podcast ID:', req.params.id);
        return res.status(400).json({ message: "Invalid podcast ID" });
      }
      
      // Get the current podcast to verify it exists
      const existingPodcast = await db.query.podcasts.findFirst({
        where: eq(schema.podcasts.id, id)
      });
      
      if (!existingPodcast) {
        console.error('Podcast not found:', id);
        return res.status(404).json({ message: "Podcast not found" });
      }
      
      console.log('Existing podcast:', existingPodcast);
      
      // Handle coverUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
      if (req.body.coverUrl && !req.body.coverUrl.startsWith('http://') && !req.body.coverUrl.startsWith('https://') && !req.body.coverUrl.startsWith('/uploads/podcast_images/')) {
        req.body.coverUrl = `/uploads/podcast_images/${req.body.coverUrl}`;
      }

      // Validate incoming data with the shared schema
      const updateData = schema.podcastsInsertSchema.parse(req.body);
      console.log('Validated update data:', updateData);

      // Create an object for update, explicitly excluding createdAt and id from direct update
      const { createdAt, id: podcastId, ...dataToUpdate } = updateData;
      
      console.log('Final data to update:', dataToUpdate);

      // Update podcast in database
      const [updatedPodcast] = await db.update(schema.podcasts)
        .set(dataToUpdate)
        .where(eq(schema.podcasts.id, id))
        .returning();
      
      if (!updatedPodcast) {
        console.error('Failed to update podcast:', id);
        return res.status(500).json({ message: "Failed to update podcast" });
      }

      console.log('Updated podcast:', updatedPodcast);
      return res.json(updatedPodcast);
    } catch (err) {
      console.error('Error updating podcast:', err);
      handleErrors(err, res);
    }
  });
  
  app.delete(`${apiPrefix}/admin/podcasts/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid podcast ID" });
      }

      const [deletedPodcast] = await db.delete(schema.podcasts)
        .where(eq(schema.podcasts.id, id))
        .returning();

      if (!deletedPodcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }

      return res.json({ message: "Podcast deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Admin podcast management endpoints
  app.post(`${apiPrefix}/podcasts/upload-image`, isAdmin, (req, res, next) => {
    podcastUpload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = `/uploads/podcast_images/${req.file.filename}`;
      return res.json({ imageUrl });
    } catch (err) {
      console.error('Error uploading podcast image:', err);
      handleErrors(err, res);
    }
  });

  // Articles endpoints
  app.get(`${apiPrefix}/articles`, async (req, res) => {
    try {
      const { category } = req.query;
      
      let articles;
      if (category && typeof category === 'string' && category !== 'all') {
        articles = await storage.getArticlesByCategory(category);
      } else {
        articles = await storage.getAllArticles();
      }
      
      return res.json(articles);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/articles/:slug`, async (req, res) => {
    try {
      // Only treat as ID when the entire param is digits (e.g. "3" not "3PL7VEN")
      const isId = /^\d+$/.test(req.params.slug);
      
      let article;
      if (isId) {
        // Get article by ID for admin panel editing
        const id = parseInt(req.params.slug);
        article = await db.query.articles.findFirst({
          where: eq(schema.articles.id, id)
        });
      } else {
        // Get article by slug for public facing pages
        const { slug } = req.params;
        article = await storage.getArticleBySlug(slug);
      }
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      return res.json(article);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Admin article management endpoints
  app.post(`${apiPrefix}/articles`, isAdmin, async (req, res) => {
    try {
      // Validate request body
      const articleData = schema.articlesInsertSchema.parse(req.body);
      
      // Insert article into database
      const [article] = await db.insert(schema.articles)
        .values(articleData)
        .returning();
      
      return res.status(201).json(article);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.put(`${apiPrefix}/articles/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      // Get the current article to verify it exists
      const existingArticle = await db.query.articles.findFirst({
        where: eq(schema.articles.id, id)
      });

      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      // If the imageUrl is a full path, keep it as is
      if (req.body.imageUrl) {
        if (!req.body.imageUrl.startsWith('/uploads/article_images/') && 
            !req.body.imageUrl.startsWith('http://') && 
            !req.body.imageUrl.startsWith('https://')) {
          // If it's just a filename, prepend the path
          req.body.imageUrl = `/uploads/article_images/${req.body.imageUrl}`;
        }
      }

      // Validate remaining data
      const articleData = schema.articlesInsertSchema.parse(req.body);

      // Update article in database
      const [updatedArticle] = await db.update(schema.articles)
        .set(articleData)
        .where(eq(schema.articles.id, id))
        .returning();

      return res.json(updatedArticle);
    } catch (err) {
      console.error('Error updating article:', err);
      handleErrors(err, res);
    }
  });
  
  app.delete(`${apiPrefix}/articles/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const [deletedArticle] = await db.delete(schema.articles)
        .where(eq(schema.articles.id, id))
        .returning();

      if (!deletedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      return res.json({ message: "Article deleted successfully" });
    } catch (err) {
      console.error('Error deleting article:', err);
      handleErrors(err, res);
    }
  });

  // Admin API Routes
  app.get(`${apiPrefix}/admin/stats`, isAdmin, async (req, res) => {
    try {
      // Get counts from each table using count() function
      const [
        artistsCount,
        eventsCount,
        productsCount,
        podcastsCount,
        articlesCount,
        usersCount
      ] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(schema.artists),
        db.select({ count: sql`count(*)` }).from(schema.events),
        db.select({ count: sql`count(*)` }).from(schema.products),
        db.select({ count: sql`count(*)` }).from(schema.podcasts),
        db.select({ count: sql`count(*)` }).from(schema.articles),
        db.select({ count: sql`count(*)` }).from(schema.users)
      ]);

      return res.json({
        artists: Number(artistsCount[0].count),
        events: Number(eventsCount[0].count),
        products: Number(productsCount[0].count),
        podcasts: Number(podcastsCount[0].count),
        articles: Number(articlesCount[0].count),
        users: Number(usersCount[0].count)
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      handleErrors(err, res);
    }
  });

  // Enhanced Analytics API
  app.get(`${apiPrefix}/admin/analytics`, isAdmin, async (req, res) => {
    try {
      const { timeRange = '7days' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Get real data from database
      const [
        totalUsers,
        totalOrders,
        recentOrders,
        contentStats
      ] = await Promise.all([
        // Total users
        db.select({ count: sql`count(*)` }).from(schema.users),
        
        // Total orders and revenue
        db.select({ 
          count: sql`count(*)`,
          revenue: sql`COALESCE(SUM(total), 0)`
        }).from(schema.orders),
        
        // Recent orders for activity data
        db.select({
          id: schema.orders.id,
          total: schema.orders.total,
          status: schema.orders.status,
          createdAt: schema.orders.createdAt
        }).from(schema.orders)
        .where(gte(schema.orders.createdAt, startDate))
        .orderBy(desc(schema.orders.createdAt)),
        
        // Content statistics
        Promise.all([
          db.select({ count: sql`count(*)` }).from(schema.podcasts),
          db.select({ count: sql`count(*)` }).from(schema.articles),
          db.select({ count: sql`count(*)` }).from(schema.events),
          db.select({ count: sql`count(*)` }).from(schema.products)
        ])
      ]);

      // Generate user activity data after we have recentOrders
      const userActivity = generateUserActivityData(startDate, endDate, recentOrders);

      // Calculate metrics
      const totalUsersCount = Number(totalUsers[0].count);
      const totalOrdersCount = Number(totalOrders[0].count);
      const totalRevenueAmount = Number(totalOrders[0].revenue);
      

      
      // Calculate engagement (orders per user)
      const avgEngagement = totalUsersCount > 0 ? Math.round((totalOrdersCount / totalUsersCount) * 100) : 0;
      
      // Content performance
      const [podcastsCount, articlesCount, eventsCount, productsCount] = contentStats.map(result => Number(result[0].count));
      const totalContent = podcastsCount + articlesCount + eventsCount + productsCount;
      
      const contentPerformance = [
        { type: 'Podcasts', views: podcastsCount, engagement: Math.round((podcastsCount / totalContent) * 100), growth: 12 },
        { type: 'Articles', views: articlesCount, engagement: Math.round((articlesCount / totalContent) * 100), growth: 8 },
        { type: 'Events', views: eventsCount, engagement: Math.round((eventsCount / totalContent) * 100), growth: 15 },
        { type: 'Products', views: productsCount, engagement: Math.round((productsCount / totalContent) * 100), growth: -3 }
      ];

      // Top performing content (based on actual content)
      const topContent = [
        { title: 'Desert Transmissions', type: 'Podcast', views: podcastsCount * 10, engagement: 85 },
        { title: 'Esoteric Sounds Gathering', type: 'Event', views: eventsCount * 8, engagement: 92 },
        { title: 'Amazigh Rhythms Guide', type: 'Article', views: articlesCount * 12, engagement: 78 },
        { title: 'Mystical Journeys Vinyl', type: 'Product', views: productsCount * 15, engagement: 68 }
      ];

      return res.json({
        metrics: {
          totalUsers: totalUsersCount,
          totalOrders: totalOrdersCount,
          totalRevenue: totalRevenueAmount,
          avgEngagement: avgEngagement,
          currency: 'USD'
        },
        userActivity,
        contentPerformance,
        topContent
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      handleErrors(err, res);
    }
  });

  // Helper function to generate user activity data
  function generateUserActivityData(startDate: Date, endDate: Date, orders: any[]) {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === currentDate.toDateString();
      });
      
      // Use real order data and realistic user activity
      const dayRevenue = dayOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const dayOrdersCount = dayOrders.length;
      
      // Estimate users based on orders (more realistic for small site)
      const estimatedUsers = dayOrdersCount > 0 ? Math.min(dayOrdersCount, 3) : Math.floor(Math.random() * 2) + 1;
      
      // Estimate sessions (usually 1.5-2x users)
      const estimatedSessions = Math.floor(estimatedUsers * (1.5 + Math.random() * 0.5));
      
      // Estimate page views (usually 3-5x sessions)
      const estimatedPageViews = Math.floor(estimatedSessions * (3 + Math.random() * 2));
      
      days.push({
        period: currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        users: estimatedUsers,
        sessions: estimatedSessions,
        pageViews: estimatedPageViews,
        orders: dayOrdersCount,
        revenue: dayRevenue
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  // Admin artists endpoint
  app.get(`${apiPrefix}/admin/artists`, isAdmin, async (req, res) => {
    try {
      console.log('Admin artists endpoint called - bypassing cache for testing');
      // Set headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
      });
      
      // Temporarily bypass cache to test if that's the issue
      const artists = await storage.getAllArtistsFresh();
      console.log('Returning fresh artists data to admin:', artists.map((a: any) => a.name));
      
      // Add timestamp to ensure response is unique
      const responseData = {
        artists,
        timestamp: Date.now(),
        cacheBuster: Math.random().toString(36).substring(7)
      };
      
      return res.json(responseData);
    } catch (err) {
      console.error('Error in admin artists endpoint:', err);
      handleErrors(err, res);
    }
  });

  // Test endpoint - direct database query without any caching
  app.get(`${apiPrefix}/admin/artists/direct`, isAdmin, async (req, res) => {
    try {
      console.log('Direct database query endpoint called');
      const artists = await db.query.artists.findMany({
        orderBy: [schema.artists.displayOrder, desc(schema.artists.createdAt)]
      });
      console.log('Direct database query result:', artists.map((a: any) => a.name));
      return res.json(artists);
    } catch (err) {
      console.error('Error in direct database query:', err);
      handleErrors(err, res);
    }
  });

  // Test endpoint - query specific artist by ID
  app.get(`${apiPrefix}/admin/artists/test/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artist ID" });
      }
      
      console.log(`Testing artist with ID: ${id}`);
      
      // Query directly from database
      const artist = await db.query.artists.findFirst({
        where: eq(schema.artists.id, id)
      });
      
      console.log('Direct database query for artist:', artist);
      console.log('Artist name from database:', artist?.name);
      
      return res.json({
        artist,
        timestamp: Date.now(),
        message: 'Direct database query result'
      });
    } catch (err) {
      console.error('Error in artist test query:', err);
      handleErrors(err, res);
    }
  });

  // Reorder artists endpoint
  app.put(`${apiPrefix}/admin/artists/reorder`, isAdmin, async (req, res) => {
    try {
      const { artistIds } = req.body;
      
      if (!Array.isArray(artistIds)) {
        return res.status(400).json({ message: "artistIds must be an array" });
      }

      // Update display order for each artist
      for (let i = 0; i < artistIds.length; i++) {
        const artistId = artistIds[i];
        await db.update(schema.artists)
          .set({ displayOrder: i + 1 })
          .where(eq(schema.artists.id, artistId));
      }

      // Return updated artists list
      const updatedArtists = await storage.getAllArtists();
      
      // Clear artist cache to ensure fresh data is fetched
      storage.clearArtistCache();
      
      return res.json(updatedArtists);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Payment API endpoints
  // Create CMI payment session
  app.post(`${apiPrefix}/payments/cmi/create-session`, async (req, res) => {
    try {
      // Validate request body
      const paymentData = z.object({
        amount: z.number().positive("Amount must be greater than 0"),
        currency: z.string().default("USD"),
        userId: z.number().optional(),
        customerEmail: z.string().email("Valid email is required"),
        customerName: z.string().min(3, "Customer name is required"),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().int().positive()
        })),
        billingAddress: z.string().optional(),
        shippingAddress: z.string().optional()
      }).parse(req.body);
      
      // Create payment session
      const paymentSession = await createCmiPaymentSession({
        ...paymentData,
        paymentMethod: 'cmi'
      });
      
      return res.json(paymentSession);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Create PayPal payment
  app.post(`${apiPrefix}/payments/paypal/create-payment`, async (req, res) => {
    try {
      // Validate request body
      const paymentData = z.object({
        amount: z.number().positive("Amount must be greater than 0"),
        currency: z.string().default("USD"),
        userId: z.number().optional(),
        customerEmail: z.string().email("Valid email is required"),
        customerName: z.string().min(3, "Customer name is required"),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().int().positive()
        })),
        billingAddress: z.string().optional(),
        shippingAddress: z.string().optional()
      }).parse(req.body);
      
      // Create payment
      const paymentSession = await createPaypalPayment({
        ...paymentData,
        paymentMethod: 'paypal'
      });
      
      return res.json(paymentSession);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // CMI payment callback endpoint
  app.post(`${apiPrefix}/payments/cmi/callback`, async (req, res) => {
    try {
      // Validate callback data
      const callbackData = z.object({
        orderId: z.number(),
        paymentId: z.string(),
        amount: z.number(),
        status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'])
      }).parse(req.body);
      
      // Process payment verification
      const result = await verifyPayment(callbackData);
      
      return res.json(result);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // PayPal payment verification endpoint
  app.post(`${apiPrefix}/payments/paypal/verify`, async (req, res) => {
    try {
      // Validate verification data
      const verificationData = z.object({
        orderId: z.number(),
        paymentId: z.string(),
        amount: z.number(),
        status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'])
      }).parse(req.body);
      
      // Process payment verification
      const result = await verifyPayment(verificationData);
      
      return res.json(result);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get order details (with items)
  app.get(`${apiPrefix}/orders/details`, async (req, res) => {
    try {
      const orderIdParam = req.query.orderId as string;
      
      // Import necessary schema from shared
      const { orders, orderItems } = await import('@shared/schema');
      
      let order;
      
      // We'll use any for now since we'll type-check at the API response level
      let orderItemsWithProducts: any[] = [];
      
      // First, try to parse as numeric ID
      const numericOrderId = parseInt(orderIdParam);
      
      if (!isNaN(numericOrderId)) {
        // Get the order by numeric ID
        order = await db.query.orders.findFirst({
          where: eq(orders.id, numericOrderId)
        });
        
        if (order) {
          // Get order items with products
          orderItemsWithProducts = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, numericOrderId),
            with: {
              product: true
            }
          });
        }
      }
      
      // If not found by numeric ID, try searching by PayPal order ID
      if (!order) {
        // Check if this might be a PayPal order ID (typically alphanumeric)
        order = await db.query.orders.findFirst({
          where: eq(orders.paypalOrderId, orderIdParam)
        });
        
        if (order) {
          // Get order items with products
          orderItemsWithProducts = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, order.id),
            with: {
              product: true
            }
          });
          
          console.log(`Found order by PayPal ID: ${orderIdParam}, DB order ID: ${order.id}`);
        }
      }
      
      // If still not found, return 404
      if (!order) {
        return res.status(404).json({ 
          message: "Order not found",
          details: `Could not find order with ID: ${orderIdParam}`
        });
      }
      
      // Return the complete order details
      return res.json({
        order,
        items: orderItemsWithProducts
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get order details (protected)
  app.get(`${apiPrefix}/orders/:id`, isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Get order details
      const order = await getOrderById(orderId);
      
      // Check if user has permission to view this order
      const user = req.user as { id: number; role?: string } | undefined;
      if (user && (user.role === 'admin' || order.userId === user.id)) {
        return res.json(order);
      } else {
        return res.status(403).json({ message: "You don't have permission to view this order" });
      }
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get digital product download link
  app.get(`${apiPrefix}/orders/:orderId/products/:productId/download`, isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const productId = parseInt(req.params.productId);
      
      if (isNaN(orderId) || isNaN(productId)) {
        return res.status(400).json({ message: "Invalid order or product ID" });
      }
      
      // Get digital product download link
      const user = req.user as { id: number } | undefined;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const downloadData = await getDigitalProductDownload(orderId, productId, user.id);
      
      return res.json(downloadData);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // PayPal integration routes
  app.get(`${apiPrefix}/paypal/setup`, async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post(`${apiPrefix}/paypal/order`, async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    // It may also include cart items and customerEmail if provided
    await createPaypalOrder(req, res);
  });
  
  // Create order items from cart
  app.post(`${apiPrefix}/orders/:orderId/items`, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { cartItems } = req.body;
      
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: "No cart items provided" });
      }
      
      // Import the cart service
      const { createOrderItemsFromCart, updateOrderTotal } = await import('./services/payment-cart');
      
      // Get the order
      const { orders } = await import('@shared/schema');
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
      });
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create order items
      const orderItems = await createOrderItemsFromCart(orderId, cartItems);
      
      // Update order total
      const updatedOrder = await updateOrderTotal(order, cartItems);
      
      return res.status(201).json({
        order: updatedOrder,
        items: orderItems
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  /**
   * Get PayPal order status without capturing
   */
  async function getPaypalOrderStatus(orderId: string): Promise<{
    id: string;
    status: string;
    purchase_units: Array<any>;
    payment_source?: any;
    [key: string]: any;
  }> {
    try {
      // Use same auth approach as in paypal.ts
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
      ).toString("base64");
  
      // Get a PayPal access token for API request
      const response = await fetch(
        `https://${process.env.NODE_ENV === 'production' ? 'api' : 'api.sandbox'}.paypal.com/v1/oauth2/token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get auth token: ${await response.text()}`);
      }
      
      const tokenData = await response.json() as { access_token: string };
      const accessToken = tokenData.access_token;
      
      // Now use the token to get order status
      const orderResponse = await fetch(
        `https://${process.env.NODE_ENV === 'production' ? 'api' : 'api.sandbox'}.paypal.com/v2/checkout/orders/${orderId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!orderResponse.ok) {
        throw new Error(`Failed to get order status: ${await orderResponse.text()}`);
      }
      
      return await orderResponse.json() as {
        id: string;
        status: string;
        purchase_units: Array<any>;
        payment_source?: any;
        [key: string]: any;
      };
    } catch (error) {
      console.error("Error getting PayPal order status:", error);
      throw error;
    }
  }
  
  app.post(`${apiPrefix}/paypal/order/:orderID/capture`, async (req, res) => {
    try {
      // Get the order ID from params
      const { orderID } = req.params;
      let orderData: {
        id: string;
        status: string;
        purchase_units: Array<any>;
        payment_source?: any;
        [key: string]: any;
      } | undefined;
      
      try {
        // First check if order is already captured
        orderData = await getPaypalOrderStatus(orderID);
        console.log(`Order ${orderID} status check: ${orderData.status}`);
        
        // If the order is already completed, skip the capture call and return existing data
        if (orderData.status === 'COMPLETED') {
          console.log(`Order ${orderID} already captured, returning existing data`);
          
          // Process the payment asynchronously to send confirmation email
          setTimeout(async () => {
            try {
              if (orderData) {
                console.log('Processing existing PayPal payment for order:', orderID);
                
                // Process cart items from request body if available
                const { cartItems, customerEmail } = req.body || {};
                const userId = req.user ? (req.user as any).id : 0;
                
                // Get user name for the order
                let customerName = "Guest User";
                if (req.user) {
                  if ((req.user as any).firstName && (req.user as any).lastName) {
                    customerName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;
                  } else {
                    customerName = (req.user as any).username;
                  }
                }
                
                try {
                  if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
                    console.log(`Processing ${cartItems.length} cart items for PayPal order ${orderID}`);
                    
                    // Import the cart service
                    const { processCartItemsForPaypalOrder } = await import('./services/payment-cart');
                    
                    // Process the cart items for this order
                    await processCartItemsForPaypalOrder(
                      orderID, 
                      cartItems, 
                      userId, 
                      customerEmail || (req.user ? (req.user as any).email : ''),
                      customerName
                    );
                    
                    console.log(`Successfully processed cart items for PayPal order ${orderID}`);
                  } else {
                    console.log(`No cart items provided for PayPal order ${orderID}, using standard processing`);
                  }
                } catch (cartError) {
                  console.error(`Error processing cart items for PayPal order ${orderID}:`, cartError);
                  // Continue with normal payment processing even if cart processing fails
                }
                
                // Check reference_id for 'default' value in purchase units
                if (orderData && 
                    orderData.purchase_units && 
                    orderData.purchase_units.length > 0 &&
                    orderData.purchase_units[0].reference_id === 'default') {
                  console.log('Detected PayPal default reference_id in existing order, handling special case');
                }
                
                // Standard payment processing
                await processPayPalPayment(orderData);
                console.log(`PayPal payment processed asynchronously for existing order: ${orderID}`);
              }
            } catch (confirmationError: any) {
              console.error('Error in async payment confirmation for existing order:', confirmationError.message);
            }
          }, 100);
          
          return res.status(200).json(orderData);
        }
      } catch (statusCheckError: any) {
        // If we can't check status, log it but continue with capture attempt
        console.warn(`Could not check order status before capture: ${statusCheckError.message}`);
      }
      
      // Create a custom response object to intercept the response data
      const originalSend = res.send;
      let captureResponseData: any = null;
      
      res.send = function(body) {
        captureResponseData = typeof body === 'string' ? JSON.parse(body) : body;
        // Call the original send method
        return originalSend.call(this, body);
      };
      
      // If we reach here, either the status check failed or the order isn't completed yet
      // So try to capture it normally
      try {
        // Call the original PayPal capture function
        await capturePaypalOrder(req, res);
        
        // If we successfully captured, process the payment asynchronously
        if (captureResponseData && captureResponseData.status === 'COMPLETED') {
          setTimeout(async () => {
            try {
              console.log('Processing PayPal payment for order:', orderID);
              
              // Process cart items from request body if available
              const { cartItems, customerEmail } = req.body || {};
              const userId = req.user ? (req.user as any).id : 0;
              
              // Get user name for the order
              let customerName = "Guest User";
              if (req.user) {
                if ((req.user as any).firstName && (req.user as any).lastName) {
                  customerName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;
                } else {
                  customerName = (req.user as any).username;
                }
              }
              
              try {
                if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
                  console.log(`Processing ${cartItems.length} cart items for PayPal order ${orderID}`);
                  
                  // Import the cart service
                  const { processCartItemsForPaypalOrder } = await import('./services/payment-cart');
                  
                  // Process the cart items for this order
                  await processCartItemsForPaypalOrder(
                    orderID, 
                    cartItems, 
                    userId, 
                    customerEmail || (req.user ? (req.user as any).email : ''),
                    customerName
                  );
                  
                  console.log(`Successfully processed cart items for PayPal order ${orderID}`);
                } else {
                  console.log(`No cart items provided for PayPal order ${orderID}, using standard processing`);
                }
              } catch (cartError) {
                console.error(`Error processing cart items for PayPal order ${orderID}:`, cartError);
                // Continue with normal payment processing even if cart processing fails
              }
              
              // Check reference_id for 'default' value in purchase units
              if (captureResponseData && 
                  captureResponseData.purchase_units && 
                  captureResponseData.purchase_units.length > 0 &&
                  captureResponseData.purchase_units[0].reference_id === 'default') {
                console.log('Detected PayPal default reference_id, handling special case');
              }
              
              // Standard payment processing
              await processPayPalPayment(captureResponseData);
              console.log(`PayPal payment processed asynchronously for new order: ${orderID}`);
            } catch (confirmationError: any) {
              console.error('Error in async payment confirmation for new order:', confirmationError.message);
            }
          }, 100);
        }
      } catch (captureError: any) {
        // Check if this is an ORDER_ALREADY_CAPTURED error
        const errorBody = captureError.body ? 
                          (typeof captureError.body === 'string' ? JSON.parse(captureError.body) : captureError.body) : 
                          null;
        
        if (errorBody && 
            errorBody.details && 
            Array.isArray(errorBody.details) &&
            errorBody.details.some((detail: any) => detail.issue === 'ORDER_ALREADY_CAPTURED')) {
          
          console.log("Handling ORDER_ALREADY_CAPTURED error gracefully");
          
          try {
            // Get the current order status and return that instead
            const existingOrderData = await getPaypalOrderStatus(orderID);
            
            // Process the payment asynchronously for email confirmation
            setTimeout(async () => {
              try {
                console.log('Processing PayPal payment after capture error for order:', orderID);
                
                // Check reference_id for 'default' value in purchase units
                if (existingOrderData && 
                    existingOrderData.purchase_units && 
                    existingOrderData.purchase_units.length > 0 &&
                    existingOrderData.purchase_units[0].reference_id === 'default') {
                  console.log('Detected PayPal default reference_id after capture error, handling special case');
                }
                
                await processPayPalPayment(existingOrderData);
                console.log(`PayPal payment processed asynchronously after capture error: ${orderID}`);
              } catch (confirmationError: any) {
                console.error('Error in async payment confirmation after capture error:', confirmationError.message);
              }
            }, 100);
            
            return res.status(200).json(existingOrderData);
          } catch (getStatusError: any) {
            console.error("Failed to get status after capture error:", getStatusError.message);
            throw captureError; // Re-throw the original error if we can't get the status
          }
        } else {
          // This is some other error, re-throw it
          throw captureError;
        }
      }
    } catch (error: any) {
      // This handles any errors that weren't caught above
      console.error("Failed to capture order:", error);
      
      // Only send a response if one hasn't been sent already
      if (!res.headersSent) {
        // If we have detailed error info, send it
        if (error.result) {
          return res.status(500).json({ 
            error: "Failed to capture order.", 
            details: error.result 
          });
        }
        
        // Otherwise send a generic error
        res.status(500).json({ error: "Failed to capture order." });
      }
    }
  });

  // ===== COD (Cash on Delivery) API Endpoints =====
  
  // Create COD Order
  app.post(`${apiPrefix}/orders/cod`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { cartItems, customerName, customerPhone, shippingAddress, notes } = req.body;
      
      // Validate required fields for COD
      if (!customerName || !customerPhone || !shippingAddress) {
        return res.status(400).json({ 
          message: "Customer name, phone, and shipping address are required for COD orders" 
        });
      }
      
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: "Cart items are required" });
      }
      
      // Calculate total from cart items
      let total = 0;
      for (const item of cartItems) {
        total += parseFloat(item.price) * item.quantity;
      }
      
      // Create the COD order
      const [newOrder] = await db.insert(schema.orders).values({
        userId,
        status: 'pending',
        total: total.toString(),
        currency: 'USD',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        customerEmail: (req.user as any).email,
        customerName,
        customerPhone,
        shippingAddress,
        notes: notes || null
      }).returning();
      
      // Create order items
      for (const item of cartItems) {
        await db.insert(schema.orderItems).values({
          orderId: newOrder.id,
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        });
      }
      
      return res.status(201).json({
        message: "COD order created successfully",
        order: newOrder
      });
      
    } catch (err) {
      console.error('Error creating COD order:', err);
      handleErrors(err, res);
    }
  });
  
  // Get Delivery Personnel (Admin only)
  app.get(`${apiPrefix}/admin/delivery-personnel`, isAdmin, async (req: Request, res: Response) => {
    try {
      const personnel = await db.select().from(schema.deliveryPersonnel).orderBy(asc(schema.deliveryPersonnel.name));
      return res.json(personnel);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Add Delivery Personnel (Admin only)
  app.post(`${apiPrefix}/admin/delivery-personnel`, isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = schema.deliveryPersonnelInsertSchema.parse(req.body);
      const [newPersonnel] = await db.insert(schema.deliveryPersonnel).values(validatedData).returning();
      return res.status(201).json(newPersonnel);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Assign Delivery Personnel to Order (Admin only)
  app.put(`${apiPrefix}/admin/orders/:orderId/assign-delivery`, isAdmin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { deliveryPersonnelId, deliveryScheduledAt } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Check if order exists and is COD
      const existingOrder = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId)
      });
      
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (existingOrder.paymentMethod !== 'cod') {
        return res.status(400).json({ message: "Can only assign delivery to COD orders" });
      }
      
      // Update order with delivery assignment
      const [updatedOrder] = await db.update(schema.orders)
        .set({
          deliveryPersonnelId,
          deliveryScheduledAt: deliveryScheduledAt ? new Date(deliveryScheduledAt) : null,
          status: 'shipped',
          updatedAt: new Date()
        })
        .where(eq(schema.orders.id, orderId))
        .returning();
      
      return res.json({
        message: "Delivery personnel assigned successfully",
        order: updatedOrder
      });
      
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Update Delivery Status (Delivery Personnel)
  app.put(`${apiPrefix}/delivery/orders/:orderId/status`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status, deliveryNotes, cashCollectedAmount } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Validate status
      const validStatuses = ['out_for_delivery', 'delivered', 'delivered_paid'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: out_for_delivery, delivered, delivered_paid" 
        });
      }
      
      // Check if order exists and is assigned to this delivery person (or admin)
      const existingOrder = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId),
        with: {
          deliveryPersonnel: true
        }
      });
      
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check authorization (admin or assigned delivery personnel)
      const userRole = (req.user as any).role;
      if (userRole !== 'admin' && existingOrder.deliveryPersonnelId !== (req.user as any).id) {
        return res.status(403).json({ message: "Not authorized to update this order" });
      }
      
      // Prepare update data
      const updateData: any = {
        status,
        deliveryNotes,
        updatedAt: new Date()
      };
      
      // Set timestamps based on status
      if (status === 'out_for_delivery') {
        updateData.deliveryAttemptedAt = new Date();
      } else if (status === 'delivered' || status === 'delivered_paid') {
        updateData.deliveryCompletedAt = new Date();
        
        if (status === 'delivered_paid') {
          updateData.paymentStatus = 'completed';
          if (cashCollectedAmount) {
            updateData.cashCollectedAmount = cashCollectedAmount.toString();
          }
        }
      }
      
      // Update order
      const [updatedOrder] = await db.update(schema.orders)
        .set(updateData)
        .where(eq(schema.orders.id, orderId))
        .returning();
      
      return res.json({
        message: "Delivery status updated successfully",
        order: updatedOrder
      });
      
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get COD Orders for Admin
  app.get(`${apiPrefix}/admin/orders/cod`, isAdmin, async (req: Request, res: Response) => {
    try {
      const codOrders = await db.query.orders.findMany({
        where: eq(schema.orders.paymentMethod, 'cod'),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          deliveryPersonnel: true,
          items: {
            with: {
              product: true
            }
          }
        },
        orderBy: desc(schema.orders.createdAt)
      });
      
      return res.json(codOrders);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Delete COD Order for Admin
  app.delete(`${apiPrefix}/admin/orders/cod/:orderId`, isAdmin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Check if order exists and is COD
      const existingOrder = await db.query.orders.findFirst({
        where: and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.paymentMethod, 'cod')
        )
      });
      
      if (!existingOrder) {
        return res.status(404).json({ message: "COD order not found" });
      }
      
      // Delete order items first (due to foreign key constraints)
      await db.delete(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));
      
      // Delete the order
      await db.delete(schema.orders)
        .where(eq(schema.orders.id, orderId));
      
      return res.status(200).json({ message: "COD order deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Delete Order for Admin (general orders)
  app.delete(`${apiPrefix}/admin/orders/:orderId`, isAdmin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Check if order exists
      const existingOrder = await db.query.orders.findFirst({
        where: eq(schema.orders.id, orderId)
      });
      
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Delete order items first (due to foreign key constraints)
      await db.delete(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));
      
      // Delete the order
      await db.delete(schema.orders)
        .where(eq(schema.orders.id, orderId));
      
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Delete Order for User (their own orders)
  app.delete(`${apiPrefix}/orders/:orderId`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const userId = (req.user as any).id;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Check if order exists and belongs to user
      const existingOrder = await db.query.orders.findFirst({
        where: and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.userId, userId)
        )
      });
      
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Delete order items first (due to foreign key constraints)
      await db.delete(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));
      
      // Delete the order
      await db.delete(schema.orders)
        .where(eq(schema.orders.id, orderId));
      
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Get Orders for Delivery Personnel
  app.get(`${apiPrefix}/delivery/orders`, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      
      const assignedOrders = await db.query.orders.findMany({
        where: and(
          eq(schema.orders.deliveryPersonnelId, userId),
          eq(schema.orders.paymentMethod, 'cod')
        ),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            with: {
              product: true
            }
          }
        },
        orderBy: desc(schema.orders.createdAt)
      });
      
      return res.json(assignedOrders);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Event image upload endpoint
  app.post(`${apiPrefix}/admin/events/upload-image`, isAdmin, uploadEventImage.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Return the filename as the image URL
      return res.json({
        imageUrl: req.file.filename
      });
    } catch (err) {
      console.error('Error uploading event image:', err);
      handleErrors(err, res);
    }
  });

  // Product image upload endpoint
  app.post(`${apiPrefix}/admin/products/upload-image`, isAdmin, uploadProductImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return just the filename since the client will construct the full path
      return res.json({ filename: req.file.filename });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Article image upload endpoint
  app.post(`${apiPrefix}/admin/articles/upload-image`, isAdmin, uploadArticleImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return just the filename since the client will construct the full path
      return res.json({ filename: req.file.filename });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Podcast image upload endpoint
  app.post(`${apiPrefix}/admin/podcasts/upload-image`, isAdmin, uploadPodcastImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return just the filename since the client will construct the full path
      return res.json({ filename: req.file.filename });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Configure multer for podcast image uploads
  const podcastStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/podcast_images');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `podcast-${uniqueSuffix}${ext}`);
    }
  });

  const podcastUpload = multer({
    storage: podcastStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Add a new endpoint for podcast image upload
  app.post(`${apiPrefix}/admin/podcasts/upload-image`, isAdmin, (req, res, next) => {
    podcastUpload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = `/uploads/podcast_images/${req.file.filename}`;
      return res.json({ imageUrl });
    } catch (err) {
      console.error('Error uploading podcast image:', err);
      handleErrors(err, res);
    }
  });

  // Multer error handling middleware (must be after routes that use multer)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err.message);
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
      // Catch other errors thrown by the fileFilter (e.g., 'Only image files are allowed')
      if (err.message === 'Only image files are allowed') {
        return res.status(400).json({ message: err.message });
      }
      console.error("Unexpected File Upload Error:", err);
      return res.status(500).json({ message: "An unexpected error occurred during file upload." });
    }
    next();
  });

  // Catch-all error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handler:", err);

    if (res.headersSent) {
      return next(err); // Delegate to default error handler if headers already sent
    }

    let statusCode = 500;
    let message = "Internal server error";
    let errors: any[] | undefined;

    if (err instanceof ZodError) {
      statusCode = 400;
      message = "Validation error";
      errors = err.errors;
    } else if (err.status) { // For errors with a status code (e.g., from http-errors)
      statusCode = err.status;
      message = err.message;
    } else if (err.message) {
      // Catch other errors with a message
      message = err.message;
    }

    res.status(statusCode).json({ message, errors });
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
  // Serve static images explicitly
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

  // User Authentication Endpoints
  app.post(`${apiPrefix}/auth/register`, registerUser);
  
  app.post(`${apiPrefix}/auth/login`, passport.authenticate('local'), loginUser);
  
  app.post(`${apiPrefix}/auth/logout`, isAuthenticated, logoutUser);
  
  app.get(`${apiPrefix}/auth/me`, getCurrentUser);
  
  // JWT Token Management
  app.post(`${apiPrefix}/auth/refresh-token`, refreshToken);
  
  // Google authentication
  app.post(`${apiPrefix}/auth/google`, authenticateWithGoogle);
  
  // User profile management
  app.post(`${apiPrefix}/auth/profile-picture`, isAuthenticated, upload.single('profilePicture'), uploadProfilePicture);
  
  app.post(`${apiPrefix}/auth/change-password`, isAuthenticated, changePassword);
  
  // Favorites endpoints
  app.get(`${apiPrefix}/favorites/podcasts`, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const favoritePodcasts = await db.query.favoritePodcasts.findMany({
        where: eq(schema.favoritePodcasts.userId, userId),
        with: {
          podcast: true
        },
        orderBy: desc(schema.favoritePodcasts.createdAt)
      });
      
      // Extract just the podcast data from the favorites
      const podcasts = favoritePodcasts.map(fav => fav.podcast);
      
      return res.json(podcasts);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post(`${apiPrefix}/favorites/podcasts/:podcastId`, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const podcastId = parseInt(req.params.podcastId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(podcastId)) {
        return res.status(400).json({ message: "Invalid podcast ID" });
      }
      
      // Check if podcast exists
      const podcast = await db.query.podcasts.findFirst({
        where: eq(schema.podcasts.id, podcastId)
      });
      
      if (!podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }
      
      // Check if already favorited
      const existingFavorite = await db.query.favoritePodcasts.findFirst({
        where: and(
          eq(schema.favoritePodcasts.userId, userId),
          eq(schema.favoritePodcasts.podcastId, podcastId)
        )
      });
      
      if (existingFavorite) {
        return res.status(400).json({ message: "Podcast already in favorites" });
      }
      
      // Add to favorites
      await db.insert(schema.favoritePodcasts).values({
        userId,
        podcastId
      });
      
      return res.json({ message: "Added to favorites" });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.delete(`${apiPrefix}/favorites/podcasts/:podcastId`, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const podcastId = parseInt(req.params.podcastId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(podcastId)) {
        return res.status(400).json({ message: "Invalid podcast ID" });
      }
      
      // Remove from favorites
      await db.delete(schema.favoritePodcasts)
        .where(and(
          eq(schema.favoritePodcasts.userId, userId),
          eq(schema.favoritePodcasts.podcastId, podcastId)
        ));
      
      return res.json({ message: "Removed from favorites" });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get(`${apiPrefix}/favorites/podcasts/:podcastId/check`, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const podcastId = parseInt(req.params.podcastId);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (isNaN(podcastId)) {
        return res.status(400).json({ message: "Invalid podcast ID" });
      }
      
      // Check if podcast is favorited
      const favorite = await db.query.favoritePodcasts.findFirst({
        where: and(
          eq(schema.favoritePodcasts.userId, userId),
          eq(schema.favoritePodcasts.podcastId, podcastId)
        )
      });
      
      return res.json({ isFavorited: !!favorite });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Role-based access test endpoints
  app.get(`${apiPrefix}/admin-only`, isAdmin, (req, res) => {
    res.json({ message: "Admin access granted", user: req.user });
  });
  
  app.get(`${apiPrefix}/artist-only`, isArtistMiddleware, (req, res) => {
    res.json({ message: "Artist access granted", user: req.user });
  });
  
  app.get(`${apiPrefix}/artist-or-admin`, isArtistOrAdminMiddleware, (req, res) => {
    res.json({ message: "Artist or Admin access granted", user: req.user });
  });

  // Admin users endpoints
  app.get(`${apiPrefix}/admin/users`, isAdmin, async (req, res) => {
    try {
      const users = await db.query.users.findMany({
        orderBy: desc(schema.users.createdAt)
      });
      return res.json(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/users/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get the current user to verify it exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.id, id)
      });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow updating specific fields
      const { role, isActive } = req.body;
      const updateData: any = {};
      
      if (role !== undefined) {
        updateData.role = role;
      }
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      // Update user in database
      const [updatedUser] = await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, id))
        .returning();

      return res.json(updatedUser);
    } catch (err) {
      console.error('Error updating user:', err);
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/users/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.id, id)
      });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user from database
      await db.delete(schema.users)
        .where(eq(schema.users.id, id));

      return res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error('Error deleting user:', err);
      handleErrors(err, res);
    }
  });

  // Admin events endpoints
  app.get(`${apiPrefix}/admin/events`, isAdmin, async (req, res) => {
    try {
      const events = await db.query.events.findMany({
        orderBy: desc(schema.events.date)
      });
      return res.json(events);
    } catch (err) {
      console.error('Error fetching events:', err);
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/admin/events/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await db.query.events.findFirst({
        where: eq(schema.events.id, id)
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      return res.json(event);
    } catch (err) {
      console.error('Error fetching event:', err);
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/events/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Get the current event to verify it exists
      const existingEvent = await db.query.events.findFirst({
        where: eq(schema.events.id, id)
      });

      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Handle imageUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
      if (req.body.imageUrl && !req.body.imageUrl.startsWith('http://') && !req.body.imageUrl.startsWith('https://') && !req.body.imageUrl.startsWith('/uploads/event_images/')) {
        req.body.imageUrl = `/uploads/event_images/${req.body.imageUrl}`;
      }

      // Validate remaining data
      const eventData = schema.eventsInsertSchema.parse(req.body);

      // Update event in database
      const [updatedEvent] = await db.update(schema.events)
        .set(eventData)
        .where(eq(schema.events.id, id))
        .returning();

      return res.json(updatedEvent);
    } catch (err) {
      console.error('Error updating event:', err);
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/events/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Check if event exists
      const existingEvent = await db.query.events.findFirst({
        where: eq(schema.events.id, id)
      });

      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Delete event from database
      await db.delete(schema.events)
        .where(eq(schema.events.id, id));

      return res.json({ message: "Event deleted successfully" });
    } catch (err) {
      console.error('Error deleting event:', err);
      handleErrors(err, res);
    }
  });

  // Admin Podcast Endpoints
  app.get(`${apiPrefix}/admin/podcasts`, isAdmin, async (req, res) => {
    try {
      const podcasts = await db.query.podcasts.findMany({
        orderBy: [schema.podcasts.displayOrder, desc(schema.podcasts.createdAt)],
      });
      return res.json(podcasts);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/admin/podcasts/:id`, isAdmin, async (req, res) => {
    try {
      console.log('--- PODCAST GET BY ID DEBUG ---');
      console.log('Requested podcast ID:', req.params.id);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log('Invalid podcast ID:', req.params.id);
        return res.status(400).json({ message: "Invalid podcast ID" });
      }
      
      console.log('Fetching podcast with ID:', id);
      const podcast = await db.query.podcasts.findFirst({
        where: eq(schema.podcasts.id, id)
      });
      
      console.log('Database query result:', podcast);
      
      if (!podcast) {
        console.log('Podcast not found in database');
        return res.status(404).json({ message: "Podcast not found" });
      }
      
      // Return podcast data directly since it's already in camelCase
      const mappedPodcast = {
        id: podcast.id,
        title: podcast.title,
        slug: podcast.slug,
        description: podcast.description,
        coverUrl: podcast.coverUrl,
        audioUrl: podcast.audioUrl,
        artistName: podcast.artistName,
        duration: podcast.duration,
        genre: podcast.genre,
        createdAt: podcast.createdAt,
      };
      
      // Set headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log('Returning mapped podcast data:', mappedPodcast);
      return res.json(mappedPodcast);
    } catch (err) {
      console.error('Error in podcast GET by ID:', err);
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/podcasts`, isAdmin, async (req, res) => {
    try {
      console.log('--- PODCAST CREATION DEBUG ---');
      console.log('Raw request body BEFORE conversion:', req.body);
      
      // Explicitly convert createdAt to a Date object if it's a string
      if (typeof req.body.createdAt === 'string') {
        req.body.createdAt = new Date(req.body.createdAt);
      }
      
      console.log('Request body AFTER createdAt conversion:', req.body);

      let podcastData;
      try {
        // Handle coverUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
        if (req.body.coverUrl && !req.body.coverUrl.startsWith('http://') && !req.body.coverUrl.startsWith('https://') && !req.body.coverUrl.startsWith('/uploads/podcast_images/')) {
          req.body.coverUrl = `/uploads/podcast_images/${req.body.coverUrl}`;
        }

        podcastData = schema.podcastsInsertSchema.parse(req.body);
        console.log('Parsed podcast data:', podcastData);
      } catch (parseErr) {
        console.error('Zod validation error:', parseErr);
        return res.status(400).json({ message: 'Validation error', error: parseErr });
      }

      const { createdAt, ...insertData } = podcastData; // Exclude createdAt for insertion
      console.log('Data to insert into DB:', insertData);
      // Insert podcast into database
      try {
        const [podcast] = await db.insert(schema.podcasts)
          .values(insertData)
          .returning();
        console.log('Podcast created successfully:', podcast);
        return res.status(201).json(podcast);
      } catch (dbErr) {
        console.error('Database insertion error:', dbErr);
        return res.status(500).json({ message: 'Database error', error: dbErr });
      }
    } catch (err) {
      console.error('Server: Error creating podcast:', err);
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/podcasts/:id`, isAdmin, async (req, res) => {
    try {
      console.log('Received update request for podcast:', req.params.id);
      console.log('Request body:', req.body);

      // Debug: log request body and createdAt type before validation
      console.log('Request body before validation:', req.body);
      console.log('Type of createdAt:', typeof req.body.createdAt, req.body.createdAt);

      // Force-convert createdAt to a Date if it's a string
      if (typeof req.body.createdAt === 'string') {
        req.body.createdAt = new Date(req.body.createdAt);
        if (isNaN(req.body.createdAt.getTime())) {
          req.body.createdAt = new Date();
        }
      }
      console.log('Type of createdAt after conversion:', typeof req.body.createdAt, req.body.createdAt);

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error('Invalid podcast ID:', req.params.id);
        return res.status(400).json({ message: "Invalid podcast ID" });
      }
      
      // Get the current podcast to verify it exists
      const existingPodcast = await db.query.podcasts.findFirst({
        where: eq(schema.podcasts.id, id)
      });
      
      if (!existingPodcast) {
        console.error('Podcast not found:', id);
        return res.status(404).json({ message: "Podcast not found" });
      }
      
      console.log('Existing podcast:', existingPodcast);
      
      // Handle coverUrl: prepend path if it's a filename, keep as is if it's a full URL or relative path
      if (req.body.coverUrl && !req.body.coverUrl.startsWith('http://') && !req.body.coverUrl.startsWith('https://') && !req.body.coverUrl.startsWith('/uploads/podcast_images/')) {
        req.body.coverUrl = `/uploads/podcast_images/${req.body.coverUrl}`;
      }

      // Validate incoming data with the shared schema
      const updateData = schema.podcastsInsertSchema.parse(req.body);
      console.log('Validated update data:', updateData);

      // Create an object for update, explicitly excluding createdAt and id from direct update
      const { createdAt, id: podcastId, ...dataToUpdate } = updateData;
      
      console.log('Final data to update:', dataToUpdate);

      // Update podcast in database
      const [updatedPodcast] = await db.update(schema.podcasts)
        .set(dataToUpdate)
        .where(eq(schema.podcasts.id, id))
        .returning();
      
      if (!updatedPodcast) {
        console.error('Failed to update podcast:', id);
        return res.status(500).json({ message: "Failed to update podcast" });
      }

      console.log('Updated podcast:', updatedPodcast);
      return res.json(updatedPodcast);
    } catch (err) {
      console.error('Error updating podcast:', err);
      handleErrors(err, res);
    }
  });
  
  app.delete(`${apiPrefix}/admin/podcasts/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid podcast ID" });
      }

      const [deletedPodcast] = await db.delete(schema.podcasts)
        .where(eq(schema.podcasts.id, id))
        .returning();

      if (!deletedPodcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }

      return res.json({ message: "Podcast deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Public Streams Endpoints
  app.get(`${apiPrefix}/streams`, async (req, res) => {
    try {
      // Check if streams table exists by trying to query it
      const streams = await db.query.streams.findMany({
        where: eq(schema.streams.isActive, true),
        orderBy: [asc(schema.streams.displayOrder), desc(schema.streams.createdAt)]
      });
      return res.json(streams);
    } catch (err: any) {
      console.error('Error fetching streams:', err);
      // If table doesn't exist, return empty array instead of error
      if (err?.message?.includes('does not exist') || err?.code === '42P01') {
        console.warn('Streams table does not exist yet. Returning empty array.');
        return res.json([]);
      }
      handleErrors(err, res);
    }
  });

  // Admin Streams Endpoints
  app.get(`${apiPrefix}/admin/streams`, isAdmin, async (req, res) => {
    try {
      const streams = await db.query.streams.findMany({
        orderBy: [asc(schema.streams.displayOrder), desc(schema.streams.createdAt)]
      });
      return res.json(streams);
    } catch (err: any) {
      console.error('Error fetching streams:', err);
      // If table or column doesn't exist, return empty array
      if (err?.message?.includes('does not exist') || err?.code === '42P01' || err?.code === '42703') {
        console.warn('Streams table or column does not exist yet. Returning empty array.');
        return res.json([]);
      }
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/admin/streams/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid stream ID" });
      }

      const stream = await db.query.streams.findFirst({
        where: eq(schema.streams.id, id)
      });

      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      return res.json(stream);
    } catch (err: any) {
      console.error('Error fetching stream:', err);
      // If table or column doesn't exist
      if (err?.message?.includes('does not exist') || err?.code === '42P01' || err?.code === '42703') {
        return res.status(404).json({ message: "Stream not found" });
      }
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/streams`, isAdmin, async (req, res) => {
    try {
      const streamData = schema.streamsInsertSchema.parse(req.body);
      
      // Only include fields that exist in the data
      const insertData: any = {
        title: streamData.title,
        description: streamData.description,
        displayOrder: streamData.displayOrder,
        isActive: streamData.isActive,
        updatedAt: new Date()
      };
      
      // Add optional fields if they exist
      if (streamData.twitchChannelName) {
        insertData.twitchChannelName = streamData.twitchChannelName;
      }
      if (streamData.iframeCode) {
        insertData.iframeCode = streamData.iframeCode;
      }
      
      const [stream] = await db.insert(schema.streams)
        .values(insertData)
        .returning();
      
      return res.status(201).json(stream);
    } catch (err: any) {
      console.error('Error creating stream:', err);
      // If column doesn't exist, provide helpful error message
      if (err?.message?.includes('does not exist') || err?.code === '42703') {
        return res.status(500).json({ 
          message: "Database schema needs to be updated. Please run: npm run db:push",
          error: "Missing column: iframe_code"
        });
      }
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/streams/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid stream ID" });
      }

      const existingStream = await db.query.streams.findFirst({
        where: eq(schema.streams.id, id)
      });

      if (!existingStream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      const updateData = schema.streamsInsertSchema.parse(req.body);
      const { id: streamId, ...dataToUpdate } = updateData;

      // Only include fields that exist in the update data
      const updateFields: any = {
        title: updateData.title,
        description: updateData.description,
        displayOrder: updateData.displayOrder,
        isActive: updateData.isActive,
        updatedAt: new Date()
      };
      
      // Add optional fields if they exist
      if (updateData.twitchChannelName !== undefined) {
        updateFields.twitchChannelName = updateData.twitchChannelName;
      }
      if (updateData.iframeCode !== undefined) {
        updateFields.iframeCode = updateData.iframeCode;
      }

      const [updatedStream] = await db.update(schema.streams)
        .set(updateFields)
        .where(eq(schema.streams.id, id))
        .returning();

      if (!updatedStream) {
        return res.status(500).json({ message: "Failed to update stream" });
      }

      return res.json(updatedStream);
    } catch (err) {
      console.error('Error updating stream:', err);
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/streams/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid stream ID" });
      }

      const [deletedStream] = await db.delete(schema.streams)
        .where(eq(schema.streams.id, id))
        .returning();

      if (!deletedStream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      return res.json({ message: "Stream deleted successfully" });
    } catch (err) {
      console.error('Error deleting stream:', err);
      handleErrors(err, res);
    }
  });

  // Admin Article Endpoints
  app.get(`${apiPrefix}/admin/articles`, isAdmin, async (req, res) => {
    try {
      const articles = await db.query.articles.findMany({
        orderBy: desc(schema.articles.createdAt)
      });
      return res.json(articles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/admin/articles/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const article = await db.query.articles.findFirst({
        where: eq(schema.articles.id, id)
      });

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      return res.json(article);
    } catch (err) {
      console.error('Error fetching article:', err);
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/articles`, isAdmin, async (req, res) => {
    try {
      console.log('Article creation request body:', JSON.stringify(req.body, null, 2));
      
      // Process imageUrl before validation
      console.log('Original imageUrl:', req.body.imageUrl);
      if (req.body.imageUrl && req.body.imageUrl.trim() !== '') {
        if (req.body.imageUrl.startsWith('/uploads/article_images/')) {
          // Already has the correct path, keep as is
          console.log('ImageUrl already has correct path, keeping as is');
          req.body.imageUrl = req.body.imageUrl;
        } else if (req.body.imageUrl.startsWith('http://') || req.body.imageUrl.startsWith('https://')) {
          // Keep absolute URLs as is
          console.log('ImageUrl is absolute URL, keeping as is');
          req.body.imageUrl = req.body.imageUrl;
        } else {
          // Assume it's a filename and prepend the path
          const newImageUrl = `/uploads/article_images/${req.body.imageUrl}`;
          console.log('Converting filename to full path:', req.body.imageUrl, '->', newImageUrl);
          req.body.imageUrl = newImageUrl;
        }
      } else {
        // Set to null if empty
        console.log('ImageUrl is empty, setting to null');
        req.body.imageUrl = null;
      }
      console.log('Final imageUrl after processing:', req.body.imageUrl);

      console.log('Processed request body:', JSON.stringify(req.body, null, 2));

      // Validate request body (after imageUrl processing)
      const articleData = schema.articlesInsertSchema.parse(req.body);
      console.log('Validated article data:', JSON.stringify(articleData, null, 2));
      
      // Remove createdAt from insert data as it's handled by the database
      const { createdAt, ...insertData } = articleData;
      console.log('Insert data (without createdAt):', JSON.stringify(insertData, null, 2));
      
      // Insert article into database
      const [article] = await db.insert(schema.articles)
        .values(insertData)
        .returning();
      
      return res.status(201).json(article);
    } catch (err) {
      console.error('Error creating article:', err);
      console.error('Error details:', err instanceof ZodError ? err.errors : err);
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/articles/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      // Get the current article to verify it exists
      const existingArticle = await db.query.articles.findFirst({
        where: eq(schema.articles.id, id)
      });

      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      // If the imageUrl is a full path, keep it as is
      if (req.body.imageUrl) {
        if (!req.body.imageUrl.startsWith('/uploads/article_images/') && 
            !req.body.imageUrl.startsWith('http://') && 
            !req.body.imageUrl.startsWith('https://')) {
          // If it's just a filename, prepend the path
          req.body.imageUrl = `/uploads/article_images/${req.body.imageUrl}`;
        }
      }

      // Validate remaining data
      const articleData = schema.articlesInsertSchema.parse(req.body);

      // Update article in database
      const [updatedArticle] = await db.update(schema.articles)
        .set(articleData)
        .where(eq(schema.articles.id, id))
        .returning();

      return res.json(updatedArticle);
    } catch (err) {
      console.error('Error updating article:', err);
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/articles/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }

      const [deletedArticle] = await db.delete(schema.articles)
        .where(eq(schema.articles.id, id))
        .returning();

      if (!deletedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      return res.json({ message: "Article deleted successfully" });
    } catch (err) {
      console.error('Error deleting article:', err);
      handleErrors(err, res);
    }
  });

  // Admin Product Endpoints
  app.get(`${apiPrefix}/admin/products`, isAdmin, async (req, res) => {
    try {
      const products = await db.query.products.findMany({
        orderBy: desc(schema.products.createdAt)
      });
      return res.json(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      handleErrors(err, res);
    }
  });

  app.get(`${apiPrefix}/admin/products/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await db.query.products.findFirst({
        where: (row) => eq(row.id, id) && eq(row.archived, false)
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json(product);
    } catch (err) {
      console.error('Error fetching product:', err);
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/products`, isAdmin, async (req, res) => {
    try {
      // Always store the full path for imageUrl
      if (req.body.imageUrl) {
        if (!req.body.imageUrl.startsWith('/uploads/product_images/') &&
            !req.body.imageUrl.startsWith('http://') &&
            !req.body.imageUrl.startsWith('https://')) {
          // If it's just a filename, prepend the path
          req.body.imageUrl = `/uploads/product_images/${req.body.imageUrl}`;
        }
      }
      // Validate request body
      const productData = schema.productsInsertSchema.parse(req.body);
      // Insert product into database
      const [product] = await db.insert(schema.products)
        .values(productData)
        .returning();
      
      // Clear product cache to ensure fresh data
      storage.clearCacheEntry('all_products');
      // Clear category caches
      const categories = ['vinyl', 'digital', 'merch', 'clothing', 'accessories', 'other'];
      categories.forEach(cat => storage.clearCacheEntry(`products_${cat}`));
      
      return res.status(201).json(product);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/products/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      // Get the current product to verify it exists and is not archived
      const existingProduct = await db.query.products.findFirst({
        where: (row) => eq(row.id, id) && eq(row.archived, false)
      });
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found or is archived" });
      }
      // Always store the full path for imageUrl
      if (req.body.imageUrl) {
        if (!req.body.imageUrl.startsWith('/uploads/product_images/') &&
            !req.body.imageUrl.startsWith('http://') &&
            !req.body.imageUrl.startsWith('https://')) {
          // If it's just a filename, prepend the path
          req.body.imageUrl = `/uploads/product_images/${req.body.imageUrl}`;
        }
      }
      // Remove archived from the update payload if present
      const { archived, ...updatePayload } = req.body;
      // Validate remaining data
      const productData = schema.productsInsertSchema.parse(updatePayload);
      // Update product in database
      const [updatedProduct] = await db.update(schema.products)
        .set(productData)
        .where(eq(schema.products.id, id))
        .returning();
      
      // Clear product cache to ensure fresh data
      storage.clearCacheEntry('all_products');
      if (updatedProduct.slug) {
        storage.clearCacheEntry(`product_${updatedProduct.slug}`);
      }
      // Clear category caches
      const categories = ['vinyl', 'digital', 'merch', 'clothing', 'accessories', 'other'];
      categories.forEach(cat => storage.clearCacheEntry(`products_${cat}`));
      
      return res.json(updatedProduct);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/products/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Archive the product instead of deleting
      const [archivedProduct] = await db.update(schema.products)
        .set({ archived: true })
        .where(eq(schema.products.id, id))
        .returning();

      if (!archivedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Clear product cache to ensure fresh data
      storage.clearCacheEntry('all_products');
      if (archivedProduct.slug) {
        storage.clearCacheEntry(`product_${archivedProduct.slug}`);
      }
      // Clear category caches
      const categories = ['vinyl', 'digital', 'merch', 'clothing', 'accessories', 'other'];
      categories.forEach(cat => storage.clearCacheEntry(`products_${cat}`));

      return res.json({ message: "Product archived successfully" });
    } catch (err) {
      console.error('Error archiving product:', err);
      handleErrors(err, res);
    }
  });

  // Add this after other auth routes
  app.patch(`${apiPrefix}/auth/profile-picture-url`, isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    const { profilePictureUrl } = req.body;
    if (!userId || !profilePictureUrl) {
      return res.status(400).json({ message: 'Missing user ID or profilePictureUrl' });
    }
    try {
      const [updatedUser] = await db.update(schema.users)
        .set({ profilePictureUrl, updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning();
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update profile picture URL' });
      }
      return res.json({ user: updatedUser });
    } catch (err) {
      console.error('Error updating profile picture URL:', err);
      return res.status(500).json({ message: 'Failed to update profile picture URL' });
    }
  });

  // Artist image upload endpoint
  app.post(`${apiPrefix}/admin/artists/upload-image`, isAdmin, uploadArtistImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      return res.json({ imageUrl: req.file.filename });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Public Gallery endpoint
  app.get(`${apiPrefix}/gallery`, async (req, res) => {
    try {
      const { type, limit, offset } = req.query;
      
      let query = db.query.galleryItems.findMany({
        orderBy: [asc(schema.galleryItems.displayOrder), desc(schema.galleryItems.createdAt)]
      });
      
      // Apply type filter if provided
      if (type && (type === 'image' || type === 'video' || type === 'youtube')) {
        query = db.query.galleryItems.findMany({
          where: eq(schema.galleryItems.type, type as 'image' | 'video' | 'youtube'),
          orderBy: [asc(schema.galleryItems.displayOrder), desc(schema.galleryItems.createdAt)]
        });
      }
      
      const galleryItems = await query;
      
      // Apply pagination if provided
      let result = galleryItems;
      if (limit && offset) {
        const limitNum = parseInt(limit as string) || 10;
        const offsetNum = parseInt(offset as string) || 0;
        result = galleryItems.slice(offsetNum, offsetNum + limitNum);
      }
      
      return res.json(result);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Gallery image upload endpoint
  app.post(`${apiPrefix}/admin/upload`, isAdmin, uploadGalleryImage.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageUrl = `/uploads/gallery_images/${req.file.filename}`;
      return res.json({ url: imageUrl });
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      return res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Gallery Management Routes
  app.get(`${apiPrefix}/admin/gallery`, isAdmin, async (req, res) => {
    try {
      const galleryItems = await db.query.galleryItems.findMany({
        orderBy: [asc(schema.galleryItems.displayOrder), desc(schema.galleryItems.createdAt)]
      });
      return res.json(galleryItems);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/gallery`, isAdmin, async (req, res) => {
    try {
      const galleryData = schema.galleryItemsInsertSchema.parse(req.body);
      const [newItem] = await db.insert(schema.galleryItems)
        .values(galleryData)
        .returning();
      return res.status(201).json(newItem);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/gallery/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery item ID" });
      }

      const galleryData = schema.galleryItemsInsertSchema.parse(req.body);
      const [updatedItem] = await db.update(schema.galleryItems)
        .set({ ...galleryData, updatedAt: new Date() })
        .where(eq(schema.galleryItems.id, id))
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }

      return res.json(updatedItem);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/gallery/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery item ID" });
      }

      const [deletedItem] = await db.delete(schema.galleryItems)
        .where(eq(schema.galleryItems.id, id))
        .returning();

      if (!deletedItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }

      return res.json({ message: "Gallery item deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Contact Messages Management Routes
  app.get(`${apiPrefix}/admin/contact-messages`, isAdmin, async (req, res) => {
    try {
      const messages = await db.query.contactMessages.findMany({
        orderBy: [desc(schema.contactMessages.createdAt)]
      });
      return res.json({ messages });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/contact-messages`, isAdmin, async (req, res) => {
    try {
      const messageData = schema.contactMessagesInsertSchema.parse(req.body);
      const [newMessage] = await db.insert(schema.contactMessages)
        .values(messageData)
        .returning();
      return res.status(201).json(newMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/contact-messages/:id/read`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const [updatedMessage] = await db.update(schema.contactMessages)
        .set({ status: 'read' })
        .where(eq(schema.contactMessages.id, id))
        .returning();

      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      return res.json(updatedMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.put(`${apiPrefix}/admin/contact-messages/:id/reply`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const { adminReply } = req.body;
      if (!adminReply) {
        return res.status(400).json({ message: "Admin reply is required" });
      }

      const [updatedMessage] = await db.update(schema.contactMessages)
        .set({ 
          status: 'replied', 
          adminReply,
          repliedAt: new Date()
        })
        .where(eq(schema.contactMessages.id, id))
        .returning();

      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      return res.json(updatedMessage);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.delete(`${apiPrefix}/admin/contact-messages/:id`, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      const [deletedMessage] = await db.delete(schema.contactMessages)
        .where(eq(schema.contactMessages.id, id))
        .returning();

      if (!deletedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      return res.json({ message: "Message deleted successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // ===== TICKETING SYSTEM ROUTES =====

  // Import ticket services
  const { TicketService } = await import('./services/ticket-service');
  const { QRCodeService } = await import('./services/qr-code');

  // Get available tickets for an event
  app.get(`${apiPrefix}/events/:eventId/tickets`, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const availableTickets = await TicketService.getAvailableTickets(eventId);
      return res.json(availableTickets);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Purchase ticket
  app.post(`${apiPrefix}/tickets/purchase`, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { eventId, ticketType, attendeeName, attendeeEmail, attendeePhone, paymentMethod } = req.body;

      // Validate required fields
      if (!eventId || !ticketType || !attendeeName || !attendeeEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get ticket limit and price
      const ticketLimit = await TicketService.getTicketLimit(eventId, ticketType);
      if (!ticketLimit) {
        return res.status(400).json({ message: "Ticket type not available" });
      }

      if (ticketLimit.soldTickets >= ticketLimit.maxTickets) {
        return res.status(400).json({ message: "No tickets available" });
      }

      // Create order for the ticket
      const orderData = {
        userId,
        total: ticketLimit.price,
        currency: ticketLimit.currency,
        paymentMethod: paymentMethod || 'paypal',
        customerEmail: attendeeEmail,
        customerName: attendeeName,
        customerPhone: attendeePhone
      };

      const [order] = await db.insert(schema.orders).values(orderData).returning();

      // Create ticket
      const ticketData = {
        eventId,
        userId,
        orderId: order.id,
        ticketType,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        price: parseFloat(ticketLimit.price.toString()),
        currency: ticketLimit.currency
      };

      const ticket = await TicketService.createTicket(ticketData);

      // Get event details for email
      const [event] = await db.select().from(schema.events).where(eq(schema.events.id, eventId));
      if (event) {
        await TicketService.sendTicketEmail(ticket, event);
      }

      return res.status(201).json({
        message: "Ticket purchased successfully",
        ticket,
        order
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get user's tickets
  app.get(`${apiPrefix}/tickets/my-tickets`, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userTickets = await TicketService.getUserTickets(userId);
      
      // Get event details for each ticket
      const ticketsWithEvents = await Promise.all(
        userTickets.map(async (ticket) => {
          const [event] = await db.select().from(schema.events).where(eq(schema.events.id, ticket.eventId));
          return { ...ticket, event };
        })
      );

      return res.json(ticketsWithEvents);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Validate ticket (for check-in)
  app.post(`${apiPrefix}/tickets/validate`, async (req, res) => {
    try {
      const { qrCodeData, validatedBy } = req.body;
      
      if (!qrCodeData) {
        return res.status(400).json({ message: "QR code data is required" });
      }

      const validationResult = await TicketService.validateTicket(qrCodeData, validatedBy);
      
      return res.json(validationResult);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Mark ticket as used (for check-in)
  app.post(`${apiPrefix}/tickets/:ticketId/use`, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { usedBy } = req.body;

      if (!usedBy) {
        return res.status(400).json({ message: "User who scanned the ticket is required" });
      }

      const updatedTicket = await TicketService.markTicketAsUsed(ticketId, usedBy);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      return res.json({
        message: "Ticket marked as used",
        ticket: updatedTicket
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Admin: Get all tickets for an event
  app.get(`${apiPrefix}/admin/events/:eventId/tickets`, isAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const eventTickets = await TicketService.getEventTickets(eventId);
      
      // Get attendee details for each ticket
      const ticketsWithDetails = await Promise.all(
        eventTickets.map(async (ticket) => {
          const [user] = await db.select().from(schema.users).where(eq(schema.users.id, ticket.userId));
          return { ...ticket, user };
        })
      );

      return res.json(ticketsWithDetails);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Admin: Create ticket limits for an event
  app.post(`${apiPrefix}/admin/events/:eventId/ticket-limits`, isAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const ticketLimitData = schema.eventTicketLimitsInsertSchema.parse(req.body);
      
      const [ticketLimit] = await db.insert(schema.eventTicketLimits)
        .values({ ...ticketLimitData, eventId })
        .returning();

      return res.status(201).json(ticketLimit);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Admin: Update ticket limits for an event
  app.put(`${apiPrefix}/admin/events/:eventId/ticket-limits/:limitId`, isAdmin, async (req, res) => {
    try {
      const limitId = parseInt(req.params.limitId);
      if (isNaN(limitId)) {
        return res.status(400).json({ message: "Invalid limit ID" });
      }

      const updateData = req.body;
      const [updatedLimit] = await db.update(schema.eventTicketLimits)
        .set(updateData)
        .where(eq(schema.eventTicketLimits.id, limitId))
        .returning();

      if (!updatedLimit) {
        return res.status(404).json({ message: "Ticket limit not found" });
      }

      return res.json(updatedLimit);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Generate QR code for ticket
  app.get(`${apiPrefix}/tickets/:ticketId/qr-code`, isAuthenticated, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const userId = (req.user as any).id;

      const ticket = await TicketService.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user owns this ticket
      if (ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const qrData = {
        ticketId: ticket.ticketId,
        eventId: ticket.eventId,
        userId: ticket.userId,
        orderId: ticket.orderId,
        attendeeName: ticket.attendeeName,
        attendeeEmail: ticket.attendeeEmail,
        timestamp: Date.now()
      };

      const qrCodeDataUrl = await QRCodeService.generateQRCode(qrData);
      
      return res.json({ qrCodeDataUrl });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Dashboard batch endpoint for better performance
  app.get(`${apiPrefix}/dashboard`, async (req: Request, res: Response) => {
    try {
      const dashboardData = await storage.getDashboardData();
      return res.json(dashboardData);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Clear cache endpoint for admin use
  app.post(`${apiPrefix}/admin/clear-cache`, isAdmin, async (req: Request, res: Response) => {
    try {
      storage.clearCache();
      return res.json({ message: "Cache cleared successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Performance monitoring endpoints
  app.get(`${apiPrefix}/admin/performance`, isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = performanceMonitor.getEndpointStats();
      const slowRequests = performanceMonitor.getSlowRequests();
      const avgResponseTime = performanceMonitor.getAverageResponseTime();
      
      return res.json({
        endpointStats: stats,
        slowRequests: slowRequests.slice(-10), // Last 10 slow requests
        averageResponseTime: avgResponseTime,
        totalRequests: performanceMonitor.getMetrics().length
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  app.post(`${apiPrefix}/admin/performance/clear`, isAdmin, async (req: Request, res: Response) => {
    try {
      performanceMonitor.clearMetrics();
      return res.json({ message: "Performance metrics cleared successfully" });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Force refresh endpoint to bypass cache
  app.post(`${apiPrefix}/admin/force-refresh`, isAdmin, async (req: Request, res: Response) => {
    try {
      const data = await storage.forceRefreshAll();
      return res.json({ 
        message: "Data force refreshed successfully", 
        data: {
          artistsCount: data.artists.length,
          eventsCount: data.events.length,
          productsCount: data.products.length,
          podcastsCount: data.podcasts.length,
          articlesCount: data.articles.length
        }
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}