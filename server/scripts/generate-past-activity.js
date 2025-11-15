import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Restaurant from '../models/Restaurant.model.js';
import Dish from '../models/Dish.model.js';
import Order from '../models/Order.model.js';
import { calculateOrderTotal } from '../utils/calculateOrder.utils.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomDate = (daysAgo) => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  pastDate.setHours(randomHours, randomMinutes, 0, 0);
  return pastDate;
};

const generateRandomAddress = (user) => {
  const cities = ['Chennai', 'Bangalore', 'Hyderabad', 'Coimbatore', 'Madurai', 'Trichy'];
  const states = ['Tamil Nadu', 'Karnataka', 'Telangana', 'Andhra Pradesh'];
  const streets = ['Main Street', 'Park Avenue', 'Gandhi Road', 'MG Road', 'Anna Nagar', 'T Nagar'];
  
  return {
    name: user.name,
    phone: user.phone || '9876543210',
    addressLine1: `${getRandomInt(1, 999)} ${getRandomElement(streets)}`,
    addressLine2: `Near ${getRandomElement(['City Mall', 'Park', 'Hospital', 'School', 'Temple'])}`,
    city: getRandomElement(cities),
    state: getRandomElement(states),
    pincode: getRandomInt(600000, 699999).toString(),
    landmark: getRandomElement(['Opposite Park', 'Near Metro', 'Behind Mall', 'Next to Hospital']),
  };
};

const generatePastActivity = async () => {
  try {
    await connectDB();

    // Get all data
    const users = await User.find({ role: 'user' });
    const restaurants = await Restaurant.find({ isActive: true });
    const dishes = await Dish.find({ isAvailable: true });

    if (users.length === 0) {
      console.log('❌ No users found! Please run seed script first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    if (restaurants.length === 0) {
      console.log('❌ No restaurants found! Please run seed script first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    if (dishes.length === 0) {
      console.log('❌ No dishes found! Please run seed script first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📊 Found ${users.length} users, ${restaurants.length} restaurants, ${dishes.length} dishes`);
    console.log('🔄 Generating random orders for the past 30 days...\n');

    // Group dishes by restaurant
    const dishesByRestaurant = {};
    dishes.forEach(dish => {
      const restaurantId = dish.restaurant.toString();
      if (!dishesByRestaurant[restaurantId]) {
        dishesByRestaurant[restaurantId] = [];
      }
      dishesByRestaurant[restaurantId].push(dish);
    });

    const statuses = ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'out_for_delivery', 'ready', 'preparing', 'confirmed', 'pending', 'cancelled'];
    const paymentMethods = ['cash', 'wallet', 'card', 'upi'];
    const paymentStatuses = ['paid', 'paid', 'paid', 'pending'];

    // Generate orders for past 30 days
    // More orders on recent days, fewer on older days
    const ordersToCreate = [];
    const today = new Date();

    for (let day = 0; day < 30; day++) {
      // More orders on recent days (weighted distribution)
      const weight = 30 - day; // More weight for recent days
      const ordersForDay = Math.floor((weight / 30) * getRandomInt(5, 20)); // 5-20 orders per day, more on recent days

      for (let i = 0; i < ordersForDay; i++) {
        const user = getRandomElement(users);
        const restaurant = getRandomElement(restaurants);
        const restaurantDishes = dishesByRestaurant[restaurant._id.toString()] || [];

        if (restaurantDishes.length === 0) continue;

        // Random number of items (1-5)
        const numItems = getRandomInt(1, Math.min(5, restaurantDishes.length));
        const selectedDishes = [];
        const usedDishIds = new Set();

        for (let j = 0; j < numItems; j++) {
          let dish;
          do {
            dish = getRandomElement(restaurantDishes);
          } while (usedDishIds.has(dish._id.toString()) && restaurantDishes.length > usedDishIds.size);
          
          usedDishIds.add(dish._id.toString());
          selectedDishes.push(dish);
        }

        // Create order items
        const orderItems = selectedDishes.map(dish => {
          const quantity = getRandomInt(1, 3);
          const addOns = Math.random() > 0.7 ? [
            { name: 'Extra Spice', price: 10 },
            { name: 'Extra Cheese', price: 15 }
          ].slice(0, getRandomInt(0, 1)) : [];

          return {
            dish: dish._id,
            name: dish.name,
            price: dish.price,
            quantity,
            addOns,
          };
        });

        // Calculate subtotals for each item
        const orderItemsWithSubtotal = orderItems.map(item => {
          const addOnsTotal = (item.addOns || []).reduce((sum, addon) => sum + addon.price, 0);
          const subtotal = (item.price + addOnsTotal) * item.quantity;
          return {
            ...item,
            subtotal,
          };
        });

        // Calculate totals using the utility function
        const { subtotal, gst, deliveryCharge, discount, total } = calculateOrderTotal(
          orderItems,
          restaurant.deliveryCharge || 30,
          null // No promo code
        );

        // Random status and payment
        const status = getRandomElement(statuses);
        const paymentMethod = getRandomElement(paymentMethods);
        const paymentStatus = status === 'cancelled' ? 'refunded' : getRandomElement(paymentStatuses);

        // Create date for this order (spread throughout the day)
        const orderDate = getRandomDate(day);
        const deliveredAt = status === 'delivered' 
          ? new Date(orderDate.getTime() + getRandomInt(30, 90) * 60000) // 30-90 minutes later
          : null;

        // Create order object
        const order = {
          user: user._id,
          restaurant: restaurant._id,
          items: orderItemsWithSubtotal,
          subtotal,
          gst,
          deliveryCharge,
          discount,
          total,
          deliveryAddress: generateRandomAddress(user),
          paymentMethod,
          paymentStatus,
          status,
          estimatedDeliveryTime: new Date(orderDate.getTime() + (restaurant.deliveryTime || 45) * 60000),
          deliveredAt,
          createdAt: orderDate,
          updatedAt: status === 'delivered' && deliveredAt ? deliveredAt : orderDate,
        };

        ordersToCreate.push(order);
      }
    }

    console.log(`📦 Creating ${ordersToCreate.length} orders...`);

    // Insert orders in batches
    const batchSize = 100;
    let created = 0;
    for (let i = 0; i < ordersToCreate.length; i += batchSize) {
      const batch = ordersToCreate.slice(i, i + batchSize);
      await Order.insertMany(batch, { ordered: false });
      created += batch.length;
      process.stdout.write(`\r   Progress: ${created}/${ordersToCreate.length} orders created`);
    }

    console.log(`\n\n✅ Successfully created ${created} orders!`);
    console.log(`\n📊 Order Statistics:`);
    
    const totalRevenue = ordersToCreate
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
    
    const statusCounts = {};
    ordersToCreate.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    console.log(`   Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`   Orders by Status:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating past activity:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

generatePastActivity();

