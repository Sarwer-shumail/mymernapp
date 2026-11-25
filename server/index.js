import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import supplierRoutes from "./routes/suppliers.js";
import saleRoutes from "./routes/sales.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import expenseRoutes from "./routes/expenses.js";
import purchaseRoutes from "./routes/purchases.js";
import { authenticate, authorize } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Health check
app.get("/", (req, res) => {
  res.send("POS Backend is running!");
});

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "connected" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", authenticate, categoryRoutes);
app.use("/api/expenses", authenticate, authorize("admin", "manager"), expenseRoutes);
app.use("/api/purchases", authenticate, authorize("admin", "manager"), purchaseRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
