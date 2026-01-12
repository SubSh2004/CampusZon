# CampusZon Tech Stack 🛠️

Complete technology stack used in the CampusZon campus marketplace application.

## 🎨 Frontend Technologies

### Core Framework
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **CSS Grid & Flexbox** - Modern layout systems
- **Dark Mode Support** - Complete dark/light theme switching

### State Management
- **Recoil** - Facebook's experimental state management library
- **React Query** - Server state management and caching
- **React Context** - Built-in state management for global data
- **Custom Hooks** - Reusable stateful logic

### Real-time Communication
- **Socket.IO Client** - Real-time bidirectional event-based communication
- **WebSocket** - Low-latency real-time messaging

### HTTP & API
- **Axios** - Promise-based HTTP client
- **REST API** - RESTful API communication
- **JWT Tokens** - JSON Web Token authentication

## 🚀 Backend Technologies

### Runtime & Framework
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe server-side development

### Databases
- **MongoDB** - NoSQL database for all data (users, items, chats, bookings)
- **Mongoose** - MongoDB object modeling for Node.js
- **Redis** - In-memory caching and session storage

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **Passport.js** - Authentication middleware
- **Google OAuth 2.0** - Social login integration
- **bcrypt** - Password hashing
- **Email OTP** - One-time password verification
- **CORS** - Cross-origin resource sharing
- **Express Session** - Session management

### Real-time Features
- **Socket.IO** - Real-time bidirectional communication
- **WebSocket** - Real-time messaging protocol

### File Handling
- **Multer** - Multipart/form-data handling for file uploads
- **Sharp** - Image processing and optimization
- **ImgBB** - Cloud image hosting service

### Email Services
- **Nodemailer** - Email sending functionality
- **Gmail SMTP** - Email service provider

### Payment Processing
- **Razorpay** - Payment gateway integration
- **Webhook handling** - Payment verification

## 🌐 Deployment & Hosting

### Frontend Hosting
- **Vercel** - Static site hosting and deployment
- **CDN** - Global content delivery network

### Backend Hosting
- **Render** - Cloud application hosting
- **Free Tier** - 750 hours/month compute time
- **Auto-scaling** - Automatic resource scaling

### Database Hosting
- **MongoDB Atlas** - Cloud MongoDB hosting
- **Redis Cloud** - Managed Redis hosting

## 🔧 Development Tools

### Build Tools
- **Vite** - Frontend build tool and dev server
- **npm** - Package manager
- **ESBuild** - Fast JavaScript bundler

### Code Quality
- **TypeScript Compiler** - Type checking
- **Vite** - Built-in code quality checks

### Version Control
- **Git** - Version control system
- **GitHub** - Code repository hosting

## 📦 Key Dependencies

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "typescript": "^5.2.0",
  "vite": "^7.3.1",
  "tailwindcss": "^3.4.0",
  "recoil": "^0.7.7",
  "@tanstack/react-query": "^5.90.16",
  "socket.io-client": "^4.6.0",
  "axios": "^1.6.0",
  "react-router-dom": "^6.20.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "socket.io": "^4.6.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^7.0.10",
  "cors": "^2.8.5",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "razorpay": "^2.9.6",
  "redis": "^5.10.0",
  "sharp": "^0.33.5",
  "imgbb-uploader": "^1.5.1"
}
```

## 🏗️ Architecture Patterns

### Frontend Architecture
- **Component-Based** - Reusable UI components
- **Atomic Design** - Structured component hierarchy
- **Custom Hooks** - Reusable stateful logic
- **Context Providers** - Global state management

### Backend Architecture
- **MVC Pattern** - Model-View-Controller structure
- **RESTful API** - Resource-based API design
- **Middleware Pattern** - Request/response processing
- **Database Abstraction** - ORM/ODM patterns

### Real-time Architecture
- **Event-Driven** - Socket.IO event handling
- **Room-Based** - Chat room management
- **Pub/Sub Pattern** - Notification system

## 🔐 Security Features

### Authentication
- **JWT Tokens** - Secure stateless authentication
- **OAuth 2.0** - Third-party authentication
- **Email Verification** - OTP-based verification
- **Password Hashing** - bcrypt encryption

### Data Protection
- **CORS Configuration** - Cross-origin security
- **Input Validation** - Request data validation
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Cross-site scripting prevention

## 📱 Features Enabled by Tech Stack

### Real-time Features
- Live chat messaging
- Instant notifications
- Online status indicators
- Real-time booking updates

### User Experience
- Fast page loads (Vite)
- Responsive design (Tailwind)
- Dark mode support
- Type safety (TypeScript)

### Scalability
- Component reusability (React)
- State management (Recoil + React Query)
- Database optimization (MongoDB + Redis)
- Auto-scaling deployment (Render)

## 🚀 Performance Optimizations

### Frontend
- **Code Splitting** - Lazy loading components
- **Tree Shaking** - Dead code elimination
- **Asset Optimization** - Image and bundle optimization
- **Caching** - Browser and CDN caching

### Backend
- **Connection Pooling** - Database connection optimization
- **Compression** - Response compression
- **Caching** - In-memory caching
- **Auto-sleep** - Resource conservation on Render

---

This tech stack provides a modern, scalable, and cost-effective solution for a campus marketplace application with real-time features and robust authentication.