import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const updateAdminPhone = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');

    const admin = await User.findOne({ email: 'admin@foodie.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('   Please run the seed script first: npm run seed');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('📱 Updating admin phone number...');
    console.log(`   Current email: ${admin.email}`);
    console.log(`   Current phone: ${admin.phone || 'Not set'}`);
    console.log(`   New phone: 6379555329`);
    
    admin.phone = '6379555329';
    await admin.save();
    
    console.log('✅ Admin phone number updated successfully!');
    console.log('\n📱 Updated Admin Details:');
    console.log('   Email: admin@foodie.com');
    console.log('   Phone: 6379555329');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating phone number:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateAdminPhone();

