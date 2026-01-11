import { db } from './db';
import { podcasts } from './shared/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
  // Find the podcast with title containing 'breakoacoustique'
  const found = await db.query.podcasts.findFirst({
    where: ilike(podcasts.title, '%breakoacoustique%'),
  });

  if (!found) {
    console.error('No podcast found with title containing "breakoacoustique"');
    process.exit(1);
  }

  // Set the new slug
  const newSlug = 'breakoacoustique';
  if (found.slug === newSlug) {
    console.log('Podcast already has the correct slug.');
    process.exit(0);
  }

  // Update the slug
  const [updated] = await db.update(podcasts)
    .set({ slug: newSlug })
    .where(eq(podcasts.id, found.id))
    .returning();

  if (updated) {
    console.log(`Updated podcast slug to '${newSlug}' for podcast ID ${found.id}`);
  } else {
    console.error('Failed to update podcast slug.');
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
}); 