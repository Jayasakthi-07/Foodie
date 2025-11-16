import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');

    const Dish = (await import('../models/Dish.model.js')).default;
    const Restaurant = (await import('../models/Restaurant.model.js')).default;
    const Category = (await import('../models/Category.model.js')).default;
    const User = (await import('../models/User.model.js')).default;

    const dishCount = await Dish.countDocuments();
    const restaurantCount = await Restaurant.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await User.countDocuments();

    console.log('📊 Database Contents:');
    console.log(`   Dishes: ${dishCount}`);
    console.log(`   Restaurants: ${restaurantCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Users: ${userCount}`);

    if (dishCount === 0) {
      console.log('\n⚠️  Database is empty! Run the seed script: npm run seed');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkDatabase();

