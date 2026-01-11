import 'dotenv/config';
import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

async function seed() {
  try {
    console.log("Starting to seed database...");

    // Seed Artists
    const artistsData = [
      {
        name: "🜃🕯️ 3PL7VEN M 🇲🇦 -",
        slug: "3pl7ven-m",
        description: "Electronic music producer and DJ blending Amazigh culture with modern electronic sounds. Known for creating mystical soundscapes that bridge ancient traditions with contemporary electronic music.",
        image_Url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        instagram: "https://instagram.com/3pl7ven",
        soundcloud: "https://soundcloud.com/3pl7ven",
        bandcamp: "https://3pl7ven.bandcamp.com",
        facebook: "https://facebook.com/3pl7ven"
      },
      {
        name: "Amina Ziani",
        slug: "amina-ziani",
        description: "Electronic producer blending Amazigh vocal traditions with deep techno atmospheres.",
        image_Url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        instagram: "https://instagram.com/aminaziani",
        soundcloud: "https://soundcloud.com/aminaziani",
        bandcamp: "https://aminaziani.bandcamp.com"
      },
      {
        name: "Tarik Nightfall",
        slug: "tarik-nightfall",
        description: "Dark ambient composer and sound designer exploring ancient Berber rhythms.",
        image_Url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        instagram: "https://instagram.com/tariknightfall",
        soundcloud: "https://soundcloud.com/tariknightfall",
        bandcamp: "https://tariknightfall.bandcamp.com"
      },
      {
        name: "Lunar Echo",
        slug: "lunar-echo",
        description: "Psychedelic trance DJ specializing in sunrise sets and mystical soundscapes.",
        image_Url: "https://images.unsplash.com/photo-1501426919733-5c8b7f1b3f84?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1588&q=80",
        instagram: "https://instagram.com/lunarecho",
        soundcloud: "https://soundcloud.com/lunarecho",
        bandcamp: "https://lunarecho.bandcamp.com"
      }
    ];

    // Check if artists already exist before inserting
    for (const artist of artistsData) {
      const existingArtist = await db.query.artists.findFirst({
        where: eq(schema.artists.slug, artist.slug)
      });
      
      if (!existingArtist) {
        await db.insert(schema.artists).values(artist);
        console.log(`Added artist: ${artist.name}`);
      } else {
        console.log(`Artist ${artist.name} already exists, skipping`);
      }
    }

    // Seed Podcasts
    const podcastsData = [
      {
        title: "Mystical Journeys Vol. 3",
        slug: "mystical-journeys-vol-3",
        description: "A deep exploration of Amazigh rhythms fused with ambient textures and esoteric field recordings from the Atlas mountains.",
        coverUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        artistName: "Tarik Nightfall",
        duration: "120 min",
        genre: "Dark Ambient"
      },
      {
        title: "Desert Transmissions",
        slug: "desert-transmissions",
        description: "Hypnotic electronic soundscapes blending ancient Amazigh vocal traditions with deep techno structures.",
        coverUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        artistName: "Amina Ziani",
        duration: "90 min",
        genre: "Electronic"
      },
      {
        title: "Hypnokronoo @ Live Set Naturaíz",
        slug: "hypnokronoo-live-set-naturaiz",
        description: "An immersive live performance featuring hypnotic rhythms and mystical soundscapes from the Naturaíz Records showcase.",
        coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        audioUrl: "https://soundcloud.com/naturaiz/hypnokrono-live-set-naturaiz",
        artistName: "Hypnokrono",
        duration: "85 min",
        genre: "Psychedelic Electronic"
      }
    ];

    for (const podcast of podcastsData) {
      const existingPodcast = await db.query.podcasts.findFirst({
        where: eq(schema.podcasts.slug, podcast.slug)
      });
      
      if (!existingPodcast) {
        await db.insert(schema.podcasts).values(podcast);
        console.log(`Added podcast: ${podcast.title}`);
      } else {
        // Update the audioUrl for existing podcasts
        await db.update(schema.podcasts)
          .set({ audioUrl: podcast.audioUrl })
          .where(eq(schema.podcasts.slug, podcast.slug));
        console.log(`Updated audioUrl for podcast: ${podcast.title}`);
      }
    }

    // Seed Events
    const eventsData = [
      {
        name: "Esoteric Sounds Gathering",
        slug: "esoteric-sounds-gathering",
        description: "A night of deep psychedelic sounds and ancient Amazigh rhythms in a mystical underground setting.",
        imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        date: new Date("2023-07-15T22:00:00"),
        endDate: new Date("2023-07-16T06:00:00"),
        location: "Underground Cavern, Essaouira, Morocco",
        lineup: "Tarik Nightfall, Amina Ziani, Lunar Echo",
        ticketPrice: "$25 - $40",
        displayDate: "July 15, 2023 • 22:00 - 06:00",
        status: "upcoming"
      },
      {
        name: "Atlas Desert Transmission",
        slug: "atlas-desert-transmission",
        description: "A 48-hour immersive gathering merging electronic music with traditional Amazigh ceremonies in a remote desert location.",
        imageUrl: "https://images.unsplash.com/photo-1642417879554-9f4c8cfa5093?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        date: new Date("2023-08-05T12:00:00"),
        endDate: new Date("2023-08-07T12:00:00"),
        location: "Secret Location, Atlas Mountains",
        lineup: "10+ Artists (Full lineup TBA)",
        ticketPrice: "$80 - $150",
        displayDate: "August 5-7, 2023 • 48hrs",
        status: "upcoming"
      }
    ];

    for (const event of eventsData) {
      const existingEvent = await db.query.events.findFirst({
        where: eq(schema.events.slug, event.slug)
      });
      
      if (!existingEvent) {
        await db.insert(schema.events).values(event);
        console.log(`Added event: ${event.name}`);
      } else {
        console.log(`Event ${event.name} already exists, skipping`);
      }
    }

    // Seed Products
    const productsData = [
      {
        name: "Mystical Journeys Vinyl LP",
        slug: "mystical-journeys-vinyl-lp",
        description: "Limited edition 180g vinyl with hand-printed Amazigh symbols in glow-in-the-dark ink.",
        imageUrl: "https://images.unsplash.com/photo-1624456735729-03594a40f5fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80",
        price: "35.00",
        category: "Vinyl Records",
        artistName: "Tarik Nightfall",
        isNewRelease: true
      },
      {
        name: "Desert Transmissions T-Shirt",
        slug: "desert-transmissions-t-shirt",
        description: "Organic cotton t-shirt with psychedelic Amazigh-inspired design that reacts under UV light.",
        imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        price: "28.00",
        category: "Apparel",
        artistName: null,
        isNewRelease: false
      },
      {
        name: "Amazigh Rhythms Sample Pack",
        slug: "amazigh-rhythms-sample-pack",
        description: "Authentic field recordings and processed samples from traditional Amazigh ceremonies.",
        imageUrl: "https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        price: "45.00",
        category: "Digital Audio",
        artistName: null,
        isNewRelease: false
      }
    ];

    for (const product of productsData) {
      const existingProduct = await db.query.products.findFirst({
        where: eq(schema.products.slug, product.slug)
      });
      
      if (!existingProduct) {
        await db.insert(schema.products).values(product);
        console.log(`Added product: ${product.name}`);
      } else {
        console.log(`Product ${product.name} already exists, skipping`);
      }
    }

    // Seed Articles
    const articlesData = [
      {
        title: "The Sonic Patterns of Ancient Amazigh Rituals",
        slug: "sonic-patterns-ancient-amazigh-rituals",
        content: "Exploring the mathematical connections between traditional Amazigh music and cosmic frequencies. This article delves deep into the cultural heritage and sonic attributes that have been passed down through generations...",
        imageUrl: "https://images.unsplash.com/photo-1533397480011-057799e430f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80",
        category: "Mysticism",
        publishDate: new Date("2023-06-15")
      },
      {
        title: "Symbols and Sounds: Amazigh Visual Language",
        slug: "symbols-sounds-amazigh-visual-language",
        content: "Decoding the ancient symbolic language of the Amazigh people and its connection to sound healing. This comprehensive guide explores the historical context and modern applications of these powerful visual elements...",
        imageUrl: "https://images.unsplash.com/photo-1610106836884-de9b64da7713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80",
        category: "Culture",
        publishDate: new Date("2023-05-28")
      },
      {
        title: "Field Recording Techniques in Sacred Spaces",
        slug: "field-recording-techniques-sacred-spaces",
        content: "A guide to capturing authentic sounds in sacred locations with respect to traditions and acoustics. Learn about the equipment, methodologies, and ethical considerations when documenting the sonic elements of culturally significant locations...",
        imageUrl: "https://images.unsplash.com/photo-1551734183-adde1abfbd6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1486&q=80",
        category: "Technique",
        publishDate: new Date("2023-04-10")
      }
    ];

    for (const article of articlesData) {
      const existingArticle = await db.query.articles.findFirst({
        where: eq(schema.articles.slug, article.slug)
      });
      
      if (!existingArticle) {
        await db.insert(schema.articles).values(article);
        console.log(`Added article: ${article.title}`);
      } else {
        console.log(`Article ${article.title} already exists, skipping`);
      }
    }

    // Seed Gallery Items
    const galleryData = [
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Mystical Soundscapes',
        description: 'Ancient Amazigh rhythms meet modern electronic production in this captivating visual journey through sound and culture.',
        displayOrder: 1
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Desert Transmissions',
        description: 'Field recordings from the heart of the Sahara, capturing the essence of nomadic life and ancient traditions.',
        displayOrder: 2
      },
      {
        type: 'video',
        src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Amazigh Ceremonial Music',
        description: 'A documentary exploring traditional Amazigh music and its role in contemporary electronic music production.',
        displayOrder: 3
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1610106836884-de9b64da7711?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1610106836884-de9b64da7711?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Symbolic Resonance',
        description: 'Visual exploration of Amazigh symbols and their connection to sound healing and spiritual practices.',
        displayOrder: 4
      }
    ];

    for (const galleryItem of galleryData) {
      const existingItem = await db.query.galleryItems.findFirst({
        where: eq(schema.galleryItems.title, galleryItem.title)
      });
      
      if (!existingItem) {
        await db.insert(schema.galleryItems).values(galleryItem);
        console.log(`Added gallery item: ${galleryItem.title}`);
      } else {
        console.log(`Gallery item ${galleryItem.title} already exists, skipping`);
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
