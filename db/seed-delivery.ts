import { db } from "./index";
import * as schema from "@shared/schema";

export async function seedDeliveryPersonnel() {
  console.log("🚚 Seeding delivery personnel...");
  
  try {
    // Check if delivery personnel already exist
    const existingPersonnel = await db.select().from(schema.deliveryPersonnel).limit(1);
    
    if (existingPersonnel.length > 0) {
      console.log("✅ Delivery personnel already exist, skipping seed");
      return;
    }

    // Add sample delivery personnel
    const deliveryPersonnelData = [
      {
        name: "Ahmed Benali",
        phone: "+212-661-234567",
        email: "ahmed.benali@izuran.com",
        isActive: true,
        vehicleInfo: "Motorcycle - License: 12345ABC"
      },
      {
        name: "Fatima Zahra",
        phone: "+212-662-345678", 
        email: "fatima.zahra@izuran.com",
        isActive: true,
        vehicleInfo: "Van - License: 67890DEF"
      },
      {
        name: "Youssef Idrissi",
        phone: "+212-663-456789",
        email: "youssef.idrissi@izuran.com",
        isActive: true,
        vehicleInfo: "Scooter - License: 11111GHI"
      }
    ];

    const insertedPersonnel = await db.insert(schema.deliveryPersonnel)
      .values(deliveryPersonnelData)
      .returning();

    console.log(`✅ Successfully seeded ${insertedPersonnel.length} delivery personnel`);
    
    // Display seeded data
    insertedPersonnel.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name} - ${person.phone}`);
    });

  } catch (error) {
    console.error("❌ Error seeding delivery personnel:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDeliveryPersonnel()
    .then(() => {
      console.log("🎉 Delivery personnel seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Delivery personnel seeding failed:", error);
      process.exit(1);
    });
}