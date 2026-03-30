const { sequelize } = require('../config/database');
const Hostel = require('../models/Hostel');

async function updateHostelGender() {
  try {
    await sequelize.sync();
    
    // Update all hostels without gender to COED
    const [updatedCount] = await Hostel.update(
      { gender: 'COED' },
      { 
        where: { 
          gender: null 
        } 
      }
    );

    console.log(`✅ Updated ${updatedCount} hostels to COED gender`);
    
    // Display all hostels with their gender
    const allHostels = await Hostel.findAll({
      attributes: ['id', 'name', 'blockCode', 'gender', 'totalRooms']
    });
    
    console.log('\n📋 Current Hostels:');
    allHostels.forEach(hostel => {
      console.log(`  - ID: ${hostel.id}, Name: ${hostel.name}, Gender: ${hostel.gender || 'NOT SET'}`);
    });
    
    console.log('\n✨ Migration complete!');
    console.log('ℹ️  Note: All hostels are now set to COED. You can change them individually in the Hostels page.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

updateHostelGender();
