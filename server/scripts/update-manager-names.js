import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const managerNames = [
  'Aravind', 'Karthik', 'Praveen', 'Naveen', 'Hariharan', 'Senthil', 'Saravanan', 'Dinesh',
  'Vignesh', 'Suresh', 'Manikandan', 'Bharath', 'Gokul', 'Ajith', 'Santhosh', 'Balaji',
  'Varun', 'Manoj'
];

const updateManagerNames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');

    // Get all restaurant managers sorted by creation date
    const managers = await User.find({ role: 'restaurant_manager' })
      .sort({ createdAt: 1 })
      .limit(18);

    if (managers.length === 0) {
      console.log('❌ No restaurant managers found!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📝 Updating ${managers.length} manager names...\n`);

    let updatedCount = 0;
    for (let i = 0; i < managers.length && i < managerNames.length; i++) {
      const manager = managers[i];
      const newName = managerNames[i];
      
      // Update manager name
      manager.name = newName;
      await manager.save();
      
      console.log(`   ✓ Updated ${manager.email} → ${newName}`);
      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} manager names!`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating manager names:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateManagerNames();

