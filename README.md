# 🛒 Ozrit E-Commerce Backend API

This repository houses the production-ready REST API and WebSocket (Socket.IO) server powering the Ozrit E-Commerce application. It connects directly with a MySQL Database hosted on Railway and exposes endpoints consumed by the User UI and Admin Dashboard.

## 🚀 Deployed Links
- **Backend API URL:** [https://ozrit-ecommerce-backend.onrender.com](https://ozrit-ecommerce-backend.onrender.com)
- **User UI Website:** [https://ozrit-shop.vercel.app](https://ozrit-shop.vercel.app)
- **Admin Dashboard URL:** [https://ozrit-admin.vercel.app/login](https://ozrit-admin.vercel.app/login)

---

## 🔑 Admin Credentials
For testing and logging into the **Admin Dashboard**:
* **Email:** `sravankumargaddamedhi@gmail.com`
* **Password:** `admin@123`

---

## 🛠️ Technology Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database ORM:** Sequelize
- **Database System:** MySQL (Hosted on Railway)
- **WebSockets:** Socket.IO
- **Deployment Platform:** Render (Web Service)

---

## ⚙️ Environment Variables Config (.env)

Make sure the following variables are set on your local `.env` and Render dashboard:

```text
PORT=5000
NODE_ENV=production

# ─── Railway MySQL Connection ───
DB_HOST=zephyr.proxy.rlwy.net
DB_PORT=23790
DB_USER=root
DB_PASSWORD=zRDysqiAahZZYihbJKBTbMUHSNVvfreN
DB_NAME=railway

# ─── Auth ───
JWT_SECRET=mysecret

# ─── CORS Configuration ───
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://ozrit-shop.vercel.app,https://ozrit-admin.vercel.app

# ─── Front-end App URLs ───
FRONTEND_URL=https://ozrit-shop.vercel.app
ADMIN_URL=https://ozrit-admin.vercel.app
BASE_URL=https://ozrit-ecommerce-backend.onrender.com
```

---

## 📦 How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Run Development Server:**
   ```bash
   npm run dev
   ```
3. **Start Production Server:**
   ```bash
   npm start
   ```

---

## 📊 Database Seeders
To seed the default admin account into the database, run:
```bash
node seeders/adminSeeder.js
```
*Note: The seeder checks if the admin email `sravankumargaddamedhi@gmail.com` already exists to prevent duplicate seeding.*