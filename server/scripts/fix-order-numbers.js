import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.model.js';

dotenv.config();

const fixOrderNumbers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB');

    // Find all orders without orderNumber
    const ordersWithoutNumber = await Order.find({ orderNumber: { $exists: false } });
    console.log(`\n📋 Found ${ordersWithoutNumber.length} orders without orderNumber`);

    if (ordersWithoutNumber.length === 0) {
      console.log('✅ All orders already have order numbers!');
      process.exit(0);
    }

    // Generate order numbers for each order
    let updated = 0;
    for (const order of ordersWithoutNumber) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `ORD${timestamp}${random}${updated}`; // Add counter to ensure uniqueness
      
      order.orderNumber = orderNumber;
      await order.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`   Updated ${updated}/${ordersWithoutNumber.length} orders...`);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} orders with order numbers!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixOrderNumbers();

