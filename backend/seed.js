/**
 * Seed script — creates the initial Super Admin account.
 * Run: node seed.js  (from the backend/ directory)
 *      or: npm run seed  (from project root)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@masjid.com',
  password: 'Admin@123',
  role: 'super_admin',
};

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/masjid-management'
    );
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existing = await User.findOne({ email: SUPER_ADMIN.email });
    if (existing) {
      console.log('ℹ️  Super Admin already exists. Skipping seed.');
      console.log(`   Email: ${SUPER_ADMIN.email}`);
      await mongoose.disconnect();
      return;
    }

    await User.create(SUPER_ADMIN);

    console.log('\n🎉 Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email    : ${SUPER_ADMIN.email}`);
    console.log(`  Password : ${SUPER_ADMIN.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change the password after first login!\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
