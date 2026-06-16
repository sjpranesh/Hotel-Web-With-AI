const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Category = require('./models/Category');
require('dotenv').config();

const sampleMenuItems = [
  // SOUTH INDIAN
  { name: 'Ghee Roast Dosa', description: 'Crispy fermented crepe roasted with pure ghee', price: 120, category: 'South Indian', imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 10 },
  { name: 'Idli Sambar', description: 'Soft steamed rice cakes served with hot lentil stew', price: 90, category: 'South Indian', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  { name: 'Chettinad Chicken Curry', description: 'Spicy pepper chicken curry with rich roasted spices', price: 280, category: 'South Indian', imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 18 },

  // NORTH INDIAN
  { name: 'Classic Butter Chicken', description: 'Creamy tomato gravy with slow-roasted chicken chunks', price: 360, category: 'North Indian', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 15 },
  { name: 'Garlic Butter Naan', description: 'Tandoor-baked flatbread brushed heavily with garlic and butter', price: 65, category: 'North Indian', imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  { name: 'Paneer Tikka Kebab', description: 'Cottage cheese marinated in spiced yogurt and grilled', price: 260, category: 'North Indian', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 15 },

  // BIRYANI
  { name: 'Chicken Dum Biryani', description: 'Aromatic basmati rice slow-cooked with marinated chicken', price: 320, category: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 25 },
  { name: 'Mutton Handi Biryani', description: 'Tender mutton pieces cooked with special spices in a sealed pot', price: 450, category: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 30 },
  { name: 'Egg Biryani', description: 'Fragrant basmati rice cooked with boiled eggs and mild spices', price: 220, category: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 20 },

  // CHINESE, NOODLES & MOMO
  { name: 'Hakka Spicy Noodles', description: 'Wok-tossed noodles with crunchy vegetables and soy sauce', price: 190, category: 'Noodles', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 12 },
  { name: 'Steamed Momos', description: 'Classic Tibetan dumplings stuffed with minced fillings', price: 140, category: 'Momo', imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 12 },
  { name: 'Chilli Chicken Dry', description: 'Batter-fried chicken coated in spicy, tangy garlic soy sauce', price: 240, category: 'Chinese', imageUrl: 'https://images.unsplash.com/photo-1623653387945-2fd25d31d4e2?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 15 },

  // BURGER & SIDES
  { name: 'Chicken Zinger Burger', description: 'Crispy fried chicken breast with lettuce, mayo, and cheese', price: 220, category: 'Burger', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 14 },
  { name: 'Aloo Veggie Burger', description: 'Crispy potato patty with fresh vegetables and tangy sauce', price: 120, category: 'Burger', imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 10 },
  { name: 'Salted French Fries', description: 'Classic salted potato fries served with ketchup', price: 110, category: 'Burger', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 8 },

  // DESSERTS & CAKE
  { name: 'Chocolate Truffle Cake', description: 'Rich Dutch chocolate truffle pastry slice', price: 150, category: 'Cake', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1ea388?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  { name: 'Strawberry Cream Pastry', description: 'Soft sponge cake layered with fresh strawberry cream', price: 140, category: 'Cake', imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  { name: 'Sizzling Brownie', description: 'Hot chocolate walnut brownie topped with vanilla ice cream', price: 240, category: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 10 },

  // DRINKS & JUICE
  { name: 'Fresh Orange Juice', description: '100% natural, freshly squeezed orange juice', price: 110, category: 'Juice', imageUrl: 'https://images.unsplash.com/photo-1622597467836-f30c6a512403?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  { name: 'Iced Cold Coffee', description: 'Thick blended coffee with milk, sugar, and vanilla ice cream', price: 160, category: 'Juice', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  { name: 'Virgin Mojito', description: 'Refreshing cooler made with mint leaves, lemon juice, and soda', price: 140, category: 'Juice', imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 5 },
  
  // COMBO OFFERS
  { name: 'Ultimate South Indian Combo', description: 'Ghee Roast Dosa + 2 Idlis + Filter Coffee. Perfect morning meal!', price: 210, category: 'Combos', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 15 },
  { name: 'North Feast Combo', description: 'Butter Chicken + 2 Garlic Naan + Fresh Lime Soda. A royal treatment!', price: 440, category: 'Combos', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 20 },
  { name: 'Zinger Meal Box', description: 'Chicken Zinger Burger + Fries + Cold Coffee. Save ₹80!', price: 340, category: 'Combos', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 15 },
  { name: 'Family Biryani Combo', description: '2 Chicken Dum Biryanis + Chilli Chicken + 2 Cokes. Best for 2-3 people!', price: 799, category: 'Combos', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', isAvailable: true, preparationTime: 25 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickserve_qr');
    console.log('Connected to DB');

    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Category.deleteMany({});

    // Seed Categories
    const categories = [
      { name: 'All', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop', order: 1 },
      { name: 'South Indian', imageUrl: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=200&h=200&fit=crop', order: 2 },
      { name: 'North Indian', imageUrl: 'https://images.unsplash.com/photo-1517244671476-64416c84c20f?w=200&h=200&fit=crop', order: 3 },
      { name: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&h=200&fit=crop', order: 4 },
      { name: 'Chinese', imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=200&h=200&fit=crop', order: 5 },
      { name: 'Burger', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop', order: 6 },
      { name: 'Noodles', imageUrl: 'https://images.unsplash.com/photo-1612927608282-4469736f8660?w=200&h=200&fit=crop', order: 7 },
      { name: 'Momo', imageUrl: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=200&h=200&fit=crop', order: 8 },
      { name: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop', order: 9 },
      { name: 'Cake', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop', order: 10 },
      { name: 'Juice', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&h=200&fit=crop', order: 11 },
      { name: 'Combos', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop', order: 12 }
    ];
    await Category.insertMany(categories);

    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@quickserve.com', password: adminPassword, role: 'admin' });

    const kitchenPassword = await bcrypt.hash('kitchen123', 10);
    await User.create({ name: 'Chef John', email: 'kitchen@quickserve.com', password: kitchenPassword, role: 'kitchen' });

    await MenuItem.insertMany(sampleMenuItems);

    console.log(`✅ Database Seeded Successfully with ${sampleMenuItems.length} carefully verified image items!`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
