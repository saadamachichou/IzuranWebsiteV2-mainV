import 'dotenv/config';
import { db } from "./index";
import { deliveryPersonnel } from "@shared/schema";

async function seedDeliveryPersonnel() {
  console.log('🌱 Seeding delivery personnel data...');

  try {
    // Clear existing delivery personnel data
    await db.delete(deliveryPersonnel);
    console.log('✅ Cleared existing delivery personnel data');

    // Insert mockup delivery personnel data
    const mockDeliveryPersonnel = [
      {
        name: 'Ahmed Benali',
        phone: '+212 6 12 34 56 78',
        email: 'ahmed.benali@izuran.com',
        isActive: true,
        vehicleInfo: 'Car - Renault Clio - ABC-123'
      },
      {
        name: 'Fatima Zahra',
        phone: '+212 6 23 45 67 89',
        email: 'fatima.zahra@izuran.com',
        isActive: true,
        vehicleInfo: 'Motorcycle - Honda CG 125 - XYZ-789'
      },
      {
        name: 'Karim El Amrani',
        phone: '+212 6 34 56 78 90',
        email: 'karim.elamrani@izuran.com',
        isActive: true,
        vehicleInfo: 'Car - Dacia Logan - DEF-456'
      },
      {
        name: 'Amina Tazi',
        phone: '+212 6 45 67 89 01',
        email: 'amina.tazi@izuran.com',
        isActive: false,
        vehicleInfo: 'Bike - Electric Bike - GHI-789'
      },
      {
        name: 'Youssef Mansouri',
        phone: '+212 6 56 78 90 12',
        email: 'youssef.mansouri@izuran.com',
        isActive: true,
        vehicleInfo: 'Car - Peugeot 208 - JKL-012'
      },
      {
        name: 'Leila Berrada',
        phone: '+212 6 67 89 01 23',
        email: 'leila.berrada@izuran.com',
        isActive: true,
        vehicleInfo: 'Motorcycle - Yamaha YBR 125 - MNO-345'
      },
      {
        name: 'Hassan Alami',
        phone: '+212 6 78 90 12 34',
        email: 'hassan.alami@izuran.com',
        isActive: true,
        vehicleInfo: 'Car - Volkswagen Golf - PQR-678'
      },
      {
        name: 'Nadia El Fassi',
        phone: '+212 6 89 01 23 45',
        email: 'nadia.elfassi@izuran.com',
        isActive: false,
        vehicleInfo: 'Bike - Mountain Bike - STU-901'
      }
    ];

    const insertedPersonnel = await db.insert(deliveryPersonnel).values(mockDeliveryPersonnel).returning();
    
    console.log(`✅ Successfully seeded ${insertedPersonnel.length} delivery personnel records`);
    
    // Display the inserted data
    console.log('\n📋 Inserted Delivery Personnel:');
    insertedPersonnel.forEach((personnel, index) => {
      console.log(`${index + 1}. ${personnel.name} - ${personnel.phone} - ${personnel.vehicleInfo} - ${personnel.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error seeding delivery personnel:', error);
    throw error;
  }
}

// Run the seed function
seedDeliveryPersonnel()
  .then(() => {
    console.log('🎉 Delivery personnel seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Delivery personnel seeding failed:', error);
    process.exit(1);
  }); 