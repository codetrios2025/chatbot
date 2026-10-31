require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const seedSuperAdmin = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("Error: MONGO_URI is missing in your .env file.");
    process.exit(1);
  }

  // Credentials can be supplied via environment variables or default fallbacks
  const adminCredentials = {
    name: process.env.SUPERADMIN_NAME || "Platform Master",
    email: (process.env.SUPERADMIN_EMAIL || "admin@platform.com")
      .toLowerCase()
      .trim(),
    password: process.env.SUPERADMIN_PASSWORD || "Admin@123456",
    role: "superadmin",
    isActive: true,
  };

  try {
    console.log("Connecting to database...");
    await mongoose.connect(mongoUri);
    console.log("Database connected successfully.");

    // 1. Verify if an admin with this email already exists
    const existingUser = await User.findOne({ email: adminCredentials.email });
    if (existingUser) {
      console.warn(
        `\n[Notice] Superadmin with email "${adminCredentials.email}" already exists.`,
      );
      console.warn(
        "Skipping creation to avoid overwriting existing credentials.\n",
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    // 2. Instantiate and save the user
    // NOTE: Using `new User(...)` and `.save()` triggers the pre-save hook in User.js to hash the password via bcrypt.
    const superAdmin = new User(adminCredentials);
    await superAdmin.save();

    console.log("\n=========================================");
    console.log(" Superadmin Created Successfully!");
    console.log("=========================================");
    console.log(`Name:     ${superAdmin.name}`);
    console.log(`Email:    ${superAdmin.email}`);
    console.log(`Password: ${adminCredentials.password}`);
    console.log(`Role:     ${superAdmin.role}`);
    console.log("=========================================\n");
    console.log("Remember to change your default password after logging in.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed superadmin user:", error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

seedSuperAdmin();
