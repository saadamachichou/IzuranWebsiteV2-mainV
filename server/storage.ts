import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, desc, like, inArray } from "drizzle-orm";

// Simple in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCacheItem(key?: string): void {
  if (key) {
    console.log(`Clearing cache for key: ${key}`);
    cache.delete(key);
  } else {
    console.log('Clearing all cache');
    cache.clear();
  }
}

export const storage = {
  // Cache management
  clearCache: clearCacheItem,
  
  // Artists
  async getAllArtists() {
    const cacheKey = 'all_artists';
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      console.log('Returning cached artists data');
      console.log('Cached artists count:', cached.length);
      console.log('Cached artist names:', cached.map((a: any) => a.name));
      return cached;
    }

    console.log('Fetching fresh artists data from database');
    const artists = await db.query.artists.findMany({
      orderBy: [schema.artists.displayOrder, desc(schema.artists.createdAt)]
    });
    
    console.log('Fresh artists data from database:');
    console.log('Artists count:', artists.length);
    console.log('Artist names:', artists.map((a: any) => a.name));
    
    setCached(cacheKey, artists);
    return artists;
  },

  async getArtistBySlug(slug: string) {
    const cacheKey = `artist_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`Returning cached artist data for slug: ${slug}`);
      return cached;
    }

    console.log(`Fetching fresh artist data for slug: ${slug}`);
    const artist = await db.query.artists.findFirst({
      where: eq(schema.artists.slug, slug)
    });
    
    if (artist) setCached(cacheKey, artist);
    return artist;
  },

  async searchArtists(query: string) {
    return await db.query.artists.findMany({
      where: like(schema.artists.name, `%${query}%`)
    });
  },

  // Clear artist-related cache when artists are modified
  clearArtistCache() {
    console.log('Clearing artist cache...');
    clearCacheItem('all_artists');
    // Clear individual artist caches by pattern
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.startsWith('artist_')) {
        console.log(`Clearing artist cache key: ${key}`);
        cache.delete(key);
      }
    }
    console.log('Artist cache cleared');
  },

  // Force bypass cache for testing
  async getAllArtistsFresh() {
    console.log('Bypassing cache - fetching fresh artists data from database');
    const artists = await db.query.artists.findMany({
      orderBy: [schema.artists.displayOrder, desc(schema.artists.createdAt)]
    });
    
    console.log('Fresh artists data from database (bypassing cache):');
    console.log('Artists count:', artists.length);
    console.log('Artist names:', artists.map((a: any) => a.name));
    
    return artists;
  },

  // Events
  async getAllEvents() {
    const cacheKey = 'all_events';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const events = await db.query.events.findMany({
      orderBy: desc(schema.events.date)
    });
    
    setCached(cacheKey, events);
    return events;
  },

  async getUpcomingEvents() {
    const cacheKey = 'upcoming_events';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const events = await db.query.events.findMany({
      where: eq(schema.events.status, "upcoming"),
      orderBy: desc(schema.events.date)
    });
    
    setCached(cacheKey, events);
    return events;
  },

  async getFeaturedEvents() {
    const cacheKey = 'featured_events';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const events = await db.query.events.findMany({
      where: eq(schema.events.featured, true),
      orderBy: desc(schema.events.date)
    });
    
    setCached(cacheKey, events);
    return events;
  },

  async getPastEvents() {
    const cacheKey = 'past_events';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const events = await db.query.events.findMany({
      where: eq(schema.events.status, "completed"),
      orderBy: desc(schema.events.date)
    });
    
    setCached(cacheKey, events);
    return events;
  },

  async updateEventStatuses() {
    try {
      // Get all events with status 'upcoming'
      const upcomingEvents = await db.query.events.findMany({
        where: eq(schema.events.status, "upcoming")
      });

      const now = new Date();
      let updatedCount = 0;

      // Check each event and update status if the event date has passed
      for (const event of upcomingEvents) {
        const eventDate = new Date(event.date);
        // If event date is in the past, mark as completed
        if (eventDate < now) {
          await db.update(schema.events)
            .set({ status: 'completed' })
            .where(eq(schema.events.id, event.id));
          updatedCount++;
        }
      }

      // Clear cache for events since we updated statuses
      if (updatedCount > 0) {
        clearCacheItem('upcoming_events');
        clearCacheItem('past_events');
        clearCacheItem('featured_events');
      }

      return { updatedCount };
    } catch (error) {
      console.error('Error updating event statuses:', error);
      throw error;
    }
  },

  async getEventBySlug(slug: string) {
    const cacheKey = `event_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const event = await db.query.events.findFirst({
      where: eq(schema.events.slug, slug)
    });
    
    if (event) setCached(cacheKey, event);
    return event;
  },

  // Products
  async getAllProducts() {
    const cacheKey = 'all_products';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const products = await db.query.products.findMany({
      orderBy: desc(schema.products.createdAt)
    });
    
    setCached(cacheKey, products);
    return products;
  },

  async getProductsByCategory(category: typeof schema.productCategoryEnum.enumValues[number]) {
    const cacheKey = `products_${category}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const products = await db.query.products.findMany({
      where: eq(schema.products.category, category),
      orderBy: desc(schema.products.createdAt)
    });
    
    setCached(cacheKey, products);
    return products;
  },

  async getProductBySlug(slug: string) {
    const cacheKey = `product_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const product = await db.query.products.findFirst({
      where: eq(schema.products.slug, slug)
    });
    
    if (product) setCached(cacheKey, product);
    return product;
  },

  // Podcasts
  async getAllPodcasts() {
    const cacheKey = 'all_podcasts';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const podcasts = await db.query.podcasts.findMany({
      orderBy: [schema.podcasts.displayOrder, desc(schema.podcasts.createdAt)]
    });
    
    setCached(cacheKey, podcasts);
    return podcasts;
  },

  async getPodcastBySlug(slug: string) {
    const cacheKey = `podcast_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const podcast = await db.query.podcasts.findFirst({
      where: eq(schema.podcasts.slug, slug)
    });
    
    if (podcast) setCached(cacheKey, podcast);
    return podcast;
  },

  // Articles
  async getAllArticles() {
    const cacheKey = 'all_articles';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const articles = await db.query.articles.findMany({
      orderBy: desc(schema.articles.publishDate)
    });
    
    setCached(cacheKey, articles);
    return articles;
  },

  async getArticleBySlug(slug: string) {
    const cacheKey = `article_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const article = await db.query.articles.findFirst({
      where: eq(schema.articles.slug, slug)
    });
    
    if (article) setCached(cacheKey, article);
    return article;
  },

  async getArticlesByCategory(category: string) {
    const cacheKey = `articles_${category}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const articles = await db.query.articles.findMany({
      where: eq(schema.articles.category, category),
      orderBy: desc(schema.articles.publishDate)
    });
    
    setCached(cacheKey, articles);
    return articles;
  },

  // Batch operations for dashboard
  async getDashboardData() {
    const cacheKey = 'dashboard_data';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Execute all queries in parallel for better performance
    const [artists, events, products, podcasts, articles] = await Promise.all([
      db.query.artists.findMany({
        orderBy: [schema.artists.displayOrder, desc(schema.artists.createdAt)]
      }),
      db.query.events.findMany({
        orderBy: desc(schema.events.date)
      }),
      db.query.products.findMany({
        orderBy: desc(schema.products.createdAt)
      }),
      db.query.podcasts.findMany({
        orderBy: [schema.podcasts.displayOrder, desc(schema.podcasts.createdAt)]
      }),
      db.query.articles.findMany({
        orderBy: desc(schema.articles.publishDate)
      })
    ]);

    const dashboardData = { artists, events, products, podcasts, articles };
    setCached(cacheKey, dashboardData);
    return dashboardData;
  },

  // Clear cache when data is updated
  clearAllCache() {
    cache.clear();
  },

  // Clear specific cache entries
  clearCacheEntry(key: string) {
    cache.delete(key);
  },

  // Force refresh all data (bypass cache)
  async forceRefreshAll() {
    this.clearAllCache();
    return {
      artists: await this.getAllArtists(),
      events: await this.getAllEvents(),
      products: await this.getAllProducts(),
      podcasts: await this.getAllPodcasts(),
      articles: await this.getAllArticles()
    };
  }
};
