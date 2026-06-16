const mongoose = require('mongoose');
const Category = require('./models/Category');

const categories = [
  { name: 'All', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop', order: 1 },
  { name: 'Biryani', imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=300&fit=crop', order: 2 },
  { name: 'South Indian', imageUrl: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=300&h=300&fit=crop', order: 3 },
  { name: 'North Indian', imageUrl: 'https://images.unsplash.com/photo-1517244671476-64416c84c20f?w=300&h=300&fit=crop', order: 4 },
  { name: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=300&fit=crop', order: 5 },
  { name: 'Chinese', imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=300&h=300&fit=crop', order: 6 },
  { name: 'Cake', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=300&fit=crop', order: 7 },
  { name: 'Burger', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=300&fit=crop', order: 8 },
  { name: 'Ice Cream', imageUrl: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=300&h=300&fit=crop', order: 9 },
  { name: 'Rolls', imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=300&fit=crop', order: 10 },
  { name: 'Salad', imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop', order: 11 },
  { name: 'Noodles', imageUrl: 'https://images.unsplash.com/photo-1612927608282-4469736f8660?w=300&h=300&fit=crop', order: 12 },
  { name: 'Dosa', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=300&fit=crop', order: 13 },
  { name: 'Pasta', imageUrl: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=300&h=300&fit=crop', order: 14 },
  { name: 'Shake', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=300&fit=crop', order: 15 },
  { name: 'Paratha', imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea8c5119c85?w=300&h=300&fit=crop', order: 16 },
  { name: 'Shawarma', imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=300&fit=crop', order: 17 },
  { name: 'Tea', imageUrl: 'https://images.unsplash.com/photo-1544787210-2213d84ad9a0?w=300&h=300&fit=crop', order: 18 },
  { name: 'Vada', imageUrl: 'https://images.unsplash.com/photo-1589301773857-8fb4984f1c0a?w=300&h=300&fit=crop', order: 19 },
  { name: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop', order: 20 },
  { name: 'Juice', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&h=300&fit=crop', order: 21 },
  { name: 'Combos', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop', order: 22 }
];

async function forceSeed() {
  await mongoose.connect('mongodb://localhost:27017/quickserve_qr');
  await Category.deleteMany({});
  await Category.insertMany(categories);
  console.log('Force seeded categories successfully');
  process.exit(0);
}

forceSeed();
