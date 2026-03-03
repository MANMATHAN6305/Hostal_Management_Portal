require('dotenv').config();
const { sequelize } = require('../config/database');
const Hostel = require('../models/Hostel');

/**
 * Seed default hostels for the Hostel Management System
 * Run this script to populate the database with sample hostels
 * 
 * Usage: node src/seeds/seedHostels.js
 */

async function seedHostels() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    console.log('📊 Checking existing hostels...');
    const existingCount = await Hostel.count();
    
    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing hostel(s).`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        readline.question('Do you want to delete existing hostels and create new ones? (yes/no): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('❌ Seeding cancelled.');
        process.exit(0);
      }
      
      console.log('🗑️  Deleting existing hostels...');
      await Hostel.destroy({ where: {}, truncate: true, force: true });
      console.log('✅ Existing hostels deleted.');
    }

    console.log('🏢 Creating default hostels...');

    const hostels = [
      // Men's Hostels
      {
        name: "Sapphire Block",
        blockCode: "SAP",
        gender: "MALE",
        totalRooms: 50,
        wardenId: null
      },
      {
        name: "Diamond Block",
        blockCode: "DIA",
        gender: "MALE",
        totalRooms: 45,
        wardenId: null
      },
      {
        name: "Emerald Block",
        blockCode: "EME",
        gender: "MALE",
        totalRooms: 40,
        wardenId: null
      },

      // Women's Hostels
      {
        name: "Ganga Block",
        blockCode: "GAN",
        gender: "FEMALE",
        totalRooms: 50,
        wardenId: null
      },
      {
        name: "Yamuna Block",
        blockCode: "YAM",
        gender: "FEMALE",
        totalRooms: 45,
        wardenId: null
      },
      {
        name: "Saraswati Block",
        blockCode: "SAR",
        gender: "FEMALE",
        totalRooms: 40,
        wardenId: null
      },

      // Additional Men's Hostels
      {
        name: "Ruby Block",
        blockCode: "RUB",
        gender: "MALE",
        totalRooms: 35,
        wardenId: null
      },

      // Additional Women's Hostels
      {
        name: "Kaveri Block",
        blockCode: "KAV",
        gender: "FEMALE",
        totalRooms: 35,
        wardenId: null
      }
    ];

    const createdHostels = await Hostel.bulkCreate(hostels);
    
    console.log('\n✅ Successfully created hostels:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    createdHostels.forEach((hostel, index) => {
      console.log(`${index + 1}. ${hostel.name} (${hostel.blockCode})`);
      console.log(`   Gender: ${hostel.gender}`);
      console.log(`   Total Rooms: ${hostel.totalRooms}`);
      console.log('   ─────────────────────────────────────────────────');
    });

    console.log('\n📈 Summary:');
    const maleHostels = createdHostels.filter(h => h.gender === 'MALE');
    const femaleHostels = createdHostels.filter(h => h.gender === 'FEMALE');
    
    console.log(`   Total Hostels: ${createdHostels.length}`);
    console.log(`   Men's Hostels: ${maleHostels.length}`);
    console.log(`   Women's Hostels: ${femaleHostels.length}`);
    console.log(`   Total Rooms: ${createdHostels.reduce((sum, h) => sum + h.totalRooms, 0)}`);
    
    console.log('\n🎉 Hostel seeding completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Go to Admin Dashboard → Wardens');
    console.log('   2. Click "Add Warden" to create wardens');
    console.log('   3. Hostels will now appear in the dropdown when adding wardens');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding hostels:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedHostels();
