# Data Architecture — MongoDB-only setup

This project originally used PostgreSQL (for `items`) and MongoDB (for users, chats, messages, bookings, OTPs). The repository has been updated to use **only MongoDB** for all persistent data.

## Current data ownership (MongoDB)
- Items (marketplace listings) — collection: `items`
  - Fields: title, description, price, category, imageUrl, available, userId, userName, userPhone, userHostel, userEmail, emailDomain, originalPostgresId, createdAt, updatedAt
- Users — collection: `users` (from `src/models/user.model.js`)
- Chats — `chats` (from `src/models/chat.model.js`)
- Messages — `messages` (from `src/models/message.model.js`)
- Bookings — `bookings` (from `src/models/booking.model.js`)
- OTPs — `otps` (from `src/models/otp.model.js`)

## Files added/changed for migration
- `src/models/item.mongo.model.js` — Mongoose schema for items
- `src/controllers/item.controller.js` — Updated to use Mongoose Item model
- `src/index.js` — Removed Postgres init (uses MongoDB only)
- `scripts/checkItemsMongo.js` — Inspect recent items in MongoDB
- `scripts/clearItemsMongo.js` — Clear items from MongoDB
- `scripts/migrateItemsToMongo.js` — Migration script to copy items from Postgres -> MongoDB (requires access to Postgres)
- `.env.example` — `POSTGRES_URI` marked optional

## How to migrate existing items from Postgres to MongoDB
1. Ensure both databases are accessible and relevant env vars are set in your environment (locally or on Render):
   - `MONGODB_URI` (Mongo connection string)
   - `POSTGRES_URI` (existing Postgres connection string)

2. Run the migration script locally (PowerShell example):
```powershell
# from campuszon-server folder
$env:MONGODB_URI = "your_mongo_uri"
$env:POSTGRES_URI = "your_postgres_uri"
node scripts/migrateItemsToMongo.js
```

The script will upsert items into MongoDB using `originalPostgresId` to avoid duplicates.

## Useful maintenance commands
- Check recent items (Mongo):
```powershell
npm run check-items-mongo
```

- Clear items (Mongo):
```powershell
npm run clear-items-mongo
```

- Migrate items from Postgres to Mongo:
```powershell
npm run migrate-items-to-mongo
```

## Notes and recommendations
- After migration and verification, you can safely remove Postgres-related scripts or keep them for backups.
- Enable automated backups for MongoDB (Atlas or your provider) and add a nightly `mongodump` job to external storage.
- Update any external documentation or deployments that reference Postgres to now rely on MongoDB.
- If you host on Render, remove `POSTGRES_URI` from Render environment to avoid confusion (optional).

If you want, I can:
- Run the DNS check / attempt to connect to your current Postgres host (you provide host only).
- Help run the migration by producing an exact command for your environment.
- Add a GitHub Action to export MongoDB daily to an S3 bucket.
