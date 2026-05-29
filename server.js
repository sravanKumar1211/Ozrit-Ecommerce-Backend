import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import sequelize from "./config/db.js";
import UserRoutes from "./routes/userRoutes.js";
import CategoryRoutes from "./routes/InventoyRoutes/categoryRoutes.js";
import SubCategoryRoutes from "./routes/InventoyRoutes/subCategoryRoutes.js";
import BrandRoutes from "./routes/InventoyRoutes/brandRoutes.js";
import ProductRoutes from "./routes/InventoyRoutes/productRoutes.js";
import ProductVariantRoutes from "./routes/InventoyRoutes/productVariantRoutes.js";
import CartRoutes from "./routes/cartRoutes.js";
import CouponRoutes from "./routes/couponRoutes.js";
import OrderRoutes from "./routes/orderRoutes.js";
import PaymentRoutes from "./routes/paymentRoutes.js";
import ChatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { initializeChatSocket } from "./socket/chatSocketHandler.js";

dotenv.config();
const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : []).concat(["http://localhost:5174","http://localhost:5173",process.env.FRONTEND_URL]).filter(Boolean);

app.set('trust proxy', 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Crucial for sending cookies/sessions back and forth
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(cookieParser());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server running successfully",
  });
});

app.use("/api", UserRoutes);
app.use("/api/categories", CategoryRoutes);
app.use("/api/subcategories", SubCategoryRoutes);
app.use("/api/brands", BrandRoutes);
app.use("/api/products", ProductRoutes);
app.use("/api/productVariant", ProductVariantRoutes);
app.use("/api/cart", CartRoutes);
app.use("/api/coupons", CouponRoutes);
app.use("/api", OrderRoutes);
app.use("/api/payment", PaymentRoutes);
app.use("/api/chat", ChatRoutes);

// Central error handler
app.use(errorHandler);

// DB Connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

   //Sync models during development; keep production defaults stable
    // await sequelize.sync({
    //   alter: process.env.NODE_ENV !== "production",
    // });

    console.log("Models synchronized");

    const PORT = process.env.PORT || 5000;
    
    // Create HTTP server for Socket.IO
    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // Initialize chat socket events
    initializeChatSocket(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(
      "Server start error:",
      error
    );
  }
};

startServer();
