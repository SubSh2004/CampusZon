import dotenv from 'dotenv';
import pg from 'pg';
import mongoose from 'mongoose';
import Item from '../src/models/item.mongo.model.js';
import { connectMongoDB } from '../src/db/mongo.js';

dotenv.config();

const migrate = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB');

    // Connect to Postgres
    const client = new pg.Client({ connectionString: process.env.POSTGRES_URI });
    await client.connect();
    console.log('✅ Connected to Postgres (source)');

    const res = await client.query('SELECT id, title, description, price, category, "imageUrl", available, "userId", "userName", "userPhone", "userHostel", "userEmail", "emailDomain", "createdAt", "updatedAt" FROM items');
    console.log(`📦 Found ${res.rows.length} rows in Postgres items table`);

    for (const row of res.rows) {
      const doc = {
        title: row.title,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        imageUrl: row.imageUrl || null,
        available: row.available,
        userId: row.userId,
        userName: row.userName,
        userPhone: row.userPhone,
        userHostel: row.userHostel,
        userEmail: row.userEmail,
        emailDomain: row.emailDomain,
        originalPostgresId: row.id,
        createdAt: row.createdat,
        updatedAt: row.updatedat,
      };

      // Upsert by originalPostgresId to avoid duplicates
      await Item.findOneAndUpdate({ originalPostgresId: row.id }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    }

    console.log('✅ Migration complete');
    await client.end();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};

migrate();
