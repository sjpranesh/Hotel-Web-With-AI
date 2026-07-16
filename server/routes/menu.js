const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all available items for customer
router.get("/", async (req, res) => {
  console.log("========== MENU API CALLED ==========");

  try {
    const menu = await Menu.find();

    console.log("Menu items found:", menu.length);
    console.log(menu);

    res.status(200).json(menu);
  } catch (error) {
    console.error("MENU ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin routes for menu are in admin.js

module.exports = router;
