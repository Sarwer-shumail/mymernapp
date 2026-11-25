import express from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();
router.get("/", async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    const counts = await Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
    const countByName = new Map(counts.map(item => [item._id, item.count]));
    res.json(categories.map(category => ({ ...category, productCount: countByName.get(category.name) || 0 })));
  } catch (error) {
    console.error("List categories failed:", error.message);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

router.post("/", authorize("admin", "manager"), async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });
    const last = await Category.findOne().sort({ id: -1 }).select("id").lean();
    const category = await Category.create({ id: (last?.id || 0) + 1, name, description: req.body.description || "", color: req.body.color || "blue" });
    res.status(201).json({ category, productCount: 0 });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That category already exists" });
    console.error("Create category failed:", error.message);
    res.status(500).json({ message: "Failed to create category" });
  }
});

router.put("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const category = await Category.findOne({ id: Number(req.params.id) });
    if (!category) return res.status(404).json({ message: "Category not found" });
    const oldName = category.name;
    if (req.body.name !== undefined && !req.body.name.trim()) return res.status(400).json({ message: "Category name is required" });
    if (req.body.name !== undefined) category.name = req.body.name.trim();
    if (req.body.description !== undefined) category.description = req.body.description.trim();
    if (req.body.color !== undefined) category.color = req.body.color;
    await category.save();
    if (oldName !== category.name) {
      await Promise.all([
        Product.updateMany({ category: oldName }, { $set: { category: category.name } }),
        Supplier.updateMany({ category: oldName }, { $set: { category: category.name } }),
      ]);
    }
    const productCount = await Product.countDocuments({ category: category.name });
    res.json({ ...category.toObject(), productCount });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That category already exists" });
    console.error("Update category failed:", error.message);
    res.status(500).json({ message: "Failed to update category" });
  }
});

router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  try {
    const category = await Category.findOne({ id: Number(req.params.id) });
    if (!category) return res.status(404).json({ message: "Category not found" });
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount) return res.status(409).json({ message: `Move or delete the ${productCount} products in this category first` });
    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Delete category failed:", error.message);
    res.status(500).json({ message: "Failed to delete category" });
  }
});
export default router;
