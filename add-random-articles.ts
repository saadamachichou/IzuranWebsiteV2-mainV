import 'dotenv/config';
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const articlesData = [
  {
    title: "The Sacred Geometry of Amazigh Symbolism",
    slug: "sacred-geometry-amazigh-symbolism",
    content: "Explore the intricate mathematical patterns and symbolic meanings embedded in traditional Amazigh art and architecture. From the ancient zigzag patterns representing water and life to the diamond shapes symbolizing femininity and protection, Amazigh geometry reveals a sophisticated understanding of sacred mathematics that predates many classical civilizations. These patterns are not merely decorative but serve as visual languages carrying profound spiritual and cultural significance.",
    imageUrl: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?q=80&w=2070&auto=format&fit=crop",
    category: "Mysticism",
    publishDate: new Date("2024-01-15")
  },
  {
    title: "Sonic Rituals: Sound as a Portal to Consciousness",
    slug: "sonic-rituals-consciousness-portal",
    content: "An exploration of how repetitive rhythms and drone frequencies in traditional ceremonies create altered states of consciousness. From the hypnotic beats of Gnawa ceremonies to the sustained tones of throat singing, sound has been used for millennia as a tool for transcendence. Modern neuroscience is now confirming what ancient practitioners have always known: certain frequencies can entrain brainwaves, inducing meditative and trance states that open gateways to expanded awareness.",
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop",
    category: "Mysticism",
    publishDate: new Date("2024-02-20")
  },
  {
    title: "Preserving Oral Traditions in the Digital Age",
    slug: "preserving-oral-traditions-digital-age",
    content: "How modern technology is being used to document and preserve ancient storytelling practices. The challenge of maintaining the essence of oral tradition while adapting to digital formats presents unique opportunities and risks. Through collaborative projects with indigenous communities, we're developing ethical frameworks for digital preservation that honor the living nature of these traditions while making them accessible to future generations without compromising their sacredness or cultural integrity.",
    imageUrl: "https://images.unsplash.com/photo-1516976487184-03fa9632f4c9?q=80&w=2070&auto=format&fit=crop",
    category: "Culture",
    publishDate: new Date("2024-03-10")
  },
  {
    title: "The Physics of Resonance in Cave Acoustics",
    slug: "physics-resonance-cave-acoustics",
    content: "Scientific analysis of why certain caves were chosen as sacred spaces based on their acoustic properties. Recent studies using advanced acoustic modeling have revealed that many prehistoric ritual sites were selected for their unique resonant frequencies, often corresponding to fundamental tones that induce physiological responses in humans. These natural resonance chambers may have amplified both sound and spiritual experience, creating profound multi-sensory environments for ceremony and communication with the divine.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
    category: "Technique",
    publishDate: new Date("2024-04-05")
  },
  {
    title: "Berber Carpet Weaving: Textile as Language",
    slug: "berber-carpet-weaving-textile-language",
    content: "Understanding the symbolic vocabulary woven into traditional Amazigh carpets and textiles. Each knot, color, and pattern tells a story - from fertility wishes to protection prayers, from tribal identity to personal narrative. Master weavers spend years learning this visual language, passing down knowledge through generations. Modern scholars are now working to decode these textile archives, revealing complex systems of communication that have preserved cultural memory for thousands of years.",
    imageUrl: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?q=80&w=2080&auto=format&fit=crop",
    category: "Culture",
    publishDate: new Date("2024-05-12")
  },
  {
    title: "Experimental Approaches to Traditional Instrumentation",
    slug: "experimental-traditional-instrumentation",
    content: "Contemporary musicians are reimagining ancient instruments through modern techniques. By applying extended techniques, electronic processing, and contemporary composition methods to traditional instruments like the guembri, bendir, and ney, artists are creating new sonic vocabularies that honor ancestral knowledge while pushing into uncharted territory. This fusion creates a bridge between past and future, demonstrating that tradition is not static but a living, evolving force.",
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop",
    category: "Technique",
    publishDate: new Date("2024-06-18")
  },
  {
    title: "Lunar Cycles and Ritual Timing in North African Traditions",
    slug: "lunar-cycles-ritual-timing-north-africa",
    content: "The relationship between celestial movements and ceremonial practices across Amazigh communities. For millennia, lunar phases have dictated the timing of planting, harvesting, ceremonies, and rites of passage. This ancient knowledge reflects a sophisticated understanding of astronomical cycles and their influence on natural and human rhythms. Modern practitioners continue to observe these lunar connections, maintaining a sacred calendar that synchronizes human activity with cosmic patterns.",
    imageUrl: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=2076&auto=format&fit=crop",
    category: "Mysticism",
    publishDate: new Date("2024-07-22")
  },
  {
    title: "The Art of Natural Dyes: Ancient Color Alchemy",
    slug: "art-natural-dyes-ancient-color-alchemy",
    content: "Traditional methods of extracting and applying plant-based dyes used in textile and art creation. From saffron yellows to indigo blues, from pomegranate reds to walnut browns, natural dyeing is both science and art. The processes often involve ritual preparation, specific timing, and ancestral recipes guarded within families. Each color carries symbolic meaning and spiritual significance, transforming the simple act of dyeing into a sacred practice that connects the practitioner with earth, ancestors, and the spirit world.",
    imageUrl: "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?q=80&w=2074&auto=format&fit=crop",
    category: "Technique",
    publishDate: new Date("2024-08-30")
  },
  {
    title: "Transhumance: The Nomadic Wisdom of Seasonal Migration",
    slug: "transhumance-nomadic-wisdom-seasonal-migration",
    content: "Exploring the ancient practice of seasonal livestock migration and its cultural significance. Transhumance represents one of humanity's oldest sustainable land management systems, developed over thousands of years of intimate knowledge of ecology, weather patterns, and animal behavior. This nomadic lifestyle has shaped languages, social structures, and spiritual practices across North Africa. Today, as climate change threatens traditional routes, these communities are adapting their ancestral wisdom to new challenges.",
    imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=2070&auto=format&fit=crop",
    category: "Culture",
    publishDate: new Date("2024-09-14")
  },
  {
    title: "Microphone Placement Techniques for Ceremonial Recording",
    slug: "microphone-placement-ceremonial-recording",
    content: "Best practices for capturing authentic ritual sounds without disrupting the sacred space. Recording ceremonies requires not just technical skill but deep cultural sensitivity and understanding. This guide covers everything from choosing the right equipment to positioning microphones respectfully, from managing acoustic challenges in outdoor spaces to post-production approaches that preserve the integrity of the original performance. Ethical considerations are paramount: always obtain proper permissions and understand when recording is inappropriate.",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
    category: "Technique",
    publishDate: new Date("2024-09-28")
  }
];

async function addArticles() {
  try {
    console.log("Starting to add random articles...");

    for (const article of articlesData) {
      const existingArticle = await db.query.articles.findFirst({
        where: eq(schema.articles.slug, article.slug)
      });

      if (!existingArticle) {
        await db.insert(schema.articles).values(article);
        console.log(`✓ Added article: ${article.title}`);
      } else {
        console.log(`- Article "${article.title}" already exists, skipping`);
      }
    }

    console.log("\n✨ Successfully added articles!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding articles:", error);
    process.exit(1);
  }
}

addArticles();

