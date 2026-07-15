const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI || "mongodb+srv://sjpranesh:Pranesh123@cluster0.sjw6pwn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("✅ Connected!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
