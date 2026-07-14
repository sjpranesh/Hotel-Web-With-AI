const mongoose = require('mongoose');
const Category = require('./models/Category');
const User = require('./models/User');
mongoose.connect('mongodb://localhost:27017/quickserve_qr')
  .then(async () => {
    const cats = await Category.find();
    console.log('Categories count:', cats.length);

    const users = await User.find();

    console.log('Users:');
    console.log(users);

    process.exit(0);
  });
