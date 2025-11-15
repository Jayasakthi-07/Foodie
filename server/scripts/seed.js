import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Restaurant from '../models/Restaurant.model.js';
import Category from '../models/Category.model.js';
import Dish from '../models/Dish.model.js';
import PromoCode from '../models/PromoCode.model.js';
import Order from '../models/Order.model.js';
import { calculateOrderTotal } from '../utils/calculateOrder.utils.js';

dotenv.config();

// Helper functions for generating past activity
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

const generatePastActivity = async (users, restaurants, dishes) => {
  console.log('\n🔄 Generating random orders for the past 30 days...\n');

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
  const ordersToCreate = [];

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

  console.log(`\n✅ Successfully created ${created} orders!`);
  
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

  return { created, totalRevenue };
};

const southIndianDishes = [
  // Dosas
  {
    name: 'Masala Dosa',
    description: 'Crispy golden dosa filled with spiced potato masala, served with coconut chutney and sambar',
    price: 120,
    spiceLevel: 2,
    isVeg: true,
    tags: ['popular', 'breakfast', 'dosa'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Rava Dosa',
    description: 'Crispy semolina dosa with onions, green chilies, and curry leaves',
    price: 110,
    spiceLevel: 2,
    isVeg: true,
    tags: ['dosa', 'breakfast'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Mysore Dosa',
    description: 'Spicy red chutney spread dosa with potato filling',
    price: 130,
    spiceLevel: 4,
    isVeg: true,
    tags: ['dosa', 'spicy'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Onion Dosa',
    description: 'Crispy dosa topped with finely chopped onions',
    price: 100,
    spiceLevel: 1,
    isVeg: true,
    tags: ['dosa', 'breakfast'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Paper Dosa',
    description: 'Extra thin and crispy dosa, served with chutney and sambar',
    price: 90,
    spiceLevel: 1,
    isVeg: true,
    tags: ['dosa', 'crispy'],
    preparationTime: 10,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Set Dosa',
    description: 'Soft, spongy mini dosas served in a set of 3',
    price: 95,
    spiceLevel: 1,
    isVeg: true,
    tags: ['dosa', 'soft'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Ghee Dosa',
    description: 'Dosa cooked with pure ghee for rich flavor',
    price: 140,
    spiceLevel: 1,
    isVeg: true,
    tags: ['dosa', 'premium'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Cheese Dosa',
    description: 'Dosa filled with melted cheese and vegetables',
    price: 150,
    spiceLevel: 2,
    isVeg: true,
    tags: ['dosa', 'cheese'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Idlis
  {
    name: 'Plain Idli',
    description: 'Soft, fluffy steamed rice cakes served with sambar and chutney',
    price: 60,
    spiceLevel: 1,
    isVeg: true,
    tags: ['idli', 'breakfast', 'healthy'],
    preparationTime: 10,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Kanchipuram Idli',
    description: 'Spiced idli with cashews, peppercorns, and curry leaves',
    price: 85,
    spiceLevel: 3,
    isVeg: true,
    tags: ['idli', 'spiced'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Rava Idli',
    description: 'Semolina idli with vegetables and tempering',
    price: 75,
    spiceLevel: 2,
    isVeg: true,
    tags: ['idli', 'rava'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Poddu Idli',
    description: 'Steamed idli tossed with spices and curry leaves',
    price: 80,
    spiceLevel: 3,
    isVeg: true,
    tags: ['idli', 'spicy'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Vadas
  {
    name: 'Medu Vada',
    description: 'Crispy lentil donuts served with sambar and coconut chutney',
    price: 70,
    spiceLevel: 2,
    isVeg: true,
    tags: ['vada', 'breakfast', 'popular'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Rava Vada',
    description: 'Crispy semolina vada with onions and spices',
    price: 75,
    spiceLevel: 2,
    isVeg: true,
    tags: ['vada', 'rava'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Masala Vada',
    description: 'Spiced chana dal vada with herbs',
    price: 80,
    spiceLevel: 3,
    isVeg: true,
    tags: ['vada', 'spicy'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Uttapams
  {
    name: 'Onion Uttapam',
    description: 'Thick dosa topped with onions, served with chutney',
    price: 100,
    spiceLevel: 2,
    isVeg: true,
    tags: ['uttapam', 'onion'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Tomato Uttapam',
    description: 'Uttapam topped with fresh tomatoes and herbs',
    price: 105,
    spiceLevel: 2,
    isVeg: true,
    tags: ['uttapam', 'tomato'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Mixed Vegetable Uttapam',
    description: 'Uttapam loaded with mixed vegetables',
    price: 115,
    spiceLevel: 2,
    isVeg: true,
    tags: ['uttapam', 'vegetables'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Rice Dishes
  {
    name: 'Pongal',
    description: 'Creamy rice and lentil porridge with ghee, peppercorns, and cashews',
    price: 90,
    spiceLevel: 2,
    isVeg: true,
    tags: ['rice', 'breakfast', 'popular'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Bisi Bele Bath',
    description: 'Spicy rice and lentil dish with vegetables and tamarind',
    price: 150,
    spiceLevel: 4,
    isVeg: true,
    tags: ['rice', 'spicy', 'lunch'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Curd Rice',
    description: 'Cooling rice mixed with yogurt, tempered with mustard and curry leaves',
    price: 85,
    spiceLevel: 0,
    isVeg: true,
    tags: ['rice', 'cooling'],
    preparationTime: 10,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Lemon Rice',
    description: 'Tangy rice tempered with lemon, mustard, and curry leaves',
    price: 90,
    spiceLevel: 1,
    isVeg: true,
    tags: ['rice', 'tangy'],
    preparationTime: 10,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Tomato Rice',
    description: 'Aromatic rice cooked with tomatoes and spices',
    price: 95,
    spiceLevel: 2,
    isVeg: true,
    tags: ['rice', 'tomato'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Coconut Rice',
    description: 'Fragrant rice cooked with fresh coconut and spices',
    price: 100,
    spiceLevel: 1,
    isVeg: true,
    tags: ['rice', 'coconut'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Tamarind Rice',
    description: 'Tangy rice with tamarind, peanuts, and spices',
    price: 95,
    spiceLevel: 2,
    isVeg: true,
    tags: ['rice', 'tamarind'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Biryanis
  {
    name: 'Hyderabadi Biryani',
    description: 'Fragrant basmati rice with tender mutton, spices, and saffron',
    price: 350,
    spiceLevel: 4,
    isVeg: false,
    tags: ['biryani', 'mutton', 'popular'],
    preparationTime: 45,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Chicken Biryani',
    description: 'Aromatic biryani with succulent chicken pieces and basmati rice',
    price: 280,
    spiceLevel: 4,
    isVeg: false,
    tags: ['biryani', 'chicken', 'popular'],
    preparationTime: 40,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Egg Biryani',
    description: 'Flavorful biryani with boiled eggs and spices',
    price: 200,
    spiceLevel: 3,
    isVeg: false,
    tags: ['biryani', 'egg'],
    preparationTime: 35,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Veg Biryani',
    description: 'Aromatic biryani with mixed vegetables and spices',
    price: 180,
    spiceLevel: 3,
    isVeg: true,
    tags: ['biryani', 'vegetarian'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Prawn Biryani',
    description: 'Delicious biryani with fresh prawns and basmati rice',
    price: 320,
    spiceLevel: 4,
    isVeg: false,
    tags: ['biryani', 'prawn', 'seafood'],
    preparationTime: 40,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Chicken Dishes
  {
    name: 'Chicken 65',
    description: 'Spicy deep-fried chicken chunks with red chilies and curry leaves',
    price: 250,
    spiceLevel: 5,
    isVeg: false,
    tags: ['chicken', 'spicy', 'popular'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Chettinad Chicken',
    description: 'Fiery Chettinad-style chicken curry with whole spices',
    price: 280,
    spiceLevel: 5,
    isVeg: false,
    tags: ['chicken', 'chettinad', 'spicy'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Chicken Curry',
    description: 'Traditional South Indian chicken curry with coconut',
    price: 240,
    spiceLevel: 3,
    isVeg: false,
    tags: ['chicken', 'curry'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Chicken Fry',
    description: 'Crispy fried chicken with South Indian spices',
    price: 260,
    spiceLevel: 4,
    isVeg: false,
    tags: ['chicken', 'fried'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Butter Chicken',
    description: 'Creamy tomato-based chicken curry',
    price: 270,
    spiceLevel: 2,
    isVeg: false,
    tags: ['chicken', 'butter', 'creamy'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Fish & Seafood
  {
    name: 'Kerala Fish Curry',
    description: 'Tangy fish curry with coconut milk and tamarind',
    price: 300,
    spiceLevel: 4,
    isVeg: false,
    tags: ['fish', 'kerala', 'curry', 'popular'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Fish Fry',
    description: 'Crispy fried fish marinated in spices',
    price: 280,
    spiceLevel: 3,
    isVeg: false,
    tags: ['fish', 'fried'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Prawn Fry',
    description: 'Spicy fried prawns with curry leaves and spices',
    price: 320,
    spiceLevel: 4,
    isVeg: false,
    tags: ['prawn', 'fried', 'seafood'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Prawn Curry',
    description: 'Creamy prawn curry with coconut and spices',
    price: 340,
    spiceLevel: 3,
    isVeg: false,
    tags: ['prawn', 'curry', 'seafood'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Crab Curry',
    description: 'Spicy crab curry with coconut and tamarind',
    price: 380,
    spiceLevel: 4,
    isVeg: false,
    tags: ['crab', 'curry', 'seafood'],
    preparationTime: 35,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Vegetarian Curries
  {
    name: 'Sambar',
    description: 'Tangy lentil stew with vegetables, served as side',
    price: 60,
    spiceLevel: 2,
    isVeg: true,
    tags: ['sambar', 'side', 'popular'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Rasam',
    description: 'Peppery tamarind soup with tomatoes and spices',
    price: 55,
    spiceLevel: 3,
    isVeg: true,
    tags: ['rasam', 'soup'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Avial',
    description: 'Mixed vegetables in coconut and yogurt gravy',
    price: 140,
    spiceLevel: 1,
    isVeg: true,
    tags: ['vegetables', 'kerala'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Vegetable Korma',
    description: 'Mixed vegetables in creamy coconut curry',
    price: 150,
    spiceLevel: 2,
    isVeg: true,
    tags: ['vegetables', 'korma'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Dal Curry',
    description: 'Traditional lentil curry with spices',
    price: 90,
    spiceLevel: 2,
    isVeg: true,
    tags: ['dal', 'curry'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Cabbage Poriyal',
    description: 'Stir-fried cabbage with coconut and spices',
    price: 100,
    spiceLevel: 2,
    isVeg: true,
    tags: ['vegetables', 'poriyal'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Beans Poriyal',
    description: 'Stir-fried beans with coconut and mustard',
    price: 110,
    spiceLevel: 2,
    isVeg: true,
    tags: ['vegetables', 'poriyal'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Brinjal Curry',
    description: 'Eggplant cooked in spicy tamarind gravy',
    price: 120,
    spiceLevel: 3,
    isVeg: true,
    tags: ['vegetables', 'brinjal'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Okra Fry',
    description: 'Crispy fried okra with spices',
    price: 130,
    spiceLevel: 2,
    isVeg: true,
    tags: ['vegetables', 'okra', 'fried'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Thalis
  {
    name: 'Veg Thali',
    description: 'Complete vegetarian meal with rice, roti, dal, vegetables, pickle, and dessert',
    price: 200,
    spiceLevel: 2,
    isVeg: true,
    tags: ['thali', 'complete-meal', 'popular'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Non-Veg Thali',
    description: 'Complete non-vegetarian meal with rice, roti, curry, dal, pickle, and dessert',
    price: 280,
    spiceLevel: 3,
    isVeg: false,
    tags: ['thali', 'complete-meal', 'popular'],
    preparationTime: 35,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'South Indian Thali',
    description: 'Traditional South Indian meal with rice, sambar, rasam, vegetables, and payasam',
    price: 220,
    spiceLevel: 2,
    isVeg: true,
    tags: ['thali', 'traditional'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Appams & Stews
  {
    name: 'Appam',
    description: 'Soft, lacy rice pancakes with crispy edges',
    price: 80,
    spiceLevel: 1,
    isVeg: true,
    tags: ['appam', 'kerala'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Appam with Vegetable Stew',
    description: 'Appam served with mild coconut vegetable stew',
    price: 150,
    spiceLevel: 1,
    isVeg: true,
    tags: ['appam', 'stew', 'kerala'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Appam with Chicken Stew',
    description: 'Appam served with creamy chicken stew',
    price: 200,
    spiceLevel: 2,
    isVeg: false,
    tags: ['appam', 'stew', 'chicken'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Kallappam',
    description: 'Fermented rice appam with toddy',
    price: 85,
    spiceLevel: 1,
    isVeg: true,
    tags: ['appam', 'kerala'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Pesarattu & Others
  {
    name: 'Pesarattu',
    description: 'Green gram dosa from Andhra Pradesh, served with ginger chutney',
    price: 100,
    spiceLevel: 2,
    isVeg: true,
    tags: ['dosa', 'andhra'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Upma',
    description: 'Savory semolina porridge with vegetables and spices',
    price: 70,
    spiceLevel: 2,
    isVeg: true,
    tags: ['breakfast', 'upma'],
    preparationTime: 12,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Poha',
    description: 'Flattened rice cooked with onions, peanuts, and spices',
    price: 65,
    spiceLevel: 2,
    isVeg: true,
    tags: ['breakfast', 'poha'],
    preparationTime: 10,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Ven Pongal',
    description: 'Savory pongal with peppercorns and ghee',
    price: 85,
    spiceLevel: 2,
    isVeg: true,
    tags: ['pongal', 'breakfast'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Sweet Pongal',
    description: 'Sweet rice and jaggery pudding with ghee and cardamom',
    price: 90,
    spiceLevel: 0,
    isVeg: true,
    tags: ['pongal', 'sweet'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Chutneys & Sides
  {
    name: 'Coconut Chutney',
    description: 'Fresh coconut chutney with green chilies and tempering',
    price: 30,
    spiceLevel: 2,
    isVeg: true,
    tags: ['chutney', 'side'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Tomato Chutney',
    description: 'Tangy tomato chutney with spices',
    price: 30,
    spiceLevel: 2,
    isVeg: true,
    tags: ['chutney', 'side'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Onion Chutney',
    description: 'Spicy onion chutney with red chilies',
    price: 30,
    spiceLevel: 3,
    isVeg: true,
    tags: ['chutney', 'side'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Ginger Chutney',
    description: 'Zesty ginger chutney from Andhra',
    price: 35,
    spiceLevel: 3,
    isVeg: true,
    tags: ['chutney', 'side'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Peanut Chutney',
    description: 'Nutty peanut chutney with tamarind',
    price: 35,
    spiceLevel: 2,
    isVeg: true,
    tags: ['chutney', 'side'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Desserts
  {
    name: 'Payasam',
    description: 'Sweet rice pudding with jaggery, ghee, and cardamom',
    price: 80,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet', 'popular'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Vermicelli Payasam',
    description: 'Sweet vermicelli pudding with milk and nuts',
    price: 85,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Badam Payasam',
    description: 'Rich almond payasam with saffron',
    price: 120,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet', 'premium'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Kozhukattai',
    description: 'Steamed rice dumplings with sweet coconut filling',
    price: 90,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Gulab Jamun',
    description: 'Soft milk dumplings in sugar syrup',
    price: 70,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Rava Kesari',
    description: 'Sweet semolina halwa with saffron and nuts',
    price: 75,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet'],
    preparationTime: 15,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Coconut Ladoo',
    description: 'Sweet coconut balls with jaggery',
    price: 65,
    spiceLevel: 0,
    isVeg: true,
    tags: ['dessert', 'sweet'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Beverages
  {
    name: 'Filter Coffee',
    description: 'Traditional South Indian filter coffee with milk and sugar',
    price: 50,
    spiceLevel: 0,
    isVeg: true,
    tags: ['beverage', 'coffee', 'popular'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Masala Chai',
    description: 'Spiced tea with cardamom, ginger, and milk',
    price: 40,
    spiceLevel: 1,
    isVeg: true,
    tags: ['beverage', 'tea'],
    preparationTime: 5,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Buttermilk',
    description: 'Cooling spiced buttermilk with curry leaves',
    price: 35,
    spiceLevel: 1,
    isVeg: true,
    tags: ['beverage', 'cooling'],
    preparationTime: 3,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Fresh Lime Soda',
    description: 'Refreshing lime soda with salt and sugar',
    price: 45,
    spiceLevel: 0,
    isVeg: true,
    tags: ['beverage', 'cooling'],
    preparationTime: 3,
    image: 'https://i.pinimg.com/1200x/5f/2e/46/5f2e469621c8cc2e482373b3a3868865.jpg',
  },
  {
    name: 'Jal Jeera',
    description: 'Spiced cumin water with mint and lemon',
    price: 40,
    spiceLevel: 1,
    isVeg: true,
    tags: ['beverage', 'cooling'],
    preparationTime: 3,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },

  // Special Items
  {
    name: 'Banana Leaf Meal',
    description: 'Traditional meal served on banana leaf with rice, sambar, rasam, vegetables, pickle, and payasam',
    price: 250,
    spiceLevel: 2,
    isVeg: true,
    tags: ['thali', 'traditional', 'special'],
    preparationTime: 30,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Kerala Sadya',
    description: 'Complete Kerala feast with multiple dishes served on banana leaf',
    price: 300,
    spiceLevel: 2,
    isVeg: true,
    tags: ['thali', 'kerala', 'special'],
    preparationTime: 40,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Puttu',
    description: 'Steamed rice and coconut cylinders, served with kadala curry',
    price: 120,
    spiceLevel: 2,
    isVeg: true,
    tags: ['kerala', 'breakfast'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Kadala Curry',
    description: 'Spicy black chickpea curry, perfect with puttu',
    price: 100,
    spiceLevel: 3,
    isVeg: true,
    tags: ['kerala', 'curry'],
    preparationTime: 25,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Kothu Parotta',
    description: 'Shredded parotta stir-fried with eggs and spices',
    price: 150,
    spiceLevel: 4,
    isVeg: false,
    tags: ['parotta', 'spicy'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Veg Kothu Parotta',
    description: 'Shredded parotta stir-fried with vegetables and spices',
    price: 130,
    spiceLevel: 3,
    isVeg: true,
    tags: ['parotta', 'vegetables'],
    preparationTime: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
];

const categories = [
  { name: 'Dosas', description: 'Crispy South Indian crepes', order: 1 },
  { name: 'Idlis', description: 'Soft steamed rice cakes', order: 2 },
  { name: 'Vadas', description: 'Crispy lentil donuts', order: 3 },
  { name: 'Uttapams', description: 'Thick savory pancakes', order: 4 },
  { name: 'Rice Dishes', description: 'Flavorful rice preparations', order: 5 },
  { name: 'Biryani', description: 'Aromatic rice and meat dishes', order: 6 },
  { name: 'Chicken', description: 'Delicious chicken preparations', order: 7 },
  { name: 'Fish & Seafood', description: 'Fresh seafood delicacies', order: 8 },
  { name: 'Vegetarian Curries', description: 'Traditional vegetable dishes', order: 9 },
  { name: 'Thalis', description: 'Complete meals', order: 10 },
  { name: 'Appams & Stews', description: 'Kerala specialties', order: 11 },
  { name: 'Chutneys & Sides', description: 'Accompaniments', order: 12 },
  { name: 'Desserts', description: 'Sweet treats', order: 13 },
  { name: 'Beverages', description: 'Drinks and refreshments', order: 14 },
  { name: 'Special Items', description: 'Regional specialties', order: 15 },
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seed = async () => {
  try {
    await connectDB();

    // Drop problematic indexes
    console.log('🔧 Fixing database indexes...');
    try {
      await Restaurant.collection.dropIndex('slug_1');
      console.log('   ✅ Dropped slug_1 index from restaurants');
    } catch (error) {
      // Index might not exist, that's okay
      if (error.code !== 27) {
        console.log('   Note: Could not drop restaurants slug index');
      }
    }
    try {
      await Category.collection.dropIndex('slug_1');
      console.log('   ✅ Dropped slug_1 index from categories');
    } catch (error) {
      // Index might not exist, that's okay
      if (error.code !== 27) {
        console.log('   Note: Could not drop categories slug index');
      }
    }

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await Dish.deleteMany({});
    await PromoCode.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@foodie.com',
      password: 'Foodie@2025', // Will be hashed by pre-save hook
      phone: '6379555329',
      role: 'admin',
      wallet: 10000,
      isEmailVerified: true,
    });

    // Create regular user
    console.log('👤 Creating regular user...');
    const user = await User.create({
      name: 'Test User',
      email: 'user@foodie.com',
      password: 'user123', // Will be hashed by pre-save hook
      phone: '9876543211',
      role: 'user',
      wallet: 5000,
      isEmailVerified: true,
      addresses: [
        {
          name: 'Test User',
          phone: '9876543211',
          addressLine1: '123 Main Street',
          addressLine2: 'Near City Mall',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          landmark: 'Opposite Park',
          isDefault: true,
        },
      ],
    });

    // Create restaurant managers (18 managers for 18 restaurants)
    console.log('👤 Creating restaurant managers...');
    const managerNames = [
      'Aravind', 'Karthik', 'Praveen', 'Naveen', 'Hariharan', 'Senthil', 'Saravanan', 'Dinesh',
      'Vignesh', 'Suresh', 'Manikandan', 'Bharath', 'Gokul', 'Ajith', 'Santhosh', 'Balaji',
      'Varun', 'Manoj'
    ];
    const managers = [];
    for (let i = 0; i < 18; i++) {
      const manager = await User.create({
        name: managerNames[i],
        email: `manager${i + 1}@foodie.com`,
        password: 'manager123',
        phone: `9876543${220 + i}`, // Start from 220 to avoid conflicts
        role: 'restaurant_manager',
        wallet: Math.floor(Math.random() * 5000),
        isEmailVerified: true,
      });
      managers.push(manager);
      console.log(`   Created manager ${i + 1}/18: ${manager.email}`);
    }

    // Create 50+ regular users
    console.log('👤 Creating 50+ regular users...');
    const userNames = [
      'Aravind', 'Karthik', 'Praveen', 'Naveen', 'Hariharan', 'Senthil', 'Saravanan', 'Dinesh', 'Vignesh', 'Suresh',
      'Manikandan', 'Bharath', 'Gokul', 'Ajith', 'Santhosh', 'Balaji', 'Varun', 'Manoj', 'Ashwin', 'Vijay',
      'Anand', 'Deepak', 'Rohith', 'Kishore', 'Elango', 'Kumaran', 'Murugan', 'Arjun', 'Rahul', 'Shankar',
      'Thiru', 'Rajesh', 'Prem', 'Yuvaraj', 'Charan', 'Surya', 'Arun', 'Devan', 'Vivek', 'Nithin',
      'Lokesh', 'Parthiban', 'Sathish', 'Kavin', 'Muthu', 'Jagan', 'Veera', 'Kani', 'Ezhil', 'Guhan'
    ];
    const users = [];
    
    for (let i = 0; i < 50; i++) {
      const userName = userNames[i];
      const user = await User.create({
        name: userName,
        email: `user${i + 1}@foodie.com`,
        password: 'user123',
        phone: `9876543${300 + i}`,
        role: 'user',
        wallet: Math.floor(Math.random() * 10000),
        isEmailVerified: Math.random() > 0.3, // 70% verified
        addresses: Math.random() > 0.5 ? [{
          name: userName,
          phone: `9876543${300 + i}`,
          addressLine1: `${Math.floor(Math.random() * 999) + 1} Street`,
          addressLine2: Math.random() > 0.7 ? 'Near Market' : undefined,
          city: ['Chennai', 'Bangalore', 'Hyderabad', 'Kochi', 'Coimbatore'][Math.floor(Math.random() * 5)],
          state: ['Tamil Nadu', 'Karnataka', 'Telangana', 'Kerala', 'Andhra Pradesh'][Math.floor(Math.random() * 5)],
          pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
          landmark: Math.random() > 0.5 ? 'Opposite Park' : undefined,
          isDefault: true,
        }] : [],
      });
      users.push(user);
      if ((i + 1) % 10 === 0) {
        console.log(`   Created ${i + 1}/50 users...`);
      }
    }

    // Create 18 Tamil Nadu-based restaurants
    console.log('🏪 Creating restaurants...');
    const restaurantData = [
      { name: 'Anand Bhavan', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', address: '456 MG Road, T Nagar', manager: managers[0]._id },
      { name: 'Saravana Bhavan', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', address: '123 Mount Road, Anna Salai', manager: managers[1]._id },
      { name: 'A2B - Adyar Ananda Bhavan', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020', address: '789 Adyar Main Road', manager: managers[2]._id },
      { name: 'Murugan Idli Shop', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004', address: '321 T Nagar, Usman Road', manager: managers[3]._id },
      { name: 'Coimbatore Kitchen', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001', address: '567 DB Road, RS Puram', manager: managers[4]._id },
      { name: 'Madurai Meenakshi Bhavan', city: 'Madurai', state: 'Tamil Nadu', pincode: '625001', address: '234 West Masi Street', manager: managers[5]._id },
      { name: 'Trichy Traditional', city: 'Tiruchirappalli', state: 'Tamil Nadu', pincode: '620001', address: '890 Rockfort Road', manager: managers[6]._id },
      { name: 'Salem Spice House', city: 'Salem', state: 'Tamil Nadu', pincode: '636001', address: '456 Omalur Main Road', manager: managers[7]._id },
      { name: 'Erode Express', city: 'Erode', state: 'Tamil Nadu', pincode: '638001', address: '123 Brough Road', manager: managers[8]._id },
      { name: 'Tirunelveli Tiffin Centre', city: 'Tirunelveli', state: 'Tamil Nadu', pincode: '627001', address: '789 Palayamkottai Road', manager: managers[9]._id },
      { name: 'Thanjavur Thali', city: 'Thanjavur', state: 'Tamil Nadu', pincode: '613001', address: '234 Grand Anicut Road', manager: managers[10]._id },
      { name: 'Kumbakonam Kadai', city: 'Kumbakonam', state: 'Tamil Nadu', pincode: '612001', address: '567 Big Street, Town', manager: managers[11]._id },
      { name: 'Vellore Bhavan', city: 'Vellore', state: 'Tamil Nadu', pincode: '632001', address: '345 Katpadi Road', manager: managers[12]._id },
      { name: 'Dindigul Biryani House', city: 'Dindigul', state: 'Tamil Nadu', pincode: '624001', address: '678 Palani Road', manager: managers[13]._id },
      { name: 'Namakkal Kitchen', city: 'Namakkal', state: 'Tamil Nadu', pincode: '637001', address: '123 Trichy Road', manager: managers[14]._id },
      { name: 'Karur Delights', city: 'Karur', state: 'Tamil Nadu', pincode: '639001', address: '456 Dindigul Road', manager: managers[15]._id },
      { name: 'Pollachi Express', city: 'Pollachi', state: 'Tamil Nadu', pincode: '642001', address: '789 Coimbatore Road', manager: managers[16]._id },
      { name: 'Nagercoil Spice', city: 'Nagercoil', state: 'Tamil Nadu', pincode: '629001', address: '234 Kanyakumari Road', manager: managers[17]._id },
    ];

    const restaurants = [];
    for (let i = 0; i < restaurantData.length; i++) {
      const data = restaurantData[i];
      const restaurant = await Restaurant.create({
        name: data.name,
        description: `Authentic Tamil Nadu cuisine from ${data.city} - Serving traditional South Indian delicacies with love and tradition`,
        cuisine: 'Tamil Nadu',
        rating: 4 + Math.random(),
        totalReviews: Math.floor(Math.random() * 1000) + 100,
        deliveryTime: 25 + Math.floor(Math.random() * 15),
        deliveryCharge: 25 + Math.floor(Math.random() * 15),
        minimumOrder: 100 + Math.floor(Math.random() * 50),
        isActive: true,
        manager: data.manager,
        address: {
          addressLine1: data.address || `${Math.floor(Math.random() * 999) + 1} Main Street`,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        timings: {
          open: ['07:00', '08:00', '09:00'][Math.floor(Math.random() * 3)],
          close: ['21:00', '22:00', '23:00'][Math.floor(Math.random() * 3)],
        },
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      });
      restaurants.push(restaurant);
      console.log(`   Created restaurant ${i + 1}/18: ${restaurant.name} - ${data.city}`);
    }

    const restaurant1 = restaurants[0];
    const restaurant2 = restaurants[1];
    const restaurant3 = restaurants[2];

    // Create categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    // Map dishes to categories
    const dishCategoryMap = {
      'Dosas': ['Masala Dosa', 'Rava Dosa', 'Mysore Dosa', 'Onion Dosa', 'Paper Dosa', 'Set Dosa', 'Ghee Dosa', 'Cheese Dosa', 'Pesarattu'],
      'Idlis': ['Plain Idli', 'Kanchipuram Idli', 'Rava Idli', 'Poddu Idli'],
      'Vadas': ['Medu Vada', 'Rava Vada', 'Masala Vada'],
      'Uttapams': ['Onion Uttapam', 'Tomato Uttapam', 'Mixed Vegetable Uttapam'],
      'Rice Dishes': ['Pongal', 'Bisi Bele Bath', 'Curd Rice', 'Lemon Rice', 'Tomato Rice', 'Coconut Rice', 'Tamarind Rice', 'Ven Pongal', 'Sweet Pongal'],
      'Biryani': ['Hyderabadi Biryani', 'Chicken Biryani', 'Egg Biryani', 'Veg Biryani', 'Prawn Biryani'],
      'Chicken': ['Chicken 65', 'Chettinad Chicken', 'Chicken Curry', 'Chicken Fry', 'Butter Chicken'],
      'Fish & Seafood': ['Kerala Fish Curry', 'Fish Fry', 'Prawn Fry', 'Prawn Curry', 'Crab Curry'],
      'Vegetarian Curries': ['Sambar', 'Rasam', 'Avial', 'Vegetable Korma', 'Dal Curry', 'Cabbage Poriyal', 'Beans Poriyal', 'Brinjal Curry', 'Okra Fry'],
      'Thalis': ['Veg Thali', 'Non-Veg Thali', 'South Indian Thali'],
      'Appams & Stews': ['Appam', 'Appam with Vegetable Stew', 'Appam with Chicken Stew', 'Kallappam'],
      'Chutneys & Sides': ['Coconut Chutney', 'Tomato Chutney', 'Onion Chutney', 'Ginger Chutney', 'Peanut Chutney'],
      'Desserts': ['Payasam', 'Vermicelli Payasam', 'Badam Payasam', 'Kozhukattai', 'Gulab Jamun', 'Rava Kesari', 'Coconut Ladoo'],
      'Beverages': ['Filter Coffee', 'Masala Chai', 'Buttermilk', 'Fresh Lime Soda', 'Jal Jeera'],
      'Special Items': ['Banana Leaf Meal', 'Kerala Sadya', 'Puttu', 'Kadala Curry', 'Kothu Parotta', 'Veg Kothu Parotta'],
    };

    // Generate additional dishes programmatically to reach 400+
    const generateAdditionalDishes = () => {
      const additionalDishes = [];
      const dishVariations = {
        dosa: ['Plain', 'Onion', 'Tomato', 'Capsicum', 'Paneer', 'Mushroom', 'Corn', 'Cheese', 'Butter', 'Egg'],
        idli: ['Plain', 'Rava', 'Oats', 'Ragi', 'Wheat', 'Corn', 'Spinach', 'Carrot', 'Beetroot'],
        vada: ['Medu', 'Rava', 'Masala', 'Onion', 'Tomato', 'Capsicum', 'Mixed'],
        rice: ['Lemon', 'Tomato', 'Coconut', 'Tamarind', 'Curd', 'Puliogare', 'Bisi Bele', 'Vangi Bath', 'Chitranna'],
        curry: ['Dal', 'Sambar', 'Rasam', 'Avial', 'Kootu', 'Poriyal', 'Thoran', 'Pachadi'],
        fry: ['Chicken', 'Fish', 'Prawn', 'Mutton', 'Egg', 'Paneer', 'Mushroom', 'Cauliflower'],
      };

      // Generate dosa variations (50+)
      dishVariations.dosa.forEach((type, i) => {
        additionalDishes.push({
          name: `${type} Dosa`,
          description: `Delicious ${type.toLowerCase()} dosa with authentic South Indian flavors`,
          price: 90 + (i * 5),
          spiceLevel: Math.floor(Math.random() * 3) + 1,
          isVeg: !type.includes('Egg'),
          tags: ['dosa', type.toLowerCase()],
          preparationTime: 12 + Math.floor(Math.random() * 5),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      // Generate idli variations (30+)
      dishVariations.idli.forEach((type, i) => {
        additionalDishes.push({
          name: `${type} Idli`,
          description: `Healthy ${type.toLowerCase()} idli, soft and fluffy`,
          price: 60 + (i * 3),
          spiceLevel: Math.floor(Math.random() * 2) + 1,
          isVeg: true,
          tags: ['idli', type.toLowerCase()],
          preparationTime: 10 + Math.floor(Math.random() * 3),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      // Generate rice variations (40+)
      dishVariations.rice.forEach((type, i) => {
        additionalDishes.push({
          name: `${type} Rice`,
          description: `Aromatic ${type.toLowerCase()} rice with traditional spices`,
          price: 85 + (i * 4),
          spiceLevel: Math.floor(Math.random() * 3) + 1,
          isVeg: true,
          tags: ['rice', type.toLowerCase()],
          preparationTime: 15 + Math.floor(Math.random() * 5),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      // Generate curry variations (60+)
      const vegetables = ['Beans', 'Carrot', 'Cabbage', 'Cauliflower', 'Potato', 'Brinjal', 'Okra', 'Drumstick', 'Ridge Gourd', 'Bottle Gourd'];
      dishVariations.curry.forEach((curryType) => {
        vegetables.forEach((veg) => {
          additionalDishes.push({
            name: `${veg} ${curryType}`,
            description: `Traditional ${curryType.toLowerCase()} with fresh ${veg.toLowerCase()}`,
            price: 80 + Math.floor(Math.random() * 40),
            spiceLevel: Math.floor(Math.random() * 3) + 1,
            isVeg: true,
            tags: [curryType.toLowerCase(), veg.toLowerCase()],
            preparationTime: 20 + Math.floor(Math.random() * 10),
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
          });
        });
      });

      // Generate fry variations (50+)
      dishVariations.fry.forEach((type, i) => {
        additionalDishes.push({
          name: `${type} Fry`,
          description: `Crispy ${type.toLowerCase()} fry with South Indian spices`,
          price: 150 + (i * 20),
          spiceLevel: Math.floor(Math.random() * 3) + 2,
          isVeg: ['Paneer', 'Mushroom', 'Cauliflower'].includes(type),
          tags: ['fry', type.toLowerCase()],
          preparationTime: 20 + Math.floor(Math.random() * 10),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      // Generate more biryani variations (30+)
      const biryaniTypes = ['Mutton', 'Chicken', 'Prawn', 'Fish', 'Egg', 'Veg', 'Paneer', 'Mushroom'];
      biryaniTypes.forEach((type, i) => {
        additionalDishes.push({
          name: `${type} Biryani`,
          description: `Fragrant ${type.toLowerCase()} biryani with basmati rice and spices`,
          price: 200 + (i * 30),
          spiceLevel: 4,
          isVeg: ['Veg', 'Paneer', 'Mushroom'].includes(type),
          tags: ['biryani', type.toLowerCase()],
          preparationTime: 35 + Math.floor(Math.random() * 10),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      // Generate more desserts (40+)
      const desserts = ['Badam', 'Kesar', 'Pista', 'Chocolate', 'Vanilla', 'Strawberry', 'Mango', 'Coconut', 'Jaggery', 'Cardamom'];
      desserts.forEach((flavor, i) => {
        ['Payasam', 'Halwa', 'Ladoo', 'Barfi'].forEach((dessertType) => {
          additionalDishes.push({
            name: `${flavor} ${dessertType}`,
            description: `Sweet ${flavor.toLowerCase()} ${dessertType.toLowerCase()}, traditional South Indian dessert`,
            price: 70 + (i * 5),
            spiceLevel: 0,
            isVeg: true,
            tags: ['dessert', flavor.toLowerCase()],
            preparationTime: 20 + Math.floor(Math.random() * 10),
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
          });
        });
      });

      // Generate more beverages (30+)
      const beverages = ['Filter Coffee', 'Black Coffee', 'Cappuccino', 'Latte', 'Masala Tea', 'Ginger Tea', 'Cardamom Tea', 'Lemon Tea', 'Green Tea', 'Buttermilk', 'Lassi', 'Mango Lassi', 'Sweet Lassi', 'Salted Lassi', 'Jal Jeera', 'Nimbu Pani', 'Coconut Water', 'Fresh Juice'];
      beverages.forEach((beverage, i) => {
        additionalDishes.push({
          name: beverage,
          description: `Refreshing ${beverage.toLowerCase()}`,
          price: 30 + (i * 3),
          spiceLevel: beverage.includes('Masala') || beverage.includes('Ginger') ? 1 : 0,
          isVeg: true,
          tags: ['beverage', beverage.toLowerCase().replace(' ', '-')],
          preparationTime: 3 + Math.floor(Math.random() * 3),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      // Generate more thali variations (20+)
      const thaliTypes = ['Veg', 'Non-Veg', 'South Indian', 'North Indian', 'Kerala', 'Tamil', 'Andhra', 'Karnataka', 'Special', 'Deluxe'];
      thaliTypes.forEach((type, i) => {
        additionalDishes.push({
          name: `${type} Thali`,
          description: `Complete ${type.toLowerCase()} thali with multiple dishes, rice, roti, and dessert`,
          price: 200 + (i * 30),
          spiceLevel: Math.floor(Math.random() * 2) + 2,
          isVeg: !type.includes('Non-Veg'),
          tags: ['thali', type.toLowerCase()],
          preparationTime: 30 + Math.floor(Math.random() * 10),
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        });
      });

      return additionalDishes;
    };

    // Create dishes
    console.log('🍽️  Creating dishes...');
    // Use all restaurants for dish distribution
    let dishCount = 0;

    // First, create all predefined dishes
    for (const dish of southIndianDishes) {
      // Find category for this dish
      let categoryId = categoryMap['Desserts']; // default
      for (const [catName, dishNames] of Object.entries(dishCategoryMap)) {
        if (dishNames.includes(dish.name)) {
          categoryId = categoryMap[catName];
          break;
        }
      }

      // Assign to random restaurant from all restaurants
      const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

      // Add some add-ons for certain dishes
      const addOns = [];
      if (dish.name.includes('Dosa') || dish.name.includes('Idli')) {
        addOns.push({ name: 'Extra Ghee', price: 20 });
        addOns.push({ name: 'Extra Chutney', price: 15 });
      }
      if (dish.name.includes('Biryani')) {
        addOns.push({ name: 'Extra Raita', price: 30 });
        addOns.push({ name: 'Extra Pickle', price: 20 });
      }

      await Dish.create({
        ...dish,
        restaurant: restaurant._id,
        category: categoryId,
        addOns,
        rating: 4 + Math.random(),
        totalReviews: Math.floor(Math.random() * 200),
      });

      dishCount++;
      if (dishCount % 50 === 0) {
        console.log(`   Created ${dishCount} dishes...`);
      }
    }

    // Generate and create additional dishes to reach 400+
    const additionalDishes = generateAdditionalDishes();
    console.log(`   Generating ${additionalDishes.length} additional dishes...`);
    
    for (const dish of additionalDishes) {
      // Determine category
      let categoryId = categoryMap['Dosas'];
      if (dish.name.includes('Idli')) categoryId = categoryMap['Idlis'];
      else if (dish.name.includes('Vada')) categoryId = categoryMap['Vadas'];
      else if (dish.name.includes('Rice') && !dish.name.includes('Biryani')) categoryId = categoryMap['Rice Dishes'];
      else if (dish.name.includes('Biryani')) categoryId = categoryMap['Biryani'];
      else if (dish.name.includes('Chicken')) categoryId = categoryMap['Chicken'];
      else if (dish.name.includes('Fry') && !dish.isVeg) categoryId = categoryMap['Fish & Seafood'];
      else if (dish.tags.includes('curry') || dish.name.includes('Curry') || dish.name.includes('Sambar') || dish.name.includes('Rasam')) categoryId = categoryMap['Vegetarian Curries'];
      else if (dish.name.includes('Thali')) categoryId = categoryMap['Thalis'];
      else if (dish.tags.includes('dessert')) categoryId = categoryMap['Desserts'];
      else if (dish.tags.includes('beverage')) categoryId = categoryMap['Beverages'];

      // Assign to random restaurant from all restaurants
      const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

      // Add add-ons
      const addOns = [];
      if (dish.name.includes('Dosa') || dish.name.includes('Idli')) {
        addOns.push({ name: 'Extra Ghee', price: 20 });
        addOns.push({ name: 'Extra Chutney', price: 15 });
      }
      if (dish.name.includes('Biryani')) {
        addOns.push({ name: 'Extra Raita', price: 30 });
        addOns.push({ name: 'Extra Pickle', price: 20 });
      }

      await Dish.create({
        ...dish,
        restaurant: restaurant._id,
        category: categoryId,
        addOns,
        rating: 4 + Math.random(),
        totalReviews: Math.floor(Math.random() * 200),
      });

      dishCount++;
      if (dishCount % 50 === 0) {
        console.log(`   Created ${dishCount} dishes...`);
      }
    }

    // Create promo codes
    console.log('🎟️  Creating promo codes...');
    await PromoCode.create([
      {
        code: 'WELCOME50',
        description: '50% off on first order',
        discountType: 'percentage',
        discountValue: 50,
        minOrderAmount: 200,
        maxDiscount: 200,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 1,
        isActive: true,
      },
      {
        code: 'SAVE100',
        description: 'Flat ₹100 off',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 500,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 100,
        isActive: true,
      },
      {
        code: 'FIRST20',
        description: '20% off on orders above ₹300',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 300,
        maxDiscount: 150,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);

    // Generate past 30 days activity
    const regularUsers = await User.find({ role: 'user' });
    const allRestaurants = await Restaurant.find({ isActive: true });
    const allDishes = await Dish.find({ isAvailable: true });
    
    if (regularUsers.length > 0 && allRestaurants.length > 0 && allDishes.length > 0) {
      const activityStats = await generatePastActivity(regularUsers, allRestaurants, allDishes);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${1 + users.length + managers.length} (1 admin, ${users.length} users, ${managers.length} managers)`);
    console.log(`   - Restaurants: ${restaurants.length} (all in Tamil Nadu - showing 18 on home page)`);
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - Dishes: ${dishCount}`);
    console.log(`   - Promo Codes: 3`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@foodie.com / Foodie@2025');
    console.log('   Users: user1@foodie.com to user50@foodie.com / user123');
    console.log(`   Managers: manager1@foodie.com to manager${managers.length}@foodie.com / manager123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();

