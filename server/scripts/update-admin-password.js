import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');

    // Find admin user with password field
    const admin = await User.findOne({ email: 'admin@foodie.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('   Please run the seed script first: npm run seed');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('🔐 Updating admin password...');
    console.log(`   Current email: ${admin.email}`);
    console.log(`   Current role: ${admin.role}`);
    
    // Update password - mark as modified to trigger pre-save hook
    admin.password = 'Foodie@2025';
    admin.markModified('password');
    await admin.save();
    
    console.log('✅ Admin password updated successfully!');
    console.log('\n🔑 New Credentials:');
    console.log('   Email: admin@foodie.com');
    console.log('   Password: Foodie@2025');
    
    // Verify the password was updated
    const isValid = await admin.comparePassword('Foodie@2025');
    console.log(`\n✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateAdminPassword();

