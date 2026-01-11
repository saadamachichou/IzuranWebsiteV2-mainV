import { db } from "./db/index";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixArtistSlug() {
  try {
    console.log("Fixing artist slug...");
    
    // Update the artist with ID 1 to have the correct slug
    const [updatedArtist] = await db.update(schema.artists)
      .set({ 
        slug: "3pl7ven-m",
        name: "🜃🕯️ 3PL7VEN M 🇲🇦 -"
      })
      .where(eq(schema.artists.id, 1))
      .returning();
    
    console.log("Artist updated successfully:", updatedArtist);
  } catch (error) {
    console.error("Error updating artist:", error);
  }
}

fixArtistSlug(); 