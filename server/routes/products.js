import express from "express";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// POST create product
router.post("/", authorize("admin", "manager"), async (req, res) => {
  try {
    const { id, name, sku, price, purchasePrice, stock, category } = req.body;

    // Check that all required fields are provided (id is now optional - will auto-generate)
    if (
      !name?.trim() ||
      price === undefined ||
      purchasePrice === undefined ||
      stock === undefined ||
      !category?.trim()
    ) {
      return res.status(400).json({
        message: "Please provide name, selling price, purchase cost, stock, and category",
      });
    }

    // Check that numeric fields contain valid values
    if (
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      !Number.isFinite(Number(purchasePrice)) || Number(purchasePrice) < 0 ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        message: "Please provide a valid price and stock",
      });
    }

    // Auto-generate ID if not provided
    let productId = id;
    if (productId === undefined || productId === "") {
      const lastProduct = await Product.findOne().sort({ id: -1 });
      productId = lastProduct ? lastProduct.id + 1 : 1;
    } else {
      productId = Number(productId);
      if (!Number.isInteger(productId) || productId < 1) {
        return res.status(400).json({
          message: "Please provide a valid id",
        });
      }
    }

    // Create and save the product in MongoDB
    const newProduct = await Product.create({
      id: productId,
      name: name.trim(),
      sku: sku?.trim() || "",
      price: Number(price),
      purchasePrice: Number(purchasePrice),
      stock: Number(stock),
      category: category.trim(),
    });

    res.status(201).json({
      message: "Product added successfully!",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this ID already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Product validation failed",
      });
    }

    res.status(500).json({
      message: "Failed to add product",
    });
  }
});

// Add stock to the existing product atomically, without overwriting a newer
// quantity written by a sale or another restock request.
router.post("/:id/restock", authorize("admin", "manager"), async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Provide a valid product and a whole-number restock quantity" });
    }

    const update = { $inc: { stock: quantity } };
    if (req.body.supplierId !== undefined && req.body.supplierId !== "") {
      const supplierId = Number(req.body.supplierId);
      if (!Number.isInteger(supplierId) || supplierId < 1) {
        return res.status(400).json({ message: "Please provide a valid supplier" });
      }
      if (!await Supplier.exists({ id: supplierId })) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      update.$set = { supplierId };
    }

    const product = await Product.findOneAndUpdate({ id: productId }, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product restocked successfully", product });
  } catch (error) {
    console.error("Restock product failed:", error.message);
    res.status(500).json({ message: "Failed to restock product" });
  }
});

// PUT update product
router.put("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const { name, sku, category, price, purchasePrice, stock, supplierId } = req.body;

    if (
      (name !== undefined && !name?.trim()) ||
      (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) ||
      (purchasePrice !== undefined && (!Number.isFinite(Number(purchasePrice)) || Number(purchasePrice) < 0)) ||
      (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0))
    ) {
      return res.status(400).json({ message: "Please provide valid name, price, and stock" });
    }

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (sku !== undefined) update.sku = sku.trim();
    if (category !== undefined) update.category = category.trim();
    if (price !== undefined) update.price = Number(price);
    if (purchasePrice !== undefined) update.purchasePrice = Number(purchasePrice);
    if (stock !== undefined) update.stock = Number(stock);
    if (supplierId !== undefined) {
      const parsedSupplierId = Number(supplierId);
      if (!Number.isInteger(parsedSupplierId) || parsedSupplierId < 1) {
        return res.status(400).json({ message: "Please provide a valid supplier" });
      }
      const supplierExists = await Supplier.exists({ id: parsedSupplierId });
      if (!supplierExists) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      update.supplierId = parsedSupplierId;
    }

    const updated = await Product.findOneAndUpdate({ id: productId }, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully!", product: updated });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ message: "Failed to update product" });
  }
});

// DELETE product
router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const deleted = await Product.findOneAndDelete({ id: productId });
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;
