import { db } from './db';
import { podcasts } from './shared/schema';
import { eq } from 'drizzle-orm';

async function addHypnokronoPodcast() {
  try {
    console.log("Adding Hypnokronoo podcast to database...");
    
    const podcastData = {
      title: "Hypnokronoo @ Live Set Naturaíz",
      slug: "hypnokronoo-live-set-naturaiz",
      description: "An immersive live performance featuring hypnotic rhythms and mystical soundscapes from the Naturaíz Records showcase.",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      audioUrl: "https://soundcloud.com/naturaiz/hypnokrono-live-set-naturaiz",
      artistName: "Hypnokrono",
      duration: "85 min",
      genre: "Psychedelic Electronic"
    };

    // Check if podcast already exists
    const existingPodcast = await db.query.podcasts.findFirst({
      where: eq(podcasts.slug, podcastData.slug)
    });

    if (existingPodcast) {
      console.log("Podcast already exists, updating...");
      await db.update(podcasts)
        .set(podcastData)
        .where(eq(podcasts.slug, podcastData.slug));
    } else {
      console.log("Creating new podcast...");
      await db.insert(podcasts).values(podcastData);
    }

    console.log("Hypnokronoo podcast added successfully!");
  } catch (error) {
    console.error("Error adding podcast:", error);
  }
}

addHypnokronoPodcast(); 