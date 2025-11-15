import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.model.js';
import Category from '../models/Category.model.js';

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB');

    // Drop problematic slug indexes
    console.log('\n🔧 Fixing indexes...\n');
    
    // Restaurants
    try {
      await Restaurant.collection.dropIndex('slug_1');
      console.log('✅ Dropped slug_1 index from restaurants collection');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index slug_1 does not exist on restaurants (already removed)');
      } else {
        console.error('❌ Error dropping restaurants index:', error.message);
      }
    }

    // Categories
    try {
      await Category.collection.dropIndex('slug_1');
      console.log('✅ Dropped slug_1 index from categories collection');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index slug_1 does not exist on categories (already removed)');
      } else {
        console.error('❌ Error dropping categories index:', error.message);
      }
    }

    // List all indexes
    console.log('\n📋 Current indexes:');
    const restaurantIndexes = await Restaurant.collection.indexes();
    console.log('\n   Restaurants:');
    restaurantIndexes.forEach((index, i) => {
      console.log(`     ${i + 1}. ${JSON.stringify(index.key)}`);
    });

    const categoryIndexes = await Category.collection.indexes();
    console.log('\n   Categories:');
    categoryIndexes.forEach((index, i) => {
      console.log(`     ${i + 1}. ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Index fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixIndexes();

