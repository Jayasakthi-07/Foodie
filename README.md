# Foodie - South Indian Cuisine MERN Stack Application

A premium, full-stack food delivery application focused on authentic South Indian cuisine, built with modern web technologies and featuring a beautiful, responsive UI with dark mode support.

## 🚀 Features

### User Features
- **Browse & Search**: Explore 100+ authentic South Indian dishes with advanced filtering
- **Detailed Product Views**: View dish details with images, spice levels, and customizable add-ons
- **Shopping Cart**: Add items to cart with GST calculation and delivery charges
- **Checkout**: Secure checkout with address management and multiple payment methods
- **Real-time Order Tracking**: Track your orders in real-time using Socket.io
- **User Authentication**: Secure login/register with JWT tokens
- **Profile Management**: Manage profile, addresses, and wallet balance
- **Order History**: View all past orders with detailed information
- **Theme Toggle**: Switch between light and dark themes

### Admin Features
- **Dashboard**: Comprehensive analytics with sales, orders, and top dishes
- **Restaurant Management**: Add, edit, and manage restaurants
- **Dish Management**: Full CRUD operations for dishes and categories
- **Order Management**: Update order statuses with real-time notifications
- **Promo Code Management**: Create and manage promotional codes
- **Category Management**: Organize dishes by categories

## 🛠️ Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **TailwindCSS** for styling with custom Indian color palette
- **Zustand** for state management
- **Framer Motion** for smooth animations
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time updates
- **React Hook Form** with **Zod** for form validation

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication (Access + Refresh tokens)
- **Socket.io** for real-time order tracking
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Express Validator** for request validation

## 📁 Project Structure

```
Foodie beta/
├── server/                 # Backend application
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth & upload middleware
│   ├── utils/              # Utility functions
│   ├── socket/             # Socket.io handlers
│   ├── scripts/            # Seed script
│   ├── uploads/            # Uploaded images
│   └── server.js           # Entry point
│
└── client/                 # Frontend application
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/          # Page components
    │   ├── store/          # Zustand stores
    │   ├── utils/          # Utility functions
    │   └── App.tsx         # Main app component
    └── public/             # Static assets
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Foodie beta"
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/foodie
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_change_this_in_production
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   CLIENT_URL=http://localhost:5173
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows (if installed as service, it should start automatically)
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   ```

6. **Seed the database**
   ```bash
   cd server
   npm run seed
   ```

   This will create:
   - Admin user: `admin@foodie.com` / `Foodie@2025`
   - Regular user: `user@foodie.com` / `user123`
   - Restaurant manager: `manager@foodie.com` / `manager123`
   - 3 restaurants
   - 15 categories
   - 100+ South Indian dishes
   - Sample promo codes

7. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

## 🎨 Design Features

- **Premium UI/UX**: Modern, clean design with smooth animations
- **Indian Color Palette**: Saffron, deep teal, and charcoal theme
- **Glass UI Elements**: Frosted glass effects for modern look
- **Fully Responsive**: Mobile-first design that works on all devices
- **Dark Mode**: Complete dark theme support
- **Accessibility**: WCAG AA compliant components

## 🍽️ South Indian Dishes Included

The seed script includes 100+ authentic South Indian dishes across categories:

- **Dosas**: Masala Dosa, Rava Dosa, Mysore Dosa, Paper Dosa, and more
- **Idlis**: Plain Idli, Kanchipuram Idli, Rava Idli, Poddu Idli
- **Vadas**: Medu Vada, Rava Vada, Masala Vada
- **Uttapams**: Onion, Tomato, Mixed Vegetable
- **Rice Dishes**: Pongal, Bisi Bele Bath, Curd Rice, Lemon Rice, and more
- **Biryani**: Hyderabadi, Chicken, Egg, Veg, Prawn
- **Chicken**: Chicken 65, Chettinad Chicken, Butter Chicken, and more
- **Fish & Seafood**: Kerala Fish Curry, Prawn Fry, Crab Curry
- **Vegetarian Curries**: Sambar, Rasam, Avial, and various Poriyals
- **Thalis**: Veg Thali, Non-Veg Thali, South Indian Thali
- **Appams & Stews**: Appam with various stews
- **Desserts**: Payasam, Kozhukattai, Gulab Jamun, and more
- **Beverages**: Filter Coffee, Masala Chai, Buttermilk, and more

## 🔐 Authentication

The application uses JWT-based authentication with:
- **Access Tokens**: Short-lived (15 minutes) for API requests
- **Refresh Tokens**: Long-lived (7 days) stored in HTTP-only cookies
- **Automatic Token Refresh**: Handled by Axios interceptors

## 📡 Real-time Features

- **Order Tracking**: Real-time order status updates using Socket.io
- **Admin Notifications**: Instant notifications for new orders
- **Status Updates**: Live order status changes visible to users

## 💰 Payment & Pricing

- **GST Calculation**: 18% GST automatically calculated
- **Delivery Charges**: Configurable per restaurant
- **Promo Codes**: Percentage or fixed discount support
- **Wallet System**: Mock wallet for payments
- **Multiple Payment Methods**: Cash, Wallet, Card, UPI

## 🧪 Testing Accounts

After seeding:

- **Admin**: `admin@foodie.com` / `Foodie@2025`
- **User**: `user@foodie.com` / `user123`
- **Manager**: `manager@foodie.com` / `manager123`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `POST /api/restaurants` - Create restaurant (Admin/Manager)
- `PUT /api/restaurants/:id` - Update restaurant (Admin/Manager)
- `DELETE /api/restaurants/:id` - Delete restaurant (Admin)

### Dishes
- `GET /api/dishes` - Get all dishes (with filters)
- `GET /api/dishes/:id` - Get dish by ID
- `GET /api/dishes/categories` - Get all categories
- `POST /api/dishes` - Create dish (Admin/Manager)
- `PUT /api/dishes/:id` - Update dish (Admin/Manager)
- `DELETE /api/dishes/:id` - Delete dish (Admin/Manager)

### Orders
- `POST /api/orders` - Create order (Authenticated)
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/cancel` - Cancel order

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/promo-codes` - Get all promo codes
- `POST /api/admin/promo-codes` - Create promo code
- `PUT /api/admin/promo-codes/:id` - Update promo code

### User
- `PUT /api/user/profile` - Update profile
- `POST /api/user/addresses` - Add address
- `PUT /api/user/addresses/:id` - Update address
- `DELETE /api/user/addresses/:id` - Delete address
- `GET /api/user/wallet` - Get wallet balance
- `POST /api/user/wallet/add` - Add wallet balance

## 🛠️ Development

### Running in Development Mode

```bash
# Backend (with nodemon for auto-reload)
cd server
npm run dev

# Frontend (with Vite HMR)
cd client
npm run dev
```

### Building for Production

```bash
# Build frontend
cd client
npm run build

# Start production server
cd server
npm start
```

## 📦 Scripts

### Server Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### Client Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check service status
- Verify connection string in `.env` file
- Check if port 27017 is available

### Port Already in Use
- Change `PORT` in server `.env` file
- Change Vite port in `client/vite.config.ts`

### CORS Issues
- Verify `CLIENT_URL` in server `.env` matches frontend URL
- Check CORS configuration in `server/server.js`

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Development

Built with ❤️ for showcasing authentic South Indian cuisine in a modern, premium food delivery platform.

---

**Note**: This is a demonstration project. For production use, ensure:
- Strong JWT secrets
- Secure MongoDB connection
- Proper error handling
- Input validation
- Rate limiting
- HTTPS encryption
- Environment-specific configurations

