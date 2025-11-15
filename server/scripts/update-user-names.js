import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const userNames = [
  'Aravind', 'Karthik', 'Praveen', 'Naveen', 'Hariharan', 'Senthil', 'Saravanan', 'Dinesh', 'Vignesh', 'Suresh',
  'Manikandan', 'Bharath', 'Gokul', 'Ajith', 'Santhosh', 'Balaji', 'Varun', 'Manoj', 'Ashwin', 'Vijay',
  'Anand', 'Deepak', 'Rohith', 'Kishore', 'Elango', 'Kumaran', 'Murugan', 'Arjun', 'Rahul', 'Shankar',
  'Thiru', 'Rajesh', 'Prem', 'Yuvaraj', 'Charan', 'Surya', 'Arun', 'Devan', 'Vivek', 'Nithin',
  'Lokesh', 'Parthiban', 'Sathish', 'Kavin', 'Muthu', 'Jagan', 'Veera', 'Kani', 'Ezhil', 'Guhan'
];

const updateUserNames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');

    // Get all regular users (not admin or managers) sorted by creation date
    const users = await User.find({ role: 'user' })
      .sort({ createdAt: 1 })
      .limit(50);

    if (users.length === 0) {
      console.log('❌ No regular users found!');
      console.log('   Please run the seed script first: npm run seed');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📝 Updating ${users.length} user names...\n`);

    let updatedCount = 0;
    for (let i = 0; i < users.length && i < userNames.length; i++) {
      const user = users[i];
      const newName = userNames[i];
      
      // Update user name
      user.name = newName;
      
      // Update address name if exists
      if (user.addresses && user.addresses.length > 0) {
        user.addresses.forEach(address => {
          address.name = newName;
        });
      }
      
      await user.save();
      console.log(`   ✓ Updated user${i + 1}@foodie.com: ${user.email} → ${newName}`);
      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} user names!`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user names:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateUserNames();

