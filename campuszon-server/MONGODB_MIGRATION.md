# MongoDB-Only Data Architecture

This project now uses **MongoDB exclusively** for all persistent data storage.

## Current Data Architecture (MongoDB)

All collections are stored in MongoDB:

### Collections:
- **items** — marketplace listings (migrated from PostgreSQL)
  - Fields: title, description, price, category, imageUrl, available, userId, userName, userPhone, userHostel, userEmail, emailDomain, createdAt, updatedAt
- **users** — user accounts and authentication
- **chats** — chat metadata
- **messages** — individual chat messages  
- **bookings** — item booking requests
- **otps** — one-time passwords for verification

### Models & Files:
- `src/models/item.mongo.model.js` — Item schema (Mongoose)
- `src/models/user.model.js` — User schema
- `src/models/chat.model.js` — Chat schema
- `src/models/message.model.js` — Message schema  
- `src/models/booking.model.js` — Booking schema
- `src/models/otp.model.js` — OTP schema

## Setup Instructions

### 1. Environment Variables
Required environment variables in `.env`:
```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMGBB_API_KEY=your_imgbb_key
# ... other optional vars
```

### 2. Verify MongoDB Setup
```bash
npm run setup-mongo
```

### 3. Check Items in MongoDB
```bash
npm run check-items-mongo
```

### 4. Clear Items (if needed)
```bash
npm run clear-items-mongo
```

## Migration Notes

- **PostgreSQL removed**: All `pg` and `sequelize` dependencies removed
- **Simplified architecture**: Single database for all data
- **Better scalability**: MongoDB handles both structured items and flexible chat/user data
- **No migration needed**: Fresh start with MongoDB-only

## Deployment on Render

1. Set environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - Remove `POSTGRES_URI` if present
   - Set other required vars (JWT_SECRET, IMGBB_API_KEY, etc.)

2. Deploy — server will start with MongoDB only

## Benefits of MongoDB-Only Architecture

- **Simplified operations**: One database to monitor and backup
- **Consistent data layer**: All models use Mongoose
- **Better performance**: No cross-database queries
- **Easier scaling**: MongoDB handles all data types well
- **Reduced complexity**: No need to manage multiple database connections

## Backups

Run regular backups:
```bash
mongodump --uri="$MONGODB_URI" --archive=backup.gz --gzip
```

Or set up automated backups through MongoDB Atlas.