# CampusZon Server

Backend server for the CampusZon application built with Node.js, Express, MongoDB, and PostgreSQL.

## Features

- Express.js REST API
- MongoDB with Mongoose
- PostgreSQL with Sequelize
- Real-time communication with Socket.IO
- JWT authentication
- File uploads with Multer
- CORS enabled

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env` file and update the values:
     - `PORT`: Server port (default: 5000)
     - `MONGO_URI`: MongoDB connection string
     - `POSTGRES_URI`: PostgreSQL connection string
     - `JWT_SECRET`: Secret key for JWT tokens

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

```
campuszon-server/
├── src/
│   └── index.js          # Main application entry point
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Project dependencies
└── README.md           # Project documentation
```

## API Endpoints

Documentation coming soon...

## Socket.IO Events

Documentation coming soon...

## License

ISC
