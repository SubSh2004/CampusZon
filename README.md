# CampusZon 🛒

A full-stack campus marketplace application for students to buy, sell, and rent items within their college campus.

## 🌟 Features

- 🔐 **Authentication**: Email/Password + Google OAuth
- 📦 **Item Listings**: Create, browse, and manage items
- 💬 **Real-time Chat**: Private messaging with Socket.IO
- 📅 **Booking System**: Request and manage item bookings
- 🔔 **Notifications**: Real-time booking and message alerts with dedicated notification page
  - Separate tabs for booking and moderation notifications
  - Mark as read/unread functionality
  - Delete individual notifications
  - Clear all notifications option
- 🌙 **Dark Mode**: Full dark mode support
- 🏫 **Campus-based**: Automatic filtering by college email domain

## 🚀 Live Demo

- **Website**: [Your Vercel URL]
- **API**: [Your Render URL]

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- Recoil (State management)
- Socket.IO Client (Real-time)
- Axios (HTTP client)

### Backend
- Node.js + Express
- MongoDB (User data, chats, bookings)
- PostgreSQL (Item listings)
- Socket.IO (Real-time features)
- JWT Authentication
- Multer (File uploads)
- Nodemailer (Email OTP)

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB Atlas account
- PostgreSQL database (local or cloud)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/campuszon.git
cd campuszon
```

2. **Setup Backend**
```bash
cd campuszon-server
npm install

# Create .env file (copy from .env.example)
# Add your MongoDB, PostgreSQL, and other credentials

npm start
```

3. **Setup Frontend**
```bash
cd campuszon-client
npm install

# Create .env.local file
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

npm run dev
```

4. **Access the app**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🌐 Deployment

We use **100% free** hosting:
- **Frontend**: Vercel
- **Backend**: Render
- **Databases**: MongoDB Atlas + Render PostgreSQL

### Quick Deploy (5 minutes)
Follow the **QUICK_DEPLOY.md** guide for step-by-step instructions.

### Detailed Deploy
See **DEPLOYMENT_GUIDE.md** for comprehensive deployment documentation.

## 📁 Project Structure

```
CampusZon/
├── campuszon-client/          # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context
│   │   ├── hooks/              # Custom hooks
│   │   ├── store/              # Recoil atoms
│   │   └── config/             # Configuration
│   └── public/
├── campuszon-server/          # Express backend
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Custom middleware
│   │   ├── config/             # App configuration
│   │   └── db/                 # Database connections
│   └── public/
│       └── images/             # Uploaded images
├── QUICK_DEPLOY.md             # Quick deployment guide
└── DEPLOYMENT_GUIDE.md         # Detailed deployment docs
```

## 🔑 Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
POSTGRES_URI=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 📱 Features Overview

### For Users
- Browse items from your campus
- Chat with sellers
- Book items
- Get real-time notifications
- View and manage all notifications in dedicated page
  - Booking requests (incoming)
  - Booking updates (accepted/rejected)
  - Item moderation updates
- View contact information
- Manage your listings

### For Sellers
- List items with images
- Manage bookings
- Chat with buyers
- Track item availability
- Update item details

## 🔐 Authentication

- Email/Password with OTP verification
- Google OAuth integration
- JWT-based sessions
- Campus email verification

## 💬 Real-time Features

- Live chat messaging
- Booking notifications
- Online status
- Message read receipts
- Unread message counts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

CampusZon Team

## 🙏 Acknowledgments

- Built with React and Express
- Deployed on Vercel and Render
- Icons from Heroicons
- Styling with Tailwind CSS

---

**Ready to deploy?** Check out QUICK_DEPLOY.md to get your site live in 5 minutes! 🚀
