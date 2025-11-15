import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Dish from '../models/Dish.model.js';

dotenv.config();

const updateDishVegStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');

    // Get all dishes
    const dishes = await Dish.find({});
    
    if (dishes.length === 0) {
      console.log('❌ No dishes found!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📝 Found ${dishes.length} dishes`);
    console.log('🔄 Updating dishes to 50% Veg and 50% Non-Veg...\n');

    // Shuffle dishes randomly
    const shuffledDishes = dishes.sort(() => Math.random() - 0.5);
    
    // Calculate 50% split
    const halfCount = Math.floor(shuffledDishes.length / 2);
    
    let vegCount = 0;
    let nonVegCount = 0;

    // Update first half to Veg
    for (let i = 0; i < halfCount; i++) {
      await Dish.findByIdAndUpdate(shuffledDishes[i]._id, { isVeg: true });
      vegCount++;
    }

    // Update second half to Non-Veg
    for (let i = halfCount; i < shuffledDishes.length; i++) {
      await Dish.findByIdAndUpdate(shuffledDishes[i]._id, { isVeg: false });
      nonVegCount++;
    }

    console.log(`✅ Successfully updated dishes:`);
    console.log(`   🥬 Vegetarian: ${vegCount}`);
    console.log(`   🍗 Non-Vegetarian: ${nonVegCount}`);
    console.log(`   📊 Total: ${dishes.length}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating dish veg status:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateDishVegStatus();

