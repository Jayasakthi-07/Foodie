// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Now import other modules
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import dishRoutes from './routes/dish.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewRoutes from './routes/review.routes.js';

// Import socket handlers
import { initializeSocket } from './socket/socket.js';
import { setSocketIO as setOrderSocketIO } from './controllers/order.controller.js';
import { setSocketIO as setAdminSocketIO } from './controllers/admin.controller.js';
import { setSocketIO as setAutoProgressSocketIO, startOrderAutoProgress } from './services/orderAutoProgress.service.js';
import { setSocketIO as setScheduledOrdersSocketIO, startScheduledOrdersProcessor } from './services/scheduledOrders.service.js';

const app = express();
const httpServer = createServer(app);
// Support multiple origins for Socket.io
const socketOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? true // Allow all origins in development
      : socketOrigins,
    credentials: true,
  },
});

// Middleware
// Support multiple origins for network access
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      // In development, allow all origins for easier network access
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.io
initializeSocket(io);

// Set io in controllers and services
setOrderSocketIO(io);
setAdminSocketIO(io);
setAutoProgressSocketIO(io);
setScheduledOrdersSocketIO(io);

// Start order auto-progression service
startOrderAutoProgress();

// Start scheduled orders processor
startScheduledOrdersProcessor();

// Export io for use in controllers
export { io };

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Foodie API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server
    const PORT = parseInt(process.env.PORT) || 5000;
    const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
    
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log(`📡 Socket.io server initialized`);
      if (HOST === '0.0.0.0') {
        console.log(`🌐 Server is accessible from other devices on your network`);
        console.log(`💡 Use your local IP address to access from other devices`);
      }
    });
    
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error(`💡 Try one of these solutions:`);
        console.error(`   1. Kill the process using port ${PORT}:`);
        console.error(`      Windows: netstat -ano | findstr :${PORT}`);
        console.error(`      Then: taskkill /F /PID <process_id>`);
        console.error(`   2. Change PORT in server/.env file`);
        console.error(`   3. Wait a few seconds and try again`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
