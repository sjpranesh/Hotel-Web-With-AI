const mongoose = require('mongoose');
const Category = require('./models/Category');

mongoose.connect('mongodb://localhost:27017/quickserve_qr')
  .then(async () => {
    const cats = await Category.find();
    console.log('Categories count:', cats.length);
    console.log('Sample category:', cats[0]);
    process.exit(0);
  });
