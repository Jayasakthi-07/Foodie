import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Dish from '../models/Dish.model.js';

dotenv.config();

const vegKeywords = ['Vegetable', 'Veg', 'Paneer', 'Mushroom', 'Dal', 'Sambar', 'Rasam', 'Avial', 'Poriyal', 'Thoran', 'Kootu', 'Pachadi', 'Chutney', 'Payasam', 'Idli', 'Dosa', 'Vada', 'Uttapam', 'Pongal', 'Rice', 'Appam', 'Puttu', 'Kadala'];
const nonVegKeywords = ['Chicken', 'Fish', 'Mutton', 'Prawn', 'Crab', 'Egg', 'Meat', 'Seafood', 'Biryani', 'Fry', 'Curry'];

const nonVegOptions = ['Chicken', 'Fish', 'Mutton', 'Prawn', 'Crab', 'Egg'];
const vegOptions = ['Vegetable', 'Paneer', 'Mushroom', 'Mixed Vegetable'];

const updateDishNames = async () => {
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
    console.log('🔄 Updating dish names to match veg/non-veg status...\n');

    let updatedCount = 0;
    let vegCount = 0;
    let nonVegCount = 0;

    for (const dish of dishes) {
      const currentName = dish.name;
      let newName = currentName;
      let needsUpdate = false;

      // Check if dish name already matches its veg status
      const hasVegKeyword = vegKeywords.some(keyword => 
        currentName.toLowerCase().includes(keyword.toLowerCase())
      );
      const hasNonVegKeyword = nonVegKeywords.some(keyword => 
        currentName.toLowerCase().includes(keyword.toLowerCase())
      );

      if (dish.isVeg) {
        // Dish should be vegetarian
        if (hasNonVegKeyword && !hasVegKeyword) {
          // Replace non-veg keywords with veg alternatives
          const randomVeg = vegOptions[Math.floor(Math.random() * vegOptions.length)];
          
          if (currentName.includes('Chicken')) {
            newName = currentName.replace(/Chicken/gi, randomVeg);
          } else if (currentName.includes('Fish')) {
            newName = currentName.replace(/Fish/gi, randomVeg);
          } else if (currentName.includes('Mutton')) {
            newName = currentName.replace(/Mutton/gi, randomVeg);
          } else if (currentName.includes('Prawn')) {
            newName = currentName.replace(/Prawn/gi, randomVeg);
          } else if (currentName.includes('Crab')) {
            newName = currentName.replace(/Crab/gi, randomVeg);
          } else if (currentName.includes('Egg')) {
            newName = currentName.replace(/Egg/gi, randomVeg);
          } else if (currentName.includes('Meat')) {
            newName = currentName.replace(/Meat/gi, randomVeg);
          } else if (currentName.includes('Non-Veg') || currentName.includes('Non Veg')) {
            newName = currentName.replace(/Non-Veg|Non Veg/gi, 'Veg');
          } else {
            // Add veg prefix if no veg keyword exists
            if (!hasVegKeyword) {
              newName = `Veg ${currentName}`;
            }
          }
          needsUpdate = true;
          vegCount++;
        } else if (!hasVegKeyword && !hasNonVegKeyword) {
          // No clear indication, add Veg prefix
          newName = `Veg ${currentName}`;
          needsUpdate = true;
          vegCount++;
        }
      } else {
        // Dish should be non-vegetarian
        if (hasVegKeyword && !hasNonVegKeyword) {
          // Replace veg keywords with non-veg alternatives
          const randomNonVeg = nonVegOptions[Math.floor(Math.random() * nonVegOptions.length)];
          
          if (currentName.includes('Veg ') || currentName.startsWith('Veg ')) {
            newName = currentName.replace(/^Veg /i, `${randomNonVeg} `);
          } else if (currentName.includes('Vegetable')) {
            newName = currentName.replace(/Vegetable/gi, randomNonVeg);
          } else if (currentName.includes('Paneer')) {
            newName = currentName.replace(/Paneer/gi, randomNonVeg);
          } else if (currentName.includes('Mushroom')) {
            newName = currentName.replace(/Mushroom/gi, randomNonVeg);
          } else {
            // Add non-veg prefix
            newName = `${randomNonVeg} ${currentName}`;
          }
          needsUpdate = true;
          nonVegCount++;
        } else if (!hasVegKeyword && !hasNonVegKeyword) {
          // No clear indication, add non-veg prefix
          const randomNonVeg = nonVegOptions[Math.floor(Math.random() * nonVegOptions.length)];
          newName = `${randomNonVeg} ${currentName}`;
          needsUpdate = true;
          nonVegCount++;
        }
      }

      if (needsUpdate && newName !== currentName) {
        await Dish.findByIdAndUpdate(dish._id, { name: newName });
        console.log(`   ✓ ${currentName} → ${newName} (${dish.isVeg ? 'Veg' : 'Non-Veg'})`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} dish names:`);
    console.log(`   🥬 Vegetarian names: ${vegCount}`);
    console.log(`   🍗 Non-Vegetarian names: ${nonVegCount}`);
    console.log(`   📊 Total dishes: ${dishes.length}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating dish names:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateDishNames();

