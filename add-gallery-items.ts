import 'dotenv/config';
import { db } from './db/index';
import { galleryItems } from '@shared/schema';

async function addGalleryItems() {
  try {
    console.log('🖼️ Adding sample gallery items...');

    // Sample gallery data
    const sampleGalleryItems = [
      {
        type: 'image' as const,
        src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Mystical Soundscapes',
        description: 'Ancient Amazigh rhythms meet modern electronic production in this captivating visual journey through sound and culture.',
        displayOrder: 1
      },
      {
        type: 'image' as const,
        src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Desert Transmissions',
        description: 'Field recordings from the heart of the Sahara, capturing the essence of nomadic life and ancient traditions.',
        displayOrder: 2
      },
      {
        type: 'video' as const,
        src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://images.unsplash.com/photo-1602848597941-0d3d3a2c1241?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Amazigh Ceremonial Music',
        description: 'A documentary exploring traditional Amazigh music and its role in contemporary electronic music production.',
        displayOrder: 3
      },
      {
        type: 'image' as const,
        src: 'https://images.unsplash.com/photo-1610106836884-de9b64da7711?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1610106836884-de9b64da7711?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
        title: 'Symbolic Resonance',
        description: 'Visual exploration of Amazigh symbols and their connection to sound healing and spiritual practices.',
        displayOrder: 4
      }
    ];

    // Check if gallery items already exist
    const existingItems = await db.select().from(galleryItems).limit(1);
    
    if (existingItems.length > 0) {
      console.log('✅ Gallery items already exist, skipping...');
      return;
    }

    // Insert sample gallery items
    const insertedItems = await db.insert(galleryItems)
      .values(sampleGalleryItems)
      .returning();

    console.log(`✅ Successfully added ${insertedItems.length} gallery items:`);
    insertedItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.type})`);
    });

  } catch (error) {
    console.error('❌ Error adding gallery items:', error);
    throw error;
  }
}

// Run the function
addGalleryItems()
  .then(() => {
    console.log('🎉 Gallery items setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to setup gallery items:', error);
    process.exit(1);
  });
