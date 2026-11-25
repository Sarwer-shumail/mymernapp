import express from "express";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

// GET all suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ id: 1 });
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error.message);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

// POST create supplier
router.post("/", authorize("admin", "manager"), async (req, res) => {
  try {
    const { name, category, phone } = req.body;

    if (!name?.trim() || !category?.trim() || !/^0\d{10}$/.test(phone?.trim() || "")) {
      return res.status(400).json({ message: "Provide a supplier name, category, and 11-digit contact number starting with 0" });
    }

    // Generate unique ID
    const lastSupplier = await Supplier.findOne().sort({ id: -1 });
    const nextId = lastSupplier ? lastSupplier.id + 1 : 1;

    const newSupplier = await Supplier.create({
      id: nextId,
      name: name.trim(),
      category: category.trim(),
      phone: phone.trim(),
    });

    res.status(201).json({
      message: "Supplier added successfully!",
      supplier: newSupplier,
    });
  } catch (error) {
    console.error("Error adding supplier:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: "A supplier with this ID already exists" });
    }
    res.status(500).json({ message: "Failed to add supplier" });
  }
});

// DELETE supplier
router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const deleted = await Supplier.findOneAndDelete({ id: supplierId });
    if (!deleted) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    await Product.updateMany({ supplierId }, { $unset: { supplierId: "" } });
    res.json({ message: "Supplier deleted successfully!" });
  } catch (error) {
    console.error("Error deleting supplier:", error.message);
    res.status(500).json({ message: "Failed to delete supplier" });
  }
});

export default router;
