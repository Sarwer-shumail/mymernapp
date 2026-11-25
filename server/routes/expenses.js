import express from "express";
import Expense from "../models/Expense.js";

const router = express.Router();
const validExpense = body => body.category?.trim() && body.description?.trim() && Number.isFinite(Number(body.amount)) && Number(body.amount) > 0;
router.get("/", async (req, res) => {
  try {
    const { from, to, category } = req.query;
    const filter = {};
    if (from || to) filter.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
    if (category) filter.category = category;
    res.json(await Expense.find(filter).sort({ date: -1 }).lean());
  } catch (error) {
    console.error("List expenses failed:", error.message);
    res.status(500).json({ message: "Failed to load expenses" });
  }
});
router.post("/", async (req, res) => {
  try {
    if (!validExpense(req.body)) return res.status(400).json({ message: "Enter an expense category, description, and amount greater than zero" });
    const last = await Expense.findOne().sort({ id: -1 }).select("id").lean();
    const expense = await Expense.create({ ...req.body, id: (last?.id || 0) + 1, amount: Number(req.body.amount), date: req.body.date || new Date(), createdBy: req.user?._id });
    res.status(201).json(expense);
  } catch (error) {
    console.error("Create expense failed:", error.message);
    res.status(500).json({ message: "Failed to save expense" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const expense = await Expense.findOne({ id: Number(req.params.id) });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    const next = { ...expense.toObject(), ...req.body };
    if (!validExpense(next)) return res.status(400).json({ message: "Enter an expense category, description, and amount greater than zero" });
    expense.category = next.category.trim(); expense.description = next.description.trim(); expense.amount = Number(next.amount); expense.paymentMethod = next.paymentMethod; expense.date = next.date;
    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error("Update expense failed:", error.message);
    res.status(500).json({ message: "Failed to update expense" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await Expense.findOneAndDelete({ id: Number(req.params.id) });
    if (!result) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Delete expense failed:", error.message);
    res.status(500).json({ message: "Failed to delete expense" });
  }
});
export default router;
