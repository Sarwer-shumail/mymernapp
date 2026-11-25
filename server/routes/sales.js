import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

// GET all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error.message);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

// POST create sale (checkout) - decrements product stock
router.post("/", authorize("admin", "manager", "cashier"), async (req, res) => {
  const decrementedItems = [];
  try {
    const { customer, customerId, items } = req.body;

    if (!customer?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Customer and items are required" });
    }

    let customerRecord = null;
    if (customerId !== undefined && customerId !== null && customerId !== "") {
      const parsedCustomerId = Number(customerId);
      if (!Number.isInteger(parsedCustomerId) || parsedCustomerId < 1) {
        return res.status(400).json({ message: "Please provide a valid customer" });
      }
      customerRecord = await Customer.findOne({ id: parsedCustomerId });
      if (!customerRecord) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    // Verify stock and build sale lines from current database values. Never
    // trust prices or product names submitted by the browser.
    let total = 0;
    const saleItems = [];
    const seenProducts = new Set();
    for (const item of items) {
      if (
        !item ||
        !Number.isInteger(item.productId) ||
        item.productId < 1 ||
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        seenProducts.has(item.productId)
      ) {
        return res.status(400).json({ message: "Each product must have a valid quantity and appear only once" });
      }
      seenProducts.add(item.productId);

      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }
      total += product.price * item.qty;
      saleItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        ...(product.purchasePrice !== undefined && product.purchasePrice !== null
          ? { unitCost: product.purchasePrice }
          : {}),
        qty: item.qty,
      });
    }

    // Generate sale ID
    const lastSale = await Sale.findOne().sort({ createdAt: -1 });
    const saleNumber = lastSale
      ? parseInt(lastSale.id.replace("S-", "")) + 1
      : 1000;
    const saleId = `S-${saleNumber}`;

    // Decrement stock conditionally so concurrent checkouts cannot oversell.
    for (const item of saleItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      );
      if (!updatedProduct) {
        await Promise.all(decrementedItems.map(decremented =>
          Product.updateOne({ id: decremented.productId }, { $inc: { stock: decremented.qty } })
        ));
        decrementedItems.length = 0;
        return res.status(409).json({ message: "Stock changed during checkout. Refresh inventory and try again." });
      }
      decrementedItems.push(item);
    }

    // Create sale record
    const newSale = await Sale.create({
      id: saleId,
      customer: customerRecord?.name || customer.trim(),
      ...(customerRecord ? { customerId: customerRecord.id } : {}),
      items: saleItems,
      total,
      status: "Completed",
    });

    res.status(201).json({
      message: "Sale completed successfully!",
      sale: newSale,
    });
  } catch (error) {
    if (decrementedItems.length) {
      try {
        await Promise.all(decrementedItems.map(item =>
          Product.updateOne({ id: item.productId }, { $inc: { stock: item.qty } })
        ));
      } catch (rollbackError) {
        console.error("Sale stock rollback failed:", rollbackError.message);
      }
    }
    console.error("Error creating sale:", error.message);
    res.status(500).json({ message: "Failed to create sale" });
  }
});

export default router;
