<div align="center">

# 🍽️ Foodie - South Indian Cuisine MERN Stack Application

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.0-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-7.0-green.svg)

**A premium, full-stack food delivery application focused on authentic South Indian cuisine**

Built with modern web technologies and featuring a beautiful, responsive UI with dark mode support.

[Features](#-features) • [Installation](#-getting-started) • [Tech Stack](#️-tech-stack) • [Demo](#-demo) • [Documentation](#-documentation)

---

</div>

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [API Documentation](#-api-documentation)
- [Testing Accounts](#-testing-accounts)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

### 👤 User Features

| Feature | Description |
|---------|-------------|
| 🔍 **Browse & Search** | Explore 100+ authentic South Indian dishes with advanced filtering |
| 📱 **Detailed Product Views** | View dish details with images, spice levels, and customizable add-ons |
| 🛒 **Shopping Cart** | Add items to cart with GST calculation and delivery charges |
| 💳 **Secure Checkout** | Checkout with address management and multiple payment methods |
| 📍 **Real-time Order Tracking** | Track your orders in real-time using Socket.io |
| 🔐 **User Authentication** | Secure login/register with JWT tokens |
| 👤 **Profile Management** | Manage profile, addresses, and wallet balance |
| 📜 **Order History** | View all past orders with detailed information |
| 🌓 **Theme Toggle** | Switch between light and dark themes |
| 🏪 **Multi-Restaurant Orders** | Order from multiple restaurants simultaneously |

### 👨‍💼 Admin Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Comprehensive analytics with sales, orders, and top dishes |
| 🏪 **Restaurant Management** | Add, edit, and manage restaurants |
| 🍛 **Dish Management** | Full CRUD operations for dishes and categories |
| 📦 **Order Management** | Update order statuses with real-time notifications |
| 🎟️ **Promo Code Management** | Create and manage promotional codes |
| 📁 **Category Management** | Organize dishes by categories |
| 👥 **User Management** | View and manage all user accounts |

---

## 🛠️ Tech Stack

### Frontend

<div align="center">

| Category | Technology |
|----------|-----------|
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Vite |
| **Styling** | TailwindCSS with custom Indian color palette |
| **State Management** | Zustand |
| **Animations** | Framer Motion |
| **Routing** | React Router DOM |
| **HTTP Client** | Axios |
| **Real-time** | Socket.io Client |
| **Forms** | React Hook Form with Zod validation |

</div>

### Backend

<div align="center">

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (Access + Refresh tokens) |
| **Real-time** | Socket.io |
| **Security** | Bcrypt for password hashing |
| **File Upload** | Multer |
| **Validation** | Express Validator |

</div>

---

## 🚦 Getting Started

### Prerequisites

Make sure you have the following installed:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **MongoDB** (local installation or MongoDB Atlas) - [Download](https://www.mongodb.com/try/download/community)
- ✅ **npm** or **yarn** package manager
- ✅ **Git** - [Download](https://git-scm.com/)

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Jayasakthi-07/Foodie.git
cd Foodie
```

#### 2️⃣ Install Dependencies

**Install Server Dependencies:**
```bash
cd server
npm install
```

**Install Client Dependencies:**
```bash
cd ../client
npm install
```

#### 3️⃣ Environment Setup

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/foodie

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_change_this_in_production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Client Configuration
CLIENT_URL=http://localhost:5173

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

> 💡 **Tip**: Copy `server/env.example` to `server/.env` and update the values.

#### 4️⃣ Start MongoDB

**Windows:**
```bash
# MongoDB should start automatically if installed as a service
# Or start manually:
net start MongoDB
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

#### 5️⃣ Seed the Database

```bash
cd server
npm run seed
```

This will create:
- 👤 **Admin user**: `admin@foodie.com` / `Foodie@2025`
- 👤 **Regular users**: `user1@foodie.com` to `user50@foodie.com` / `user123`
- 👨‍💼 **Restaurant managers**: `manager1@foodie.com` to `manager18@foodie.com` / `manager123`
- 🏪 **18 restaurants**
- 📁 **15 categories**
- 🍛 **100+ South Indian dishes** 
- 🎟️ **Sample promo codes**

#### 6️⃣ Start Development Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
🌐 Server runs on: `http://localhost:5000`

**Terminal 2 - Frontend Client:**
```bash
cd client
npm run dev
```
🌐 Client runs on: `http://localhost:5173`

> 🎉 **Success!** Open `http://localhost:5173` in your browser to see the application.

---

## 📁 Project Structure

```
Foodie/
├── 📂 server/                 # Backend application
│   ├── 📂 controllers/        # Route controllers
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── dish.controller.js
│   │   ├── order.controller.js
│   │   └── ...
│   ├── 📂 models/             # MongoDB models
│   │   ├── User.model.js
│   │   ├── Restaurant.model.js
│   │   ├── Dish.model.js
│   │   └── ...
│   ├── 📂 routes/             # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   └── ...
│   ├── 📂 middleware/         # Auth & upload middleware
│   ├── 📂 utils/              # Utility functions
│   ├── 📂 socket/             # Socket.io handlers
│   ├── 📂 scripts/            # Database scripts
│   │   ├── seed.js
│   │   ├── update-admin-password.js
│   │   └── ...
│   ├── 📂 uploads/            # Uploaded images
│   └── 📄 server.js           # Entry point
│
└── 📂 client/                 # Frontend application
    ├── 📂 src/
    │   ├── 📂 components/     # Reusable components
    │   │   ├── auth/
    │   │   └── layout/
    │   ├── 📂 pages/          # Page components
    │   │   ├── admin/
    │   │   ├── Home.tsx
    │   │   ├── Menu.tsx
    │   │   └── ...
    │   ├── 📂 store/          # Zustand stores
    │   │   ├── authStore.ts
    │   │   ├── cartStore.ts
    │   │   └── themeStore.ts
    │   ├── 📂 utils/          # Utility functions
    │   └── 📄 App.tsx         # Main app component
    └── 📂 public/            # Static assets
```

---

## 🎨 Design Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🎨 **Premium UI/UX** | Modern, clean design with smooth animations |
| 🇮🇳 **Indian Color Palette** | Saffron, deep teal, and charcoal theme |
| 🔮 **Glass UI Elements** | Frosted glass effects for modern look |
| 📱 **Fully Responsive** | Mobile-first design that works on all devices |
| 🌙 **Dark Mode** | Complete dark theme support |
| ♿ **Accessibility** | WCAG AA compliant components |

</div>

---

## 🍽️ South Indian Dishes

The application includes **100+ authentic South Indian dishes** across various categories:

### 🥘 Main Categories

- **🍛 Dosas**: Masala Dosa, Rava Dosa, Mysore Dosa, Paper Dosa, and more
- **🍚 Idlis**: Plain Idli, Kanchipuram Idli, Rava Idli, Poddu Idli
- **🥟 Vadas**: Medu Vada, Rava Vada, Masala Vada
- **🥞 Uttapams**: Onion, Tomato, Mixed Vegetable
- **🍚 Rice Dishes**: Pongal, Bisi Bele Bath, Curd Rice, Lemon Rice, and more
- **🍛 Biryani**: Hyderabadi, Chicken, Egg, Veg, Prawn
- **🍗 Chicken**: Chicken 65, Chettinad Chicken, Butter Chicken, and more
- **🐟 Fish & Seafood**: Kerala Fish Curry, Prawn Fry, Crab Curry
- **🥬 Vegetarian Curries**: Sambar, Rasam, Avial, and various Poriyals
- **🍽️ Thalis**: Veg Thali, Non-Veg Thali, South Indian Thali
- **🥞 Appams & Stews**: Appam with various stews
- **🍰 Desserts**: Payasam, Kozhukattai, Gulab Jamun, and more
- **☕ Beverages**: Filter Coffee, Masala Chai, Buttermilk, and more

> 📊 **Distribution**: 50% Vegetarian | 50% Non-Vegetarian

---

## 🔐 Authentication

The application uses **JWT-based authentication** with:

- 🔑 **Access Tokens**: Short-lived (15 minutes) for API requests
- 🔄 **Refresh Tokens**: Long-lived (7 days) stored in HTTP-only cookies
- ⚡ **Automatic Token Refresh**: Handled by Axios interceptors
- 🛡️ **Secure Storage**: Tokens stored securely with proper expiration

---

## 📡 Real-time Features

- ⚡ **Order Tracking**: Real-time order status updates using Socket.io
- 🔔 **Admin Notifications**: Instant notifications for new orders
- 📊 **Status Updates**: Live order status changes visible to users
- 🔄 **Auto Progress**: Automatic order progression for scheduled orders

---

## 💰 Payment & Pricing

- 💵 **GST Calculation**: 18% GST automatically calculated
- 🚚 **Delivery Charges**: ₹30 per restaurant (for multi-restaurant orders)
- 🎟️ **Promo Codes**: Percentage or fixed discount support
- 💳 **Wallet System**: Mock wallet for payments
- 💳 **Multiple Payment Methods**: Cash, Wallet, Card, UPI

---

## 🧪 Testing Accounts

After seeding the database, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| 👨‍💼 **Admin** | `admin@foodie.com` | `Foodie@2025` |
| 👤 **User** | `user1@foodie.com` | `user123` |
| 👨‍💼 **Manager** | `manager1@foodie.com` | `manager123` |

> 📝 **Note**: There are 50 regular users and 18 managers created by the seed script.

---

## 📡 API Documentation

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login user | ❌ |
| `POST` | `/api/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/api/auth/logout` | Logout user | ✅ |
| `GET` | `/api/auth/me` | Get current user | ✅ |

### 🏪 Restaurant Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/restaurants` | Get all restaurants | ❌ |
| `GET` | `/api/restaurants/:id` | Get restaurant by ID | ❌ |
| `POST` | `/api/restaurants` | Create restaurant | ✅ (Admin/Manager) |
| `PUT` | `/api/restaurants/:id` | Update restaurant | ✅ (Admin/Manager) |
| `DELETE` | `/api/restaurants/:id` | Delete restaurant | ✅ (Admin) |

### 🍛 Dish Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/dishes` | Get all dishes (with filters) | ❌ |
| `GET` | `/api/dishes/:id` | Get dish by ID | ❌ |
| `GET` | `/api/dishes/categories` | Get all categories | ❌ |
| `POST` | `/api/dishes` | Create dish | ✅ (Admin/Manager) |
| `PUT` | `/api/dishes/:id` | Update dish | ✅ (Admin/Manager) |
| `DELETE` | `/api/dishes/:id` | Delete dish | ✅ (Admin/Manager) |

### 📦 Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/orders` | Create order | ✅ |
| `GET` | `/api/orders/my-orders` | Get user orders | ✅ |
| `GET` | `/api/orders/:id` | Get order by ID | ✅ |
| `PUT` | `/api/orders/:id/cancel` | Cancel order | ✅ |

### 👨‍💼 Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/dashboard` | Get dashboard stats | ✅ (Admin) |
| `GET` | `/api/admin/orders` | Get all orders | ✅ (Admin) |
| `PUT` | `/api/admin/orders/:id/status` | Update order status | ✅ (Admin) |
| `GET` | `/api/admin/users` | Get all users | ✅ (Admin) |
| `PUT` | `/api/admin/users/:id` | Update user | ✅ (Admin) |
| `POST` | `/api/admin/categories` | Create category | ✅ (Admin) |
| `PUT` | `/api/admin/categories/:id` | Update category | ✅ (Admin) |
| `DELETE` | `/api/admin/categories/:id` | Delete category | ✅ (Admin) |
| `GET` | `/api/admin/promo-codes` | Get all promo codes | ✅ (Admin) |
| `POST` | `/api/admin/promo-codes` | Create promo code | ✅ (Admin) |
| `PUT` | `/api/admin/promo-codes/:id` | Update promo code | ✅ (Admin) |

### 👤 User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `PUT` | `/api/user/profile` | Update profile | ✅ |
| `POST` | `/api/user/addresses` | Add address | ✅ |
| `PUT` | `/api/user/addresses/:id` | Update address | ✅ |
| `DELETE` | `/api/user/addresses/:id` | Delete address | ✅ |
| `GET` | `/api/user/wallet` | Get wallet balance | ✅ |
| `POST` | `/api/user/wallet/add` | Add wallet balance | ✅ |

---

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

### Available Scripts

#### Server Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run seed` | Seed database with sample data |
| `npm run update-admin-password` | Update admin password |
| `npm run update-user-names` | Update user names |
| `npm run update-manager-names` | Update manager names |
| `npm run update-dish-veg-status` | Update dish veg/non-veg status |
| `npm run update-dish-names` | Update dish names for veg status |

#### Client Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><b>MongoDB Connection Issues</b></summary>

- Ensure MongoDB is running: `mongod` or check service status
- Verify connection string in `.env` file
- Check if port 27017 is available
- For MongoDB Atlas, ensure IP whitelist includes your IP

</details>

<details>
<summary><b>Port Already in Use</b></summary>

- Change `PORT` in server `.env` file
- Change Vite port in `client/vite.config.ts`
- Kill process using the port: `npm run kill-port` (if script exists)

</details>

<details>
<summary><b>CORS Issues</b></summary>

- Verify `CLIENT_URL` in server `.env` matches frontend URL
- Check CORS configuration in `server/server.js`
- Ensure no trailing slashes in URLs

</details>

<details>
<summary><b>Authentication Issues</b></summary>

- Clear browser cookies and localStorage
- Verify JWT secrets in `.env` file
- Check token expiration settings

</details>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Jayasakthi**

- GitHub: [@Jayasakthi-07](https://github.com/Jayasakthi-07)

---

## 🙏 Acknowledgments

- Built with ❤️ for showcasing authentic South Indian cuisine
- Inspired by modern food delivery platforms
- Thanks to all the open-source libraries that made this possible

---

<div align="center">

### ⚠️ Production Notes

**For production use, ensure:**
- 🔐 Strong JWT secrets
- 🔒 Secure MongoDB connection
- ✅ Proper error handling
- 🛡️ Input validation
- 🚦 Rate limiting
- 🔐 HTTPS encryption
- 🌍 Environment-specific configurations

---

**⭐ If you like this project, give it a star!**

Made with ❤️ and ☕

</div>
